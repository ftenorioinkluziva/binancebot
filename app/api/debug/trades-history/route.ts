// app/api/debug/trades-history/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { BinanceService } from '@/app/lib/services/binance-service';
import { ApiKeyService } from '@/app/lib/services/api-key-service';

export async function GET(req: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Buscar as chaves de API do usuário
    const apiKeys = await ApiKeyService.getApiKeys(userId);
    
    if (!apiKeys || apiKeys.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma chave API encontrada para o usuário' },
        { status: 404 }
      );
    }
    
    // Usar a primeira chave API
    const apiKeyId = apiKeys[0].id;
    
    if (!apiKeyId) {
      return NextResponse.json(
        { error: 'ID da chave API não encontrado' },
        { status: 404 }
      );
    }
    
    try {
      // Buscar histórico de trades via BinanceService
      console.log('Chamando getUserTradesHistory para o usuário:', userId);
      const trades = await BinanceService.getUserTradesHistory(apiKeyId, userId);
      
      // Adicionar campos para mapear o formato esperado pela UI
      const formattedTrades = trades.map(trade => {
        // Verificar a estrutura do objeto retornado e extrair os campos
        // necessários ou criar valores padrão para campos ausentes
        
        // Exemplo básico de formatação
        return {
          id: trade.id || trade.orderId || trade.tradeId || 'unknown',
          symbol: trade.symbol || 'Unknown',
          side: trade.isBuyer === true ? 'BUY' : 
                trade.isBuyer === false ? 'SELL' :
                trade.side || 'Unknown',
          quantity: parseFloat(trade.qty || trade.quantity || trade.executedQty || '0'),
          price: parseFloat(trade.price || '0'),
          total: parseFloat(trade.quoteQty || trade.total || (trade.price * trade.qty) || '0'),
          timestamp: trade.time ? new Date(trade.time).toISOString() : 
                    trade.timestamp || new Date().toISOString(),
          status: trade.status || 'FILLED',
          strategy: trade.strategy || 'Manual',
          // Preservar os dados originais para diagnóstico
          originalData: trade
        };
      });
      
      return NextResponse.json({
        trades: formattedTrades,
        originalCount: trades.length,
        formattedCount: formattedTrades.length,
        firstRawItem: trades.length > 0 ? trades[0] : null,
      });
    } catch (error) {
      console.error('Erro ao chamar getUserTradesHistory:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro geral na API de debug trades-history:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}