// app/api/trading-pairs/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TradingPairService } from '@/app/lib/services/trading-pair-service';
import { z } from 'zod';

// Schema de validação para adicionar par de trading
const addTradingPairSchema = z.object({
  symbol: z.string().min(1, 'Símbolo é obrigatório')
});

// Schema de validação para atualizar status
const updateTradingPairSchema = z.object({
  active: z.boolean()
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Buscar pares de trading do usuário
    const tradingPairs = await TradingPairService.getTradingPairs(userId);
    
    return NextResponse.json(tradingPairs);
  } catch (error) {
    console.error('Erro ao buscar pares de trading:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pares de trading' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Validar dados da requisição
    const body = await req.json();
    const { symbol } = addTradingPairSchema.parse(body);
    
    // Adicionar par de trading
    const newPair = await TradingPairService.addTradingPair(userId, symbol);
    
    return NextResponse.json(newPair, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar par de trading:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao adicionar par de trading' },
      { status: 500 }
    );
  }
}

// Rota para atualizar status de um par de trading específico
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Extrair ID do par de trading da URL
    const url = new URL(req.url);
    const pairId = url.searchParams.get('id');
    
    if (!pairId) {
      return NextResponse.json(
        { error: 'ID do par de trading não fornecido' },
        { status: 400 }
      );
    }
    
    // Validar dados da requisição
    const body = await req.json();
    const { active } = updateTradingPairSchema.parse(body);
    
    // Atualizar status do par de trading
    const updatedPair = await TradingPairService.updateTradingPairStatus(
      pairId, 
      userId, 
      active
    );
    
    return NextResponse.json(updatedPair);
  } catch (error) {
    console.error('Erro ao atualizar par de trading:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar par de trading' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Extrair ID do par de trading da URL
    const url = new URL(req.url);
    const pairId = url.searchParams.get('id');
    
    if (!pairId) {
      return NextResponse.json(
        { error: 'ID do par de trading não fornecido' },
        { status: 400 }
      );
    }
    
    // Remover par de trading
    await TradingPairService.removeTradingPair(pairId, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover par de trading:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao remover par de trading' },
      { status: 500 }
    );
  }
}