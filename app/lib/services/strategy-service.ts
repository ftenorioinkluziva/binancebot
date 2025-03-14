// lib/services/strategy-service.ts
import { Strategy } from '@/types/strategy';

export class StrategyService {
  static async getStrategies(): Promise<Strategy[]> {
    try {
      const response = await fetch('/api/strategies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Falha ao buscar estratégias');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro no serviço de estratégias:', error);
      throw error;
    }
  }
  
  static async getStrategy(id: string): Promise<Strategy> {
    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Falha ao buscar estratégia');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro no serviço de estratégias:', error);
      throw error;
    }
  }
  
  static async createStrategy(data: any): Promise<Strategy> {
    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar estratégia');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro no serviço de estratégias:', error);
      throw error;
    }
  }
  
  static async updateStrategy(id: string, data: any): Promise<Strategy> {
    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar estratégia');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro no serviço de estratégias:', error);
      throw error;
    }
  }
  
  static async deleteStrategy(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/strategies/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Falha ao excluir estratégia');
      }
      
      return true;
    } catch (error) {
      console.error('Erro no serviço de estratégias:', error);
      throw error;
    }
  }
  
  static async toggleStrategy(id: string): Promise<Strategy> {
    try {
      const response = await fetch(`/api/strategies/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Falha ao alternar estado da estratégia');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro no serviço de estratégias:', error);
      throw error;
    }
  }
}