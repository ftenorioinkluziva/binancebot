// app/lib/services/binance-service.ts
//import Binance from 'node-binance-api';
//import { EncryptionService } from './encryption-service';
import { ApiKeyService } from './api-key-service';
import { DashboardService } from './dashboard-service';
import { prisma } from '@/app/lib/prisma';

export class BinanceService {

/**
 * Faz uma requisição assinada para a API da Binance
 * @param endpoint Endpoint da API
 * @param params Parâmetros da requisição
 * @param method Método HTTP
 * @param apiKey Chave da API
 * @param apiSecret Segredo da API
 * @param baseUrl URL base da API
 * @returns Resultado da requisição em formato JSON
 */
private static async makeSignedRequest(
  endpoint: string,
  params: any = {},
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  apiKey: string,
  apiSecret: string,
  baseUrl: string = 'https://api.binance.com'
) {
  try {
    // Adicionar timestamp necessário para assinatura
    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString()
    });
    
    // Verificar parâmetros obrigatórios com base no endpoint
    if (endpoint === '/api/v3/allOrders' && !params.symbol) {
      throw new Error('O parâmetro "symbol" é obrigatório para o endpoint allOrders');
    }
    
    if (endpoint === '/api/v3/myTrades' && !params.symbol) {
      throw new Error('O parâmetro "symbol" é obrigatório para o endpoint myTrades');
    }
    
    // Criar assinatura HMAC
    const signature = await this.createSignature(queryParams.toString(), apiSecret);
    queryParams.append('signature', signature);
    
    // Construir URL
    const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;
    
    // Log para debug
    console.log(`Fazendo requisição ${method} para ${endpoint} com parâmetros:`, params);
    
    // Fazer a requisição
    const response = await fetch(url, {
      method,
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.msg || 'Erro desconhecido na API da Binance';
      const errorCode = errorData.code || 'desconhecido';
      
      console.error(`Erro na API da Binance: Código ${errorCode} - ${errorMsg}`);
      
      // Fornecer mensagens de erro mais amigáveis para códigos comuns
      let enhancedErrorMsg = errorMsg;
      
      switch (errorCode) {
        case -2013:
          enhancedErrorMsg = 'Conta não encontrada, verifique suas credenciais de API';
          break;
        case -2015:
          enhancedErrorMsg = 'Chave da API inválida, permissão rejeitada';
          break;
        case -1022:
          enhancedErrorMsg = 'Assinatura inválida, verifique sua chave secreta';
          break;
        case -1121:
          enhancedErrorMsg = 'Símbolo inválido, verifique o parâmetro symbol';
          break;
      }
      
      throw new Error(`Erro ${errorCode}: ${enhancedErrorMsg}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    // Repassar o erro para ser tratado pelo chamador
    throw error;
  }
}
  private static async makePublicRequest(
    endpoint: string,
    params: any = {},
    baseUrl: string = 'https://api.binance.com'
  ) {
    // Construir URL com parâmetros
    const queryParams = new URLSearchParams(params).toString();
    const url = `${baseUrl}${endpoint}${queryParams ? '?' + queryParams : ''}`;
    
    // Fazer a requisição
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Erro na API da Binance');
    }
    
    return await response.json();
  }
  
  private static async createSignature(queryString: string, apiSecret: string): Promise<string> {
    // Usando SubtleCrypto para HMAC-SHA256 (funciona no Edge Runtime)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(apiSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(queryString)
    );
    
    // Converter o buffer para string hexadecimal
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Valida uma chave API da Binance
   * @param apiKeyId ID da chave API armazenada
   * @param userId ID do usuário
   * @returns Um objeto com status de validação e permissões detectadas
   */
  static async validateApiKey(apiKeyId: string, userId: string): Promise<{
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
      // Recuperar dados da chave API (decriptados)
      const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
      
      // Determinar a URL base baseada no tipo de exchange
      const baseUrl = apiKeyData.exchange === 'binance_us' 
        ? 'https://api.binance.us' 
        : 'https://api.binance.com';
      
      // Tentar obter informações da conta para verificar permissões básicas
      const accountInfo = await this.makeSignedRequest(
        '/api/v3/account',
        {},
        'GET',
        apiKeyData.apiKey,
        apiKeyData.apiSecret,
        baseUrl
      );
      
      // Se chegou aqui, a chave é válida para leitura
      const permissions = {
        spot: false,
        margin: false,
        futures: false,
        withdraw: false
      };
      
      // Verificar permissão de spot
      if (accountInfo && accountInfo.balances) {
        permissions.spot = true;
      }
      
      // Tentar verificar permissão de margin
      try {
        await this.makeSignedRequest(
          '/sapi/v1/margin/account',
          {},
          'GET',
          apiKeyData.apiKey,
          apiKeyData.apiSecret,
          baseUrl
        );
        permissions.margin = true;
      } catch (error) {
        console.log("Sem permissão para margin trading");
      }
      
      // Tentar verificar permissão de futures
      try {
        await this.makeSignedRequest(
          '/fapi/v1/account',
          {},
          'GET',
          apiKeyData.apiKey,
          apiKeyData.apiSecret,
          baseUrl.replace('api', 'fapi')
        );
        permissions.futures = true;
      } catch (error) {
        console.log("Sem permissão para futures trading");
      }
      
      // Tentar verificar permissão de withdraw
      try {
        await this.makeSignedRequest(
          '/sapi/v1/capital/config/getall',
          {},
          'GET',
          apiKeyData.apiKey,
          apiKeyData.apiSecret,
          baseUrl
        );
        permissions.withdraw = true;
      } catch (error) {
        console.log("Sem permissão para saques");
      }
      
      return {
        valid: true,
        permissions
      };
    } catch (error) {
      console.error('Erro ao validar chave API:', error);
      
      let errorMessage = 'Não foi possível validar a chave API.';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid API-key')) {
          errorMessage = 'Chave API inválida';
        } else if (error.message.includes('Invalid signature')) {
          errorMessage = 'Assinatura inválida - chave secreta incorreta';
        } else if (error.message.includes('IP')) {
          errorMessage = 'Acesso negado - o endereço IP do servidor não está permitido';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        valid: false,
        permissions: {
          spot: false,
          margin: false,
          futures: false,
          withdraw: false
        },
        errorMessage
      };
    }
  }

  /**
   * Busca informações de mercado (ticker)
   * @param symbol Par de trading (ex: BTCUSDT)
   * @param apiKeyId ID da chave API
   * @param userId ID do usuário
   */
  static async getMarketPrice(symbol: string, apiKeyId: string, userId: string): Promise<any> {
    try {
      // Recuperar dados da chave API
      const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
      
      // Criar cliente Binance
      const binance = this.createClient(
        apiKeyData.apiKey, 
        apiKeyData.apiSecret,
        apiKeyData.exchange
      );
      
      // Buscar ticker para o symbol informado
      const ticker = await binance.prices(symbol);
      return ticker;
    } catch (error) {
      console.error(`Erro ao buscar preço de ${symbol}:`, error);
      throw new Error('Não foi possível obter informações de preço');
    }
  }

  // Melhoria de tratamento de erros para getAccountBalance no BinanceService

/**
 * Busca saldo da conta
 * @param apiKeyId ID da chave API
 * @param userId ID do usuário
 */
static async getAccountBalance(apiKeyId: string, userId: string): Promise<any> {
  try {
    // Recuperar dados da chave API
    const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
    
    try {
      // Tentar buscar utilizando o endpoint account
      const accountInfo = await this.makeSignedRequest(
        '/api/v3/account',
        {},
        'GET',
        apiKeyData.apiKey,
        apiKeyData.apiSecret,
        apiKeyData.exchange === 'binance_us' ? 'https://api.binance.us' : 'https://api.binance.com'
      );
      
      // Converter array de saldos para objeto formato {symbol: {available, onOrder}}
      const balances = {};
      accountInfo.balances.forEach(item => {
        // Filtrar apenas ativos com saldo
        if (parseFloat(item.free) > 0 || parseFloat(item.locked) > 0) {
          balances[item.asset] = {
            available: item.free,
            onOrder: item.locked
          };
        }
      });
      
      return balances;
    } catch (apiError) {
      console.error('Erro ao acessar endpoint account:', apiError);
      
      // Alternativa: tentar buscar os saldos via trades recentes
      // para pelo menos ter uma lista de tokens com que o usuário opera
      try {
        // Obter trades recentes
        const recentTrades = await this.getRecentOrders(apiKeyId, userId);
        
        // Extrair símbolos únicos
        const uniqueSymbols = new Set();
        recentTrades.forEach(trade => {
          if (trade.symbol) {
            // Extrair a moeda base (ex: BTC de BTCUSDT)
            const symbol = trade.symbol;
            for (const quote of ['USDT', 'BTC', 'ETH', 'BNB']) {
              if (symbol.endsWith(quote)) {
                uniqueSymbols.add(symbol.substring(0, symbol.length - quote.length));
                break;
              }
            }
          }
        });
        
        // Criar um objeto de balances simulado
        // Isso não terá quantidades precisas, mas pelo menos terá os símbolos
        const fallbackBalances = {};
        Array.from(uniqueSymbols).forEach(symbol => {
          fallbackBalances[symbol] = {
            available: '0', // Quantidade desconhecida
            onOrder: '0'
          };
        });
        
        // Adicionar alguns stablecoins comuns
        ['USDT', 'USDC'].forEach(stablecoin => {
          fallbackBalances[stablecoin] = {
            available: '0',
            onOrder: '0'
          };
        });
        
        if (Object.keys(fallbackBalances).length > 0) {
          return fallbackBalances;
        }
      } catch (fallbackError) {
        console.error('Erro ao tentar fallback para saldos:', fallbackError);
      }
      
      // Se tudo falhar, retornar um objeto vazio mas válido
      return {
        // Adicionar pelo menos um par comum para que a interface não quebre
        'BTC': { available: '0', onOrder: '0' },
        'USDT': { available: '0', onOrder: '0' }
      };
    }
  } catch (error) {
    console.error('Erro ao buscar saldo da conta:', error);
    // Retornar um objeto vazio mas válido
    return {
      'BTC': { available: '0', onOrder: '0' },
      'USDT': { available: '0', onOrder: '0' }
    };
  }
}

  /**
   * Cria uma ordem na Binance
   * @param params Parâmetros da ordem
   * @param apiKeyId ID da chave API
   * @param userId ID do usuário
   */
  static async createOrder(
    params: {
      symbol: string;
      side: 'BUY' | 'SELL';
      type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
      quantity: number;
      price?: number;
      timeInForce?: 'GTC' | 'IOC' | 'FOK';
    },
    apiKeyId: string,
    userId: string
  ): Promise<any> {
    try {
      // Recuperar dados da chave API
      const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
      
      // Verificar se tem permissão para spot trading
      if (!apiKeyData.permissions.includes('spot')) {
        throw new Error('A chave API não possui permissão para spot trading');
      }
      
      // Criar cliente Binance
      const binance = this.createClient(
        apiKeyData.apiKey, 
        apiKeyData.apiSecret,
        apiKeyData.exchange
      );
      
      // Parâmetros da ordem
      const orderParams: any = {
        symbol: params.symbol,
        side: params.side,
        type: params.type,
        quantity: params.quantity,
      };
      
      // Adicionar preço se for LIMIT, STOP_LOSS ou TAKE_PROFIT
      if (params.type !== 'MARKET' && params.price) {
        orderParams.price = params.price;
      }
      
      // Adicionar timeInForce se fornecido
      if (params.timeInForce) {
        orderParams.timeInForce = params.timeInForce;
      }
      
      // Criar ordem
      let result;
      if (params.type === 'MARKET') {
        if (params.side === 'BUY') {
          result = await binance.marketBuy(params.symbol, params.quantity);
        } else {
          result = await binance.marketSell(params.symbol, params.quantity);
        }
      } else if (params.type === 'LIMIT' && params.price) {
        if (params.side === 'BUY') {
          result = await binance.buy(params.symbol, params.quantity, params.price);
        } else {
          result = await binance.sell(params.symbol, params.quantity, params.price);
        }
      } else {
        // Para outros tipos de ordem
        result = await binance.order(orderParams);
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      throw new Error('Falha ao criar ordem: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  }

/**
 * Cria um cliente Binance com as credenciais fornecidas
 * @param apiKey Chave da API
 * @param apiSecret Segredo da API
 * @param exchange Tipo de exchange (binance ou binance_us)
 */
private static createClient(apiKey: string, apiSecret: string, exchange: string) {
  // Como estamos usando makeSignedRequest diretamente, criamos um objeto simples
  // que simula um cliente Binance com as funcionalidades básicas
  return {
    apiKey,
    apiSecret,
    baseUrl: exchange === 'binance_us' ? 'https://api.binance.us' : 'https://api.binance.com',
    
    // Métodos de conveniência que usam makeSignedRequest internamente
    balance: async () => {
      const accountInfo = await this.makeSignedRequest(
        '/api/v3/account',
        {},
        'GET',
        apiKey,
        apiSecret,
        exchange === 'binance_us' ? 'https://api.binance.us' : 'https://api.binance.com'
      );
      
      // Converter array de saldos para objeto formato {symbol: {available, onOrder}}
      const balances = {};
      accountInfo.balances.forEach(item => {
        balances[item.asset] = {
          available: item.free,
          onOrder: item.locked
        };
      });
      
      return balances;
    },
    
    // Outros métodos podem ser adicionados conforme necessário
    prices: async (symbol = null) => {
      const endpoint = '/api/v3/ticker/price';
      const params = symbol ? { symbol } : {};
      
      const prices = await this.makePublicRequest(
        endpoint,
        params,
        exchange === 'binance_us' ? 'https://api.binance.us' : 'https://api.binance.com'
      );
      
      // Se um símbolo específico foi solicitado, retorna apenas o preço dele
      if (symbol) {
        return prices.price;
      }
      
      // Caso contrário, converte o array para um objeto {symbol: price}
      const priceMap = {};
      prices.forEach(item => {
        priceMap[item.symbol] = item.price;
      });
      
      return priceMap;
    }
  };
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
    
    // Buscar pares de trading ativos do usuário
    const userTradingPairs = await prisma.tradingPair.findMany({
      where: { 
        userId,
        active: true 
      },
      select: { symbol: true }
    });

    // Extrair símbolos dos pares encontrados ou usar a lista de símbolos populares como fallback
    const symbolsToFetch = userTradingPairs.length > 0 
      ? userTradingPairs.map(pair => pair.symbol)
      : [
          'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 
          'XRPUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT'
        ];
    
    // Buscar todas as ordens dos últimos 7 dias
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const baseParams = {
      startTime: sevenDaysAgo.toString(),
      limit: 10 // Limitar a 10 ordens por símbolo
    };
    
    // Array para armazenar ordens
    let allOrders = [];
    
    // Buscar ordens para cada símbolo
    for (const symbol of symbolsToFetch) {
      try {
        const params = {
          ...baseParams,
          symbol
        };
        
        // Tentar buscar histórico de ordens para este símbolo
        const orders = await this.makeSignedRequest(
          '/api/v3/allOrders',
          params,
          'GET',
          apiKeyData.apiKey,
          apiKeyData.apiSecret,
          baseUrl
        );
        
        if (orders && orders.length > 0) {
          console.log(`Encontradas ${orders.length} ordens para ${symbol}`);
          allOrders = [...allOrders, ...orders];
        }
      } catch (symbolError) {
        console.log(`Erro ao buscar ordens para ${symbol}:`, symbolError.message);
      }
    }
    
    // Salvar as ordens no banco de dados
    if (allOrders.length > 0) {
      await this.saveOrdersToDatabase(allOrders, userId);
    } else {
      console.log('Nenhuma ordem encontrada para os símbolos fornecidos');
    }
    
    // Agora vamos buscar os trades (execuções) associados
    let allTrades = [];
    
    // Buscar trades para cada símbolo
    for (const symbol of symbolsToFetch) {
      try {
        const params = {
          ...baseParams,
          symbol
        };
        
        // Buscar trades para este símbolo
        const trades = await this.makeSignedRequest(
          '/api/v3/myTrades',
          params,
          'GET',
          apiKeyData.apiKey,
          apiKeyData.apiSecret,
          baseUrl
        );
        
        if (trades && trades.length > 0) {
          console.log(`Encontrados ${trades.length} trades para ${symbol}`);
          allTrades = [...allTrades, ...trades];
        }
      } catch (symbolError) {
        console.log(`Erro ao buscar trades para ${symbol}:`, symbolError.message);
      }
    }
    
    // Salvar os trades (execuções) no banco de dados
    if (allTrades.length > 0) {
      await this.saveExecutionsToDatabase(allTrades, userId);
    } else {
      console.log('Nenhum trade encontrado para os símbolos fornecidos');
    }
    
    // Retornar todas as ordens encontradas
    return allOrders;
  } catch (error) {
    console.error('Erro ao buscar ordens recentes:', error);
    return [];
  }
}

/**
 * Salva as ordens no banco de dados
 */
private static async saveOrdersToDatabase(orders: any[], userId: string): Promise<void> {
  try {
    console.log(`Processando ${orders.length} ordens para salvar no banco de dados`);
    
    // Verificar ordens existentes para evitar duplicatas
    const existingOrderIds = new Set();
    
    const existingOrders = await prisma.order.findMany({
      where: {
        userId,
        binanceOrderId: { in: orders.map(order => order.orderId.toString()) }
      },
      select: { binanceOrderId: true }
    });
    
    existingOrders.forEach(order => {
      existingOrderIds.add(order.binanceOrderId);
    });
    
    console.log(`Encontradas ${existingOrderIds.size} ordens existentes no banco de dados`);
    
    // Filtrar apenas ordens novas
    const newOrders = orders.filter(order => !existingOrderIds.has(order.orderId.toString()));
    
    console.log(`Preparando para salvar ${newOrders.length} novas ordens`);
    
    // Preparar dados para inserção
    const ordersToSave = newOrders.map(order => ({
      userId,
      binanceOrderId: order.orderId.toString(),
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      status: order.status,
      price: parseFloat(order.price || '0'),
      quantity: parseFloat(order.origQty || '0'),
      executedQty: parseFloat(order.executedQty || '0'),
      quoteQty: parseFloat(order.cummulativeQuoteQty || '0'),
      timeInForce: order.timeInForce,
      stopPrice: parseFloat(order.stopPrice || '0'),
      timestamp: new Date(order.time),
      updatedAt: new Date()
    }));
    
    // Salvar em lotes de 100 para evitar sobrecarga
    const batchSize = 100;
    for (let i = 0; i < ordersToSave.length; i += batchSize) {
      const batch = ordersToSave.slice(i, i + batchSize);
      if (batch.length > 0) {
        await prisma.$transaction(
          batch.map(orderData => 
            prisma.order.create({
              data: orderData
            })
          )
        );
        console.log(`Salvas ${batch.length} ordens (lote ${Math.floor(i/batchSize) + 1})`);
      }
    }
    
    console.log(`Total de ${ordersToSave.length} ordens salvas com sucesso`);
  } catch (error) {
    console.error('Erro ao salvar ordens no banco de dados:', error);
  }
}

/**
 * Salva as execuções (trades) no banco de dados
 */
private static async saveExecutionsToDatabase(trades: any[], userId: string): Promise<void> {
  try {
    console.log(`Processando ${trades.length} execuções para salvar no banco de dados`);
    
    // Verificar execuções existentes para evitar duplicatas
    const existingTradeIds = new Set();
    
    const existingExecutions = await prisma.execution.findMany({
      where: {
        userId,
        binanceTradeId: { in: trades.map(trade => trade.id.toString()) }
      },
      select: { binanceTradeId: true }
    });
    
    existingExecutions.forEach(execution => {
      existingTradeIds.add(execution.binanceTradeId);
    });
    
    console.log(`Encontradas ${existingTradeIds.size} execuções existentes no banco de dados`);
    
    // Filtrar apenas execuções novas
    const newTrades = trades.filter(trade => !existingTradeIds.has(trade.id.toString()));
    
    console.log(`Preparando para salvar ${newTrades.length} novas execuções`);
    
    // Buscar ordens relacionadas
    const orderBinanceIds = [...new Set(newTrades.map(trade => trade.orderId?.toString()).filter(Boolean))];
    const relatedOrders = await prisma.order.findMany({
      where: {
        userId,
        binanceOrderId: { in: orderBinanceIds }
      },
      select: { id: true, binanceOrderId: true }
    });
    
    // Mapear binanceOrderId para id interno do banco
    const orderIdMap = {};
    relatedOrders.forEach(order => {
      orderIdMap[order.binanceOrderId] = order.id;
    });
    
    // Preparar execuções para salvar (apenas aquelas com ordem relacionada)
    const executionsToSave = [];
    
    for (const trade of newTrades) {
      const binanceOrderId = trade.orderId?.toString();
      const orderId = orderIdMap[binanceOrderId];
      
      if (orderId) {
        executionsToSave.push({
          userId,
          orderId,
          binanceTradeId: trade.id.toString(),
          symbol: trade.symbol,
          side: trade.isBuyer ? 'BUY' : 'SELL',
          price: parseFloat(trade.price || '0'),
          quantity: parseFloat(trade.qty || '0'),
          commission: parseFloat(trade.commission || '0'),
          commissionAsset: trade.commissionAsset,
          isMaker: trade.isMaker || false,
          timestamp: new Date(trade.time),
          updatedAt: new Date()
        });
      } else {
        console.log(`Ignorando execução ${trade.id} pois não foi encontrada ordem correspondente`);
      }
    }
    
    // Salvar em lotes para evitar sobrecarga
    const batchSize = 100;
    for (let i = 0; i < executionsToSave.length; i += batchSize) {
      const batch = executionsToSave.slice(i, i + batchSize);
      if (batch.length > 0) {
        await prisma.$transaction(
          batch.map(executionData => 
            prisma.execution.create({
              data: executionData
            })
          )
        );
        console.log(`Salvas ${batch.length} execuções (lote ${Math.floor(i/batchSize) + 1})`);
      }
    }
    
    console.log(`Total de ${executionsToSave.length} execuções salvas com sucesso`);
  } catch (error) {
    console.error('Erro ao salvar execuções no banco de dados:', error);
  }
}

/**
 * Busca preços atuais para todos os pares
 * @param apiKeyId ID da chave API
 * @param userId ID do usuário
 */
static async getMarketPrices(apiKeyId: string, userId: string): Promise<Record<string, string>> {
  try {
    // Recuperar dados da chave API
    const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
    
    // Determinar a URL base baseada no tipo de exchange
    const baseUrl = apiKeyData.exchange === 'binance_us' 
      ? 'https://api.binance.us' 
      : 'https://api.binance.com';
    
    // Buscar preços atuais (endpoint público, não precisa de autenticação)
    const prices = await this.makePublicRequest(
      '/api/v3/ticker/price',
      {},
      baseUrl
    );
    
    // Converter array para objeto {symbol: price}
    const priceMap = {};
    prices.forEach(item => {
      priceMap[item.symbol] = item.price;
    });
    
    return priceMap;
  } catch (error) {
    console.error('Erro ao buscar preços de mercado:', error);
    throw new Error('Não foi possível obter informações de preço');
  }
}

/**
 * Busca dados de ticker 24h para todos os pares
 * @param apiKeyId ID da chave API
 * @param userId ID do usuário
 */
static async get24hMarketData(apiKeyId: string, userId: string): Promise<any[]> {
  try {
    // Recuperar dados da chave API
    const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
    
    // Determinar a URL base baseada no tipo de exchange
    const baseUrl = apiKeyData.exchange === 'binance_us' 
      ? 'https://api.binance.us' 
      : 'https://api.binance.com';
    
    // Buscar dados de 24h (endpoint público, não precisa de autenticação)
    const tickers = await this.makePublicRequest(
      '/api/v3/ticker/24hr',
      {},
      baseUrl
    );
    
    return tickers;
  } catch (error) {
    console.error('Erro ao buscar dados de 24h:', error);
    throw new Error('Não foi possível obter dados de mercado');
  }
}

static async getUserTradesHistory(apiKeyId: string, userId: string): Promise<any[]> {
  try {
    // Recuperar dados da chave API
    const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
    
    // Determinar a URL base baseada no tipo de exchange
    const baseUrl = apiKeyData.exchange === 'binance_us' 
      ? 'https://api.binance.us' 
      : 'https://api.binance.com';

    // Buscar pares de trading ativos do usuário
    const tradingPairs = await prisma.tradingPair.findMany({
      where: { 
        userId,
        active: true 
      },
      select: { symbol: true }
    });

    // Se não houver pares configurados, usar lista padrão
    const symbolsToFetch = tradingPairs.length > 0 
      ? tradingPairs.map(pair => pair.symbol)
      : [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 
        'ADAUSDT', 'XRPUSDT', 'DOGEUSDT', 
        'SOLUSDT', 'MATICUSDT', 'DOTUSDT',
        'LTCUSDT', 'LINKUSDT'
      ];

    // Array para armazenar todos os trades
    let allTrades: any[] = [];

    // Buscar trades para cada símbolo
    for (const symbol of symbolsToFetch) {
      try {
        // Parâmetros para a requisição de trades
        const params = new URLSearchParams({
          symbol,
          limit: '50', // Limite de 50 trades por símbolo
          timestamp: Date.now().toString()
        });

        // Gerar a signature
        const signature = await this.createSignature(params.toString(), apiKeyData.apiSecret);
        params.append('signature', signature);

        // URL completa com parâmetros
        const url = `${baseUrl}/api/v3/myTrades?${params.toString()}`;

        // Fazer a requisição
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-MBX-APIKEY': apiKeyData.apiKey,
            'Content-Type': 'application/json'
          }
        });

        // Verificar resposta
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Erro ao buscar trades para ${symbol}:`, {
            status: response.status,
            statusText: response.statusText,
            errorMessage: errorData.msg || 'Erro desconhecido'
          });
          continue; // Pular para o próximo símbolo
        }

        const trades = await response.json();
        
        // Mapear trades para o formato desejado
        const formattedTrades = trades.map(trade => ({
          id: trade.id.toString(),
          symbol: DashboardService.formatSymbol(trade.symbol),
          side: trade.isBuyer ? 'BUY' : 'SELL',
          quantity: parseFloat(trade.qty),
          price: parseFloat(trade.price),
          total: parseFloat(trade.quoteQty),
          timestamp: new Date(trade.time).toISOString(),
          strategy: 'Manual',
          status: 'FILLED'
        }));

        // Adicionar trades ao array total
        allTrades.push(...formattedTrades);

      } catch (symbolError) {
        console.error(`Erro ao processar trades para ${symbol}:`, symbolError);
      }
    }

    return allTrades;

  } catch (error) {
    console.error('Erro ao buscar histórico de trades:', error);
    return [];
  }
}

static async getAllTradingSymbols(apiKeyId: string, userId: string): Promise<string[]> {
  try {
    // Recuperar dados da chave API para determinar a base URL
    const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
    
    const baseUrl = apiKeyData.exchange === 'binance_us' 
      ? 'https://api.binance.us' 
      : 'https://api.binance.com';
    
    // Endpoint para obter informações de exchange
    const url = `${baseUrl}/api/v3/exchangeInfo`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar símbolos: ${response.statusText}`);
    }
    
    const exchangeInfo = await response.json();
    
    // Extrair apenas os símbolos que são de trading (geralmente terminam com USDT, BTC, ETH, etc.)
    const symbols = exchangeInfo.symbols
      .filter(symbol => 
        symbol.status === 'TRADING' && 
        (symbol.symbol.endsWith('USDT') || 
         symbol.symbol.endsWith('BTC') || 
         symbol.symbol.endsWith('ETH') ||
         symbol.symbol.endsWith('BRL') ||  
         symbol.symbol.endsWith('BNB'))
      )
      .map(symbol => symbol.symbol);
    
    return symbols;
  } catch (error) {
    console.error('Erro ao buscar lista de símbolos:', error);
    // Fallback para uma lista padrão se a busca falhar
    return [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 
      'XRPUSDT', 'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT'
    ];
  }
}


}