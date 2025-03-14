// app/lib/services/dashboard-service.ts
import { prisma } from '@/app/lib/prisma';
import { ApiKeyService } from './api-key-service';
import { BinanceService } from './binance-service';

export interface AssetBalance {
  symbol: string;
  value: number;
  percentage: number;
  color: string;
  quantity: number;    // Quantidade do token
  pricePerUnit: number; // Preço unitário do token
}

export interface MarketPair {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
}

export interface DashboardData {
  totalBalance: number;
  dailyChange: number;
  totalProfit: number;
  activeStrategies: number;
  portfolio: AssetBalance[];
  marketOverview: MarketPair[];
}

export interface StrategyOverview {
  id: string;
  name: string;
  symbol: string;
  type: string;
  active: boolean;
  lastRun: string | null;
  performance: number | null;
}

export interface TradeOverview {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
  strategy: string | null;
  status: string;
}

export class DashboardService {
  // Cores para o gráfico de portfolio
  private static ASSET_COLORS = {
    'BTC': '#F7931A',
    'ETH': '#627EEA',
    'BNB': '#F3BA2F',
    'SOL': '#00FFA3',
    'ADA': '#0033AD',
    'XRP': '#00AAE4',
    'DOGE': '#C3A634',
    'DOT': '#E6007A',
    'USDT': '#26A17B',
    'USDC': '#2775CA',
    // Cores para outros ativos
    'default': '#6B7280'
  };

  /**
   * Busca os dados completos do dashboard para o usuário
   */
  static async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      // 1. Verificar se o usuário tem uma chave API ativa
      const apiKeys = await ApiKeyService.getApiKeys(userId);
      
      if (!apiKeys || apiKeys.length === 0) {
        // Retornar dados vazios se não houver chave API
        return {
          totalBalance: 0,
          dailyChange: 0,
          totalProfit: 0,
          activeStrategies: 0,
          portfolio: this.getFallbackPortfolioData(), // Usar dados de exemplo em desenvolvimento
          marketOverview: []
        };
      }
      
      // Usar a primeira chave API encontrada
      const apiKeyId = apiKeys[0].id!;
      
      try {
        // 2. Buscar saldos da conta do usuário através da API da Binance
        const accountBalance = await BinanceService.getAccountBalance(apiKeyId, userId);
        
        // 3. Buscar dados de mercado para pares importantes
        const marketData = await this.fetchMarketData(apiKeyId, userId);
        
        // 4. Buscar estratégias ativas
        const activeStrategies = await this.getActiveStrategiesCount(userId);
        
        // 5. Calcular portfolio baseado nos saldos
        const portfolio = await this.calculatePortfolio(accountBalance, marketData);
        
        // 6. Calcular métricas gerais (saldo total, variação 24h, lucro total)
        const totalBalance = portfolio.reduce((sum, asset) => sum + asset.value, 0);
        
        // Calcular a variação diária baseada nos ativos e suas variações de preço
        const dailyChange = this.calculateDailyChange(portfolio, marketData);
        
        // Buscar lucro total do banco de dados
        const totalProfit = await this.calculateTotalProfit(userId);
        
        return {
          totalBalance,
          dailyChange,
          totalProfit,
          activeStrategies,
          portfolio,
          marketOverview: marketData
        };
      } catch (apiError) {
        // Se ocorrer erro na comunicação com a API, usar dados de fallback
        console.error('Erro ao comunicar com a API da Binance:', apiError);
        
        // Registrar o erro para fins de monitoramento
        // await this.logApiError(userId, apiError);
        
        // Buscar dados do banco de dados mesmo sem API
        const activeStrategies = await this.getActiveStrategiesCount(userId);
        const totalProfit = await this.calculateTotalProfit(userId);
        
        // Retornar com dados parciais, usando fallback para portfolio
        return {
          totalBalance: 0,
          dailyChange: 0,
          totalProfit,
          activeStrategies,
          portfolio: this.getFallbackPortfolioData(), // Usar dados de exemplo em desenvolvimento
          marketOverview: []
        };
      }
    } catch (error) {
      console.error('Erro geral ao buscar dados do dashboard:', error);
      
      // Retornar dados vazios em caso de erro
      return {
        totalBalance: 0,
        dailyChange: 0,
        totalProfit: 0,
        activeStrategies: 0,
        portfolio: [], // Em produção com erro, não mostrar dados de exemplo
        marketOverview: []
      };
    }
  }
  /**
   * Busca estratégias ativas para o dashboard
   */
  static async getActiveStrategies(userId: string): Promise<StrategyOverview[]> {
    try {
      const strategies = await prisma.strategy.findMany({
        where: {
          userId,
          active: true
        },
        select: {
          id: true,
          name: true,
          symbol: true,
          type: true,
          active: true,
          lastRun: true,
          performance: true
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 3 // Limitar a 3 estratégias para o dashboard
      });
      
      return strategies;
    } catch (error) {
      console.error('Erro ao buscar estratégias ativas:', error);
      return [];
    }
  }

  /**
 * Busca ordens recentes do usuário
 * @param apiKeyId ID da chave API
 * @param userId ID do usuário
 * @returns Lista de ordens recentes
 */
static async getRecentOrders(apiKeyId: string, userId: string): Promise<any[]> {
  try {
    // Recuperar dados da chave API
    const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
    
    // Determinar a URL base baseada no tipo de exchange
    const baseUrl = apiKeyData.exchange === 'binance_us' 
      ? 'https://api.binance.us' 
      : 'https://api.binance.com';
    
    // Tentar buscar apenas as ordens abertas (endpoint sem necessidade do parâmetro symbol)
    try {
      const openOrders = await this.makeSignedRequest(
        '/api/v3/openOrders',
        {},
        'GET',
        apiKeyData.apiKey,
        apiKeyData.apiSecret,
        baseUrl
      );
      
      if (openOrders && openOrders.length > 0) {
        return openOrders;
      }
    } catch (openOrdersError) {
      console.log('Aviso: Não foi possível buscar ordens abertas', openOrdersError);
      // Continuar para outras abordagens
    }
    
    // Tentar buscar o histórico de trades do usuário (não necessita do parâmetro symbol)
    try {
      const myTrades = await this.makeSignedRequest(
        '/api/v3/myTrades',
        {},
        'GET',
        apiKeyData.apiKey,
        apiKeyData.apiSecret,
        baseUrl
      );
      
      if (myTrades && myTrades.length > 0) {
        return myTrades;
      }
    } catch (myTradesError) {
      console.log('Aviso: Não foi possível buscar histórico de trades', myTradesError);
      // Continuar para outras abordagens
    }
    
    // Se as opções anteriores falharam, precisamos da lista de símbolos negociados
    // para buscar histórico de ordens por símbolo
    try {
      // Obter preços para descobrir quais símbolos estão disponíveis
      const prices = await this.makePublicRequest(
        '/api/v3/ticker/price',
        {},
        baseUrl
      );
      
      // Limitar a quantidade de símbolos para evitar muitas chamadas
      const symbolsToCheck = prices
        .filter(p => p.symbol.endsWith('USDT') || p.symbol.endsWith('BTC'))
        .slice(0, 5) // Verificar apenas os primeiros 5 símbolos populares
        .map(p => p.symbol);
      
      // Array para acumular ordens de diferentes símbolos
      let allOrders = [];
      
      // Buscar ordens para cada símbolo
      for (const symbol of symbolsToCheck) {
        try {
          const orders = await this.makeSignedRequest(
            '/api/v3/allOrders',
            { symbol },
            'GET',
            apiKeyData.apiKey,
            apiKeyData.apiSecret,
            baseUrl
          );
          
          if (orders && orders.length > 0) {
            allOrders = [...allOrders, ...orders];
          }
        } catch (error) {
          console.log(`Não foi possível buscar ordens para ${symbol}`, error);
        }
      }
      
      if (allOrders.length > 0) {
        return allOrders;
      }
    } catch (symbolError) {
      console.log('Erro ao buscar lista de símbolos', symbolError);
    }
    
    // Se todas as tentativas falharem, retorna array vazio
    return [];
  } catch (error) {
    console.error('Erro ao buscar ordens recentes:', error);
    return [];
  }
}

  /**
   * Retorna dados vazios do dashboard para quando não há dados disponíveis
   */
  private static getEmptyDashboardData(): DashboardData {
    return {
      totalBalance: 0,
      dailyChange: 0,
      totalProfit: 0,
      activeStrategies: 0,
      portfolio: [],
      marketOverview: []
    };
  }
  
  /**
   * Busca dados de mercado para pares importantes
   */
  private static async fetchMarketData(apiKeyId: string, userId: string): Promise<MarketPair[]> {
    try {
      // Lista de pares importantes para mostrar no dashboard
      const importantPairs = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'
      ];
      
      // Buscar preços atuais
      const marketPrices = await BinanceService.getMarketPrices(apiKeyId, userId);
      
      // Buscar dados de 24h (variação, volume) para cada par
      const market24hData = await BinanceService.get24hMarketData(apiKeyId, userId);
      
      // Combinar dados
      return importantPairs.map(symbol => {
        const ticker = market24hData.find(t => t.symbol === symbol);
        return {
          symbol: this.formatSymbol(symbol), // Formatar como BTC/USDT
          price: parseFloat(marketPrices[symbol]) || 0,
          change24h: ticker ? parseFloat(ticker.priceChangePercent) : 0,
          volume: ticker ? parseFloat(ticker.volume) : 0
        };
      });
    } catch (error) {
      console.error('Erro ao buscar dados de mercado:', error);
      return [];
    }
  }
  
  /**
   * Calcula o portfolio baseado nos saldos e preços atuais
   */
  private static async calculatePortfolio(
    accountBalance: any,
    marketData: MarketPair[]
  ): Promise<AssetBalance[]> {
    try {
      // Filtrar saldos com valor maior que zero
      const nonZeroBalances = Object.entries(accountBalance)
        .filter(([_, balance]: [string, any]) => 
          parseFloat(balance.available) > 0 || parseFloat(balance.onOrder) > 0
        )
        .map(([asset, balance]: [string, any]) => {
          const quantity = parseFloat(balance.available) + parseFloat(balance.onOrder);
          
          // Buscar preço em USDT para o ativo
          let priceInUsdt = 1; // Padrão para stablecoins
          
          if (asset !== 'USDT' && asset !== 'USDC' && asset !== 'BUSD') {
            const pairSymbol = `${asset}/USDT`;
            const marketPair = marketData.find(p => p.symbol === pairSymbol);
            if (marketPair) {
              priceInUsdt = marketPair.price;
            }
          }
          
          // Calcular valor em USD
          const valueInUsdt = quantity * priceInUsdt;
          
          return {
            asset,
            quantity,
            priceInUsdt,
            valueInUsdt
          };
        })
        .filter(item => item.valueInUsdt > 1); // Filtrar ativos com valor menor que 1 USD
      
      // Calcular o valor total do portfolio
      const totalValue = nonZeroBalances.reduce((sum, item) => sum + item.valueInUsdt, 0);
      
      // Mapear para o formato final com percentagens
      const portfolio = nonZeroBalances.map(item => {
        const percentage = (item.valueInUsdt / totalValue) * 100;
        
        return {
          symbol: item.asset,
          value: item.valueInUsdt,
          percentage,
          color: this.ASSET_COLORS[item.asset] || this.ASSET_COLORS.default,
          quantity: item.quantity, // Adicionando quantidade ao objeto retornado
          pricePerUnit: item.priceInUsdt // Adicionando preço unitário ao objeto retornado
        };
      });
      
      // Ordenar do maior para o menor valor
      return portfolio.sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error('Erro ao calcular portfolio:', error);
      return [];
    }
  }
  /**
   * Calcula a variação diária baseada nos ativos e suas variações de preço
   */
  private static calculateDailyChange(
    portfolio: AssetBalance[],
    marketData: MarketPair[]
  ): number {
    try {
      if (portfolio.length === 0) return 0;
      
      // Calcular a média ponderada das variações dos ativos
      let weightedSum = 0;
      let totalWeight = 0;
      
      portfolio.forEach(asset => {
        const pairSymbol = `${asset.symbol}/USDT`;
        const marketPair = marketData.find(p => p.symbol === pairSymbol);
        
        if (marketPair) {
          weightedSum += marketPair.change24h * asset.value;
          totalWeight += asset.value;
        }
      });
      
      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    } catch (error) {
      console.error('Erro ao calcular variação diária:', error);
      return 0;
    }
  }
  
  /**
   * Busca o número de estratégias ativas
   */
  private static async getActiveStrategiesCount(userId: string): Promise<number> {
    try {
      const count = await prisma.strategy.count({
        where: {
          userId,
          active: true
        }
      });
      
      return count;
    } catch (error) {
      console.error('Erro ao contar estratégias ativas:', error);
      return 0;
    }
  }
  
  /**
   * Calcula o lucro total baseado nas operações realizadas
   */
  private static async calculateTotalProfit(userId: string): Promise<number> {
    try {
      // Buscar todas as operações de venda completas
      const sellTrades = await prisma.trade.findMany({
        where: {
          userId,
          side: 'SELL',
          status: 'FILLED'
        },
        select: {
          symbol: true,
          total: true
        }
      });
      
      // Buscar todas as operações de compra completas
      const buyTrades = await prisma.trade.findMany({
        where: {
          userId,
          side: 'BUY',
          status: 'FILLED'
        },
        select: {
          symbol: true,
          total: true
        }
      });
      
      // Calcular lucro total (vendas - compras)
      const totalSells = sellTrades.reduce((sum, trade) => sum + trade.total, 0);
      const totalBuys = buyTrades.reduce((sum, trade) => sum + trade.total, 0);
      
      return totalSells - totalBuys;
    } catch (error) {
      console.error('Erro ao calcular lucro total:', error);
      return 0;
    }
  }
  
/**
 * Formata símbolo de par (ex: BTCUSDT para BTC/USDT)
 * Adiciona verificação de valor undefined
 */
private static formatSymbol(symbol: string): string {
  if (!symbol) {
    return 'Desconhecido';
  }
  
  // Encontrar o ponto de divisão entre base e quote
  const quoteAssets = ['USDT', 'BTC', 'ETH', 'BNB', 'BUSD', 'USD', 'USDC'];
  
  for (const quote of quoteAssets) {
    if (symbol.endsWith(quote)) {
      const base = symbol.substring(0, symbol.length - quote.length);
      return `${base}/${quote}`;
    }
  }
  
  return symbol;
}

  /**
 * Busca operações recentes diretamente da API da Binance
 * @param userId ID do usuário
 * @returns Array de operações recentes
 */
private static async fetchRecentTradesFromBinance(userId: string): Promise<TradeOverview[]> {
  try {
    // 1. Verificar se o usuário tem uma chave API ativa
    const apiKeys = await ApiKeyService.getApiKeys(userId);
    
    if (!apiKeys || apiKeys.length === 0) {
      console.log('Nenhuma chave API encontrada para o usuário:', userId);
      return [];
    }
    
    // Usar a primeira chave API encontrada
    const apiKeyId = apiKeys[0].id!;
    
    // 2. Buscar histórico de ordens da Binance
    const recentOrders = await BinanceService.getRecentOrders(apiKeyId, userId);
    
    console.log(`Encontradas ${recentOrders.length} ordens recentes na Binance`);
    
    // 3. Verificar o formato da resposta e mapear para o formato TradeOverview
    if (recentOrders.length > 0) {
      // Verificar se a resposta é do endpoint allOrders ou openOrders
      if ('orderId' in recentOrders[0]) {
        // Formato de ordens
        return recentOrders
          .filter(order => order.status === 'FILLED') // Apenas ordens executadas
          .map(order => ({
            id: order.orderId.toString(),
            symbol: this.formatSymbol(order.symbol), // Converter BTCUSDT para BTC/USDT
            side: order.side as 'BUY' | 'SELL',
            quantity: parseFloat(order.executedQty || order.origQty),
            price: parseFloat(order.price),
            total: parseFloat(order.executedQty || order.origQty) * parseFloat(order.price),
            timestamp: new Date(order.time || order.updateTime).toISOString(),
            strategy: 'Manual', // Ordens da API são consideradas manuais
            status: order.status
          }));
      } 
      // Verificar se a resposta é do endpoint myTrades
      else if ('id' in recentOrders[0] && 'isBuyer' in recentOrders[0]) {
        // Formato de trades
        return recentOrders.map(trade => ({
          id: trade.id.toString(),
          symbol: this.formatSymbol(trade.symbol),
          side: trade.isBuyer ? 'BUY' : 'SELL',
          quantity: parseFloat(trade.qty),
          price: parseFloat(trade.price),
          total: parseFloat(trade.quoteQty),
          timestamp: new Date(trade.time).toISOString(),
          strategy: 'Manual',
          status: 'FILLED'
        }));
      }
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao buscar ordens recentes da Binance:', error);
    return [];
  }
}

/**
 * Remove trades duplicados baseado no ID da ordem
 * @param trades Lista de trades que pode conter duplicatas
 * @returns Lista de trades sem duplicatas
 */
private static removeDuplicateTrades(trades: TradeOverview[]): TradeOverview[] {
  const uniqueMap = new Map<string, TradeOverview>();
  
  // Prioriza manter o registro mais completo (com dados da estratégia)
  trades.forEach(trade => {
    const existingTrade = uniqueMap.get(trade.id);
    
    // Se não existe ou o atual tem estratégia enquanto o existente não
    if (!existingTrade || 
        (trade.strategy !== 'Manual' && existingTrade.strategy === 'Manual')) {
      uniqueMap.set(trade.id, trade);
    }
  });
  
  return Array.from(uniqueMap.values());
}

/**
 * Mapeia um registro de trade do banco de dados para o formato TradeOverview
 * @param trade Registro de trade do banco de dados
 * @returns Objeto no formato TradeOverview
 */
private static mapDbTradeToTradeOverview(trade: any): TradeOverview {
  return {
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side as 'BUY' | 'SELL',
    quantity: trade.quantity,
    price: trade.price,
    total: trade.total,
    timestamp: trade.createdAt.toISOString(),
    strategy: trade.strategy?.name || 'Manual',
    status: trade.status
  };
}

/**
 * Gera dados de portfólio de exemplo para testes
 */
private static generateMockPortfolioData(): AssetBalance[] {
  return [
    {
      symbol: 'BTC',
      value: 6542.87,
      percentage: 42.54,
      color: '#F7931A',
      quantity: 0.1521,
      pricePerUnit: 43015.58
    },
    {
      symbol: 'ETH',
      value: 2985.34,
      percentage: 23.67,
      color: '#627EEA',
      quantity: 0.8521,
      pricePerUnit: 3503.45
    },
    {
      symbol: 'BNB',
      value: 1685.21,
      percentage: 13.43,
      color: '#F3BA2F',
      quantity: 4.2154,
      pricePerUnit: 399.77
    },
    {
      symbol: 'SOL',
      value: 754.92,
      percentage: 6.06,
      color: '#00FFA3',
      quantity: 7.4523,
      pricePerUnit: 101.30
    },
    {
      symbol: 'USDT',
      value: 484.94,
      percentage: 3.89,
      color: '#26A17B',
      quantity: 484.94,
      pricePerUnit: 1.00
    }
  ];
}

/**
 * Use este método quando não conseguir obter dados reais
 */
private static getFallbackPortfolioData(): AssetBalance[] {
  // Verificar se estamos em ambiente de desenvolvimento
  const isDev = process.env.NODE_ENV === 'development';
  
  // Em desenvolvimento ou se configurado, retorna dados de exemplo
  if (isDev || process.env.USE_MOCK_DATA === 'true') {
    return this.generateMockPortfolioData();
  }
  
  // Em produção sem dados, retorna array vazio
  return [];
}




}