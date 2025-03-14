// app/lib/services/binance-service.ts
//import Binance from 'node-binance-api';
//import { EncryptionService } from './encryption-service';
import { ApiKeyService } from './api-key-service';

export class BinanceService {
  private static async makeSignedRequest(
    endpoint: string,
    params: any = {},
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    apiKey: string,
    apiSecret: string,
    baseUrl: string = 'https://api.binance.com'
  ) {
    // Adicionar timestamp necessário para assinatura
    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString()
    });
    
    // Criar assinatura HMAC
    const signature = await this.createSignature(queryParams.toString(), apiSecret);
    queryParams.append('signature', signature);
    
    // Construir URL
    const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;
    
    // Fazer a requisição
    const response = await fetch(url, {
      method,
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Erro na API da Binance');
    }
    
    return await response.json();
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

  /**
   * Busca o saldo da conta
   * @param apiKeyId ID da chave API
   * @param userId ID do usuário
   */
  static async getAccountBalance(apiKeyId: string, userId: string): Promise<any> {
    try {
      // Recuperar dados da chave API
      const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
      
      // Criar cliente Binance
      const binance = this.createClient(
        apiKeyData.apiKey, 
        apiKeyData.apiSecret,
        apiKeyData.exchange
      );
      
      // Buscar saldo da conta
      const balance = await binance.balance();
      
      // Filtrar apenas saldos positivos e formatar
      const filteredBalance = Object.entries(balance)
        .filter(([_, value]: [string, any]) => value.available > 0 || value.onOrder > 0)
        .reduce((acc: any, [key, value]: [string, any]) => {
          acc[key] = value;
          return acc;
        }, {});
      
      return filteredBalance;
    } catch (error) {
      console.error('Erro ao buscar saldo da conta:', error);
      throw new Error('Não foi possível obter o saldo da conta');
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

// Adicione este método ao BinanceService

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
    
    // Buscar todas as ordens dos últimos 7 dias
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const params = {
      startTime: sevenDaysAgo.toString()
    };
    
    // Buscar histórico de todas as ordens do usuário
    const allOrders = await this.makeSignedRequest(
      '/api/v3/allOrders',
      params,
      'GET',
      apiKeyData.apiKey,
      apiKeyData.apiSecret,
      baseUrl
    );
    
    // Se não houver histórico de todas as ordens, tentar buscar apenas ordens recentes
    if (!allOrders || allOrders.length === 0) {
      return await this.makeSignedRequest(
        '/api/v3/myTrades',
        params,
        'GET',
        apiKeyData.apiKey,
        apiKeyData.apiSecret,
        baseUrl
      );
    }
    
    return allOrders;
  } catch (error) {
    console.error('Erro ao buscar ordens recentes:', error);
    
    // Em caso de erro de permissão, tentar endpoint alternativo
    if (error.message && error.message.includes('permissions')) {
      try {
        // Recuperar dados da chave API
        const apiKeyData = await ApiKeyService.getApiKey(apiKeyId, userId);
        
        // Determinar a URL base baseada no tipo de exchange
        const baseUrl = apiKeyData.exchange === 'binance_us' 
          ? 'https://api.binance.us' 
          : 'https://api.binance.com';
        
        // Tentar buscar apenas as ordens abertas (endpoint com menos restrições)
        return await this.makeSignedRequest(
          '/api/v3/openOrders',
          {},
          'GET',
          apiKeyData.apiKey,
          apiKeyData.apiSecret,
          baseUrl
        );
      } catch (openOrdersError) {
        console.error('Erro ao buscar ordens abertas:', openOrdersError);
        return [];
      }
    }
    
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

}