// app/lib/services/api-key-service.ts
import { supabase } from '@/app/lib/supabase';
import { EncryptionService } from './encryption-service';

export interface ApiKeyData {
  id?: string;
  name: string;
  exchange: string;
  apiKey: string;
  apiSecret: string;
  permissions: string[];
}

export class ApiKeyService {
  static async getApiKeys(userId: string): Promise<ApiKeyData[]> {
    try {
      const { data, error } = await supabase
        .from('ApiKey')
        .select('id, name, exchange, apiKey, apiSecret, permissions, createdAt')
        .eq('userId', userId);

      if (error) throw error;

      // Não descriptografamos as chaves aqui - apenas retornamos os dados mascarados
      return data.map(key => ({
        ...key,
        apiKey: this.maskApiKey(key.apiKey),
        apiSecret: '••••••••••••••••••••••••••••••',
      }));
    } catch (error) {
      console.error('Erro ao buscar chaves API:', error);
      throw new Error('Falha ao buscar chaves API');
    }
  }

  static async getApiKey(id: string, userId: string): Promise<ApiKeyData> {
    try {
      const { data, error } = await supabase
        .from('ApiKey')
        .select('id, name, exchange, apiKey, apiSecret, permissions, createdAt')
        .eq('id', id)
        .eq('userId', userId)
        .single();

      if (error) throw error;

      // Descriptografamos as chaves apenas quando necessário
      return {
        ...data,
        apiKey: EncryptionService.decrypt(data.apiKey, userId),
        apiSecret: EncryptionService.decrypt(data.apiSecret, userId),
      };
    } catch (error) {
      console.error('Erro ao buscar chave API:', error);
      throw new Error('Falha ao buscar chave API');
    }
  }

  static async createApiKey(data: ApiKeyData, userId: string): Promise<ApiKeyData> {
    try {
      // Criptografamos as chaves antes de salvar
      const encryptedData = {
        ...data,
        userId,
        apiKey: EncryptionService.encrypt(data.apiKey, userId),
        apiSecret: EncryptionService.encrypt(data.apiSecret, userId),
      };

      const { data: createdKey, error } = await supabase
        .from('ApiKey')
        .insert([encryptedData])
        .select()
        .single();

      if (error) throw error;

      // Retornamos as chaves mascaradas
      return {
        ...createdKey,
        apiKey: this.maskApiKey(data.apiKey),
        apiSecret: '••••••••••••••••••••••••••••••',
      };
    } catch (error) {
      console.error('Erro ao criar chave API:', error);
      throw new Error('Falha ao criar chave API');
    }
  }

  static async updateApiKey(id: string, data: Partial<ApiKeyData>, userId: string): Promise<ApiKeyData> {
    try {
      // Se estiver atualizando as chaves, criptografamos
      const updateData: any = { ...data };
      
      if (data.apiKey) {
        updateData.apiKey = EncryptionService.encrypt(data.apiKey, userId);
      }
      
      if (data.apiSecret) {
        updateData.apiSecret = EncryptionService.encrypt(data.apiSecret, userId);
      }

      const { data: updatedKey, error } = await supabase
        .from('ApiKey')
        .update(updateData)
        .eq('id', id)
        .eq('userId', userId)
        .select()
        .single();

      if (error) throw error;

      // Retornamos as chaves mascaradas
      return {
        ...updatedKey,
        apiKey: this.maskApiKey(updatedKey.apiKey),
        apiSecret: '••••••••••••••••••••••••••••••',
      };
    } catch (error) {
      console.error('Erro ao atualizar chave API:', error);
      throw new Error('Falha ao atualizar chave API');
    }
  }

  static async deleteApiKey(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ApiKey')
        .delete()
        .eq('id', id)
        .eq('userId', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao excluir chave API:', error);
      throw new Error('Falha ao excluir chave API');
    }
  }

  static async validateApiKey(id: string, userId: string): Promise<boolean> {
    try {
      // Aqui você implementaria a verificação na exchange
      // Por exemplo, fazendo uma chamada de teste para a API da Binance
      const apiKey = await this.getApiKey(id, userId);
      
      // Exemplo simples - na implementação real você usaria o binance-connector
      // para fazer uma chamada de teste
      return true;
    } catch (error) {
      console.error('Erro ao validar chave API:', error);
      return false;
    }
  }

  // Função para mascarar a chave da API: exibe apenas os primeiros e últimos 4 caracteres
  private static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '••••••••••••••••';
    
    return apiKey.substring(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
  }
}