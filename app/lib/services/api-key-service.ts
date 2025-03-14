// app/lib/services/api-key-service.ts
import { supabase } from '@/app/lib/supabase';
import { EncryptionService } from './encryption-service';
import { v4 as uuidv4 } from 'uuid';
import { BinanceService } from './binance-service';

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
      // Verificar se já existe uma chave para esta exchange
      const { data: existingKeys, error: checkError } = await supabase
        .from('ApiKey')
        .select('id, exchange')
        .eq('userId', userId)
        .eq('exchange', data.exchange);
      
      if (checkError) {
        console.error('Erro ao verificar chaves existentes:', checkError);
        throw new Error('Falha ao verificar chaves existentes');
      }
      
      // Se já existe uma chave para esta exchange, retornar erro
      if (existingKeys && existingKeys.length > 0) {
        throw new Error(`Já existe uma chave API para ${data.exchange}. Por favor, edite ou remova a chave existente.`);
      }
      
      // Gerar um ID UUID para o novo registro
      const id = uuidv4();
      
      // Obter data/hora atual
      const now = new Date();
      
      // Criptografamos as chaves antes de salvar
      const encryptedData = {
        id,
        ...data,
        userId,
        apiKey: EncryptionService.encrypt(data.apiKey, userId),
        apiSecret: EncryptionService.encrypt(data.apiSecret, userId),
        createdAt: now,
        updatedAt: now
      };

      const { data: createdKey, error } = await supabase
        .from('ApiKey')
        .insert([encryptedData])
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      // Retornamos as chaves mascaradas
      return {
        ...createdKey,
        apiKey: this.maskApiKey(data.apiKey),
        apiSecret: '••••••••••••••••••••••••••••••',
      };
    } catch (error) {
      console.error('Erro ao criar chave API:', error);
      
      // Se for um erro de chave duplicada, retornar a mensagem específica
      if (error instanceof Error && error.message.includes('Já existe uma chave API')) {
        throw error;
      }
      
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

  static convertInternalPermissionsToBinance(internalPermissions: any): string[] {
    const permissions = [];
    
    // A leitura é sempre habilitada
    permissions.push('READ');
    
    if (internalPermissions.enableSpotAndMarginTrading) {
      permissions.push('SPOT');
      permissions.push('MARGIN');
    }
    
    if (internalPermissions.enableMarginLoan) {
      permissions.push('MARGIN_LOAN');
    }
    
    if (internalPermissions.enableUniversalTransfer) {
      permissions.push('TRANSFER');
    }
    
    if (internalPermissions.enableWithdraw) {
      permissions.push('WITHDRAW');
    }
    
    return permissions;
  }

  // Converte as permissões da Binance para nosso formato interno
  static convertBinancePermissionsToInternal(binancePermissions: string[]): any {
    return {
      enableReading: true, // Sempre habilitado
      enableSpotAndMarginTrading: 
        binancePermissions.includes('SPOT') || 
        binancePermissions.includes('MARGIN'),
      enableMarginLoan: binancePermissions.includes('MARGIN_LOAN'),
      enableUniversalTransfer: binancePermissions.includes('TRANSFER'),
      enableWithdraw: binancePermissions.includes('WITHDRAW'),
      enableSymbolPermissionList: false // Esta informação geralmente não vem da API
    };
  } 

  static async validateApiKey(id: string, userId: string): Promise<{
    valid: boolean;
    permissions: {
      spot: boolean;
      margin: boolean;
      futures: boolean;
      withdraw: boolean;
    };
    errorMessage?: string;
  }> {
    try {
      // Usar o BinanceService para validar a chave
      const validationResult = await BinanceService.validateApiKey(id, userId);
      
      // Se a validação for bem-sucedida, podemos opcionalmente atualizar as permissões
      // armazenadas para refletir as reais detectadas pela API
      if (validationResult.valid) {
        // Converta o formato de permissões detectadas
        const binancePerms = [];
        if (validationResult.permissions.spot) binancePerms.push('SPOT');
        if (validationResult.permissions.margin) binancePerms.push('MARGIN');
        if (validationResult.permissions.futures) binancePerms.push('FUTURES');
        if (validationResult.permissions.withdraw) binancePerms.push('WITHDRAW');
        
        const internalPermissions = this.convertBinancePermissionsToInternal(binancePerms);
        
        return {
          valid: true,
          permissions: internalPermissions
        };
      }
    } catch (error) {
      console.error('Erro ao validar chave API:', error);
      return {
        valid: false,
        permissions: {
          spot: false,
          margin: false,
          futures: false,
          withdraw: false
        },
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido ao validar a chave'
      };
    }
  }
  // Função para mascarar a chave da API: exibe apenas os primeiros e últimos 4 caracteres
  private static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '••••••••••••••••';
    
    return apiKey.substring(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
  }
}