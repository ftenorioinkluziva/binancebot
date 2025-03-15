// app/api/trading-pairs/available-symbols/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TradingPairService } from '@/app/lib/services/trading-pair-service';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Buscar símbolos disponíveis
    const availableSymbols = await TradingPairService.getValidBinanceSymbols();
    
    // Remover os já cadastrados pelo usuário
    const existingPairs = await TradingPairService.getTradingPairs(userId);
    const existingSymbols = existingPairs.map(pair => pair.symbol);
    
    const filteredSymbols = availableSymbols.filter(
      symbol => !existingSymbols.includes(symbol)
    );
    
    return NextResponse.json(filteredSymbols);
  } catch (error) {
    console.error('Erro ao buscar símbolos disponíveis:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar símbolos disponíveis' },
      { status: 500 }
    );
  }
}