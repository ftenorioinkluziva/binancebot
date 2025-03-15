// app/lib/services/trading-pair-service.ts
import { prisma } from '@/app/lib/prisma';
import { BinanceService } from './binance-service';

export interface TradingPairData {
  id?: string;
  symbol: string;
  active?: boolean;
}

export class TradingPairService {
  /**
   * Buscar todos os pares de trading de um usuário
   */
  static async getTradingPairs(userId: string): Promise<TradingPairData[]> {
    try {
      const pairs = await prisma.tradingPair.findMany({
        where: { userId },
        select: {
          id: true,
          symbol: true,
          active: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return pairs;
    } catch (error) {
      console.error('Erro ao buscar pares de trading:', error);
      throw new Error('Não foi possível recuperar os pares de trading');
    }
  }

  /**
   * Adicionar um novo par de trading
   */
  static async addTradingPair(userId: string, symbol: string): Promise<TradingPairData> {
    try {
      // Validar o símbolo usando a API da Binance
      const validSymbols = await this.getValidBinanceSymbols();
      
      if (!validSymbols.includes(symbol)) {
        throw new Error(`Símbolo ${symbol} não é válido na Binance`);
      }

      // Verificar se o par já existe para este usuário
      const existingPair = await prisma.tradingPair.findUnique({
        where: {
          userId_symbol: {
            userId,
            symbol
          }
        }
      });

      if (existingPair) {
        throw new Error(`O par ${symbol} já está cadastrado`);
      }

      // Criar novo par de trading
      const newPair = await prisma.tradingPair.create({
        data: {
          userId,
          symbol,
          active: true
        },
        select: {
          id: true,
          symbol: true,
          active: true
        }
      });

      return newPair;
    } catch (error) {
      console.error('Erro ao adicionar par de trading:', error);
      throw error;
    }
  }

  /**
   * Atualizar status de um par de trading
   */
  static async updateTradingPairStatus(
    id: string, 
    userId: string, 
    active: boolean
  ): Promise<TradingPairData> {
    try {
      const updatedPair = await prisma.tradingPair.update({
        where: { 
          id,
          userId 
        },
        select: {
          id: true,
          symbol: true,
          active: true
        },
        data: { 
          active,
          updatedAt: new Date()
        }
      });

      return updatedPair;
    } catch (error) {
      console.error('Erro ao atualizar status do par de trading:', error);
      throw new Error('Não foi possível atualizar o par de trading');
    }
  }

  /**
   * Remover um par de trading
   */
  static async removeTradingPair(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.tradingPair.delete({
        where: { 
          id,
          userId 
        }
      });

      return true;
    } catch (error) {
      console.error('Erro ao remover par de trading:', error);
      throw new Error('Não foi possível remover o par de trading');
    }
  }

  /**
   * Buscar símbolos válidos da Binance
   */
  static async getValidBinanceSymbols(): Promise<string[]> {
    try {
      // Para este método, precisamos de uma chave API de exemplo
      // Na prática, você pode manter uma lista de símbolos pré-definidos ou 
      // usar um método mais genérico de validação
      const apiKeys = await prisma.apiKey.findFirst({
        where: { exchange: 'binance' },
        select: { id: true, userId: true }
      });

      if (!apiKeys) {
        // Fallback para lista de símbolos comuns
        return [
          'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 
          'ADAUSDT', 'XRPUSDT', 'DOGEUSDT', 
          'SOLUSDT', 'MATICUSDT', 'DOTUSDT',
          'LTCUSDT', 'LINKUSDT'
        ];
      }

      // Buscar símbolos usando o serviço da Binance
      const symbols = await BinanceService.getAllTradingSymbols(
        apiKeys.id, 
        apiKeys.userId
      );

      return symbols;
    } catch (error) {
      console.error('Erro ao buscar símbolos válidos:', error);
      
      // Fallback para lista de símbolos comuns
      return [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 
        'ADAUSDT', 'XRPUSDT', 'DOGEUSDT', 
        'SOLUSDT', 'MATICUSDT', 'DOTUSDT',
        'LTCUSDT', 'LINKUSDT'
      ];
    }
  }
}