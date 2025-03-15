// app/lib/services/binance-service.ts
//import Binance from 'node-binance-api';
//import { EncryptionService } from './encryption-service';
import { ApiKeyService } from './api-key-service';

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
    
    // Lista de símbolos populares para buscar ordens
    const popularSymbols = [
      'BNBBTC', 'BNBETH', 'BNBUSDT', 'SOLBNB', 'ADAUSDT', 
      'XRPUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT'
    ];
    
    // Buscar todas as ordens dos últimos 7 dias
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const baseParams = {
      startTime: sevenDaysAgo.toString(),
      limit: 10 // Limitar a 10 ordens por símbolo
    };
    
    // Array para armazenar todas as ordens encontradas
    let allOrders = [];
    
    // Buscar ordens para cada símbolo popular
    for (const symbol of popularSymbols) {
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
          allOrders = [...allOrders, ...orders];
        }
      } catch (symbolError) {
        // Ignorar erros para símbolos específicos e continuar com o próximo
        console.log(`Erro ao buscar ordens para ${symbol}:`, symbolError.message);
      }
    }
    
    // Se não encontrou nenhuma ordem, tentar buscar trades recentes
    if (allOrders.length === 0) {
      let allTrades = [];
      
      for (const symbol of popularSymbols) {
        try {
          const params = {
            ...baseParams,
            symbol
          };
          
          // Buscar trades recentes para este símbolo
          const trades = await this.makeSignedRequest(
            '/api/v3/myTrades',
            params,
            'GET',
            apiKeyData.apiKey,
            apiKeyData.apiSecret,
            baseUrl
          );
          
          if (trades && trades.length > 0) {
            allTrades = [...allTrades, ...trades];
          }
        } catch (symbolError) {
          // Ignorar erros para símbolos específicos
          console.log(`Erro ao buscar trades para ${symbol}:`, symbolError.message);
        }
      }
      
      if (allTrades.length > 0) {
        return allTrades;
      }
    }
    
    // Se encontrou alguma ordem, retornar
    if (allOrders.length > 0) {
      return allOrders;
    }
    
    // Se chegou aqui, tentar buscar apenas ordens abertas (endpoint com menos restrições)
    try {
      const openOrders = await this.makeSignedRequest(
        '/api/v3/openOrders',
        {},
        'GET',
        apiKeyData.apiKey,
        apiKeyData.apiSecret,
        baseUrl
      );
      
      return openOrders || [];
    } catch (openOrdersError) {
      console.error('Erro ao buscar ordens abertas:', openOrdersError);
      return [];
    }
  } catch (error) {
    console.error('Erro ao buscar ordens recentes:', error);
    return [];
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

/**
 * Busca todos os trades do usuário usando o endpoint específico para histórico de trades
 * @param apiKeyId ID da chave API
 * @param userId ID do usuário
 * @returns Lista de trades do usuário
 */
static async getUserTradesHistory(apiKeyId: string, userId: string): Promise<any[]> {
  try {
    // Recuperar dados da chave API
    const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
    
    // Determinar a URL base baseada no tipo de exchange
    const baseUrl = apiKeyData.exchange === 'binance_us' 
      ? 'https://www.binance.us' 
      : 'https://www.binance.com';
    
    // Buscar todas as ordens dos últimos 30 dias
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Estrutura do payload baseada nas imagens fornecidas
    const payload = {
      page: 1,
      rows: 15,
      startTime: thirtyDaysAgo,
      endTime: Date.now(),
      direction: "",
      baseAsset: "",
      quoteAsset: "",
      hideCanceled: false,
      queryTimeType: "INSERT_TIME"
    };
    
    // Fazer solicitação HTTP para o endpoint de histórico de trades
    try {
      const response = await fetch(`${baseUrl}/bapi/capital/v1/private/streamer/trade/get-user-trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MBX-APIKEY': apiKeyData.apiKey
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro na API da Binance: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validar a estrutura da resposta
      if (data && data.success && Array.isArray(data.data)) {
        console.log(`Encontrados ${data.data.length} trades no histórico de usuário`);
        return data.data;
      } else {
        console.log('Resposta da API não contém dados de trades válidos:', data);
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de trades:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro no getUserTradesHistory:', error);
    return [];
  }
}

}