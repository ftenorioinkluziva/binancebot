// app/api/strategies/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';
import { authMiddleware } from '@/app/lib/middlewares/auth-middleware';

export async function GET(req: Request) {
  try {
    const authResponse = await authMiddleware(req);
    if (authResponse) return authResponse;
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Obter as estratégias do usuário
    const strategies = await prisma.strategy.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(strategies);
  } catch (error) {
    console.error('Erro ao buscar estratégias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estratégias' },
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
    const data = await req.json();
    
    // Validar dados básicos
    if (!data.name || !data.symbol || !data.type) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }
    
    // Estruturar os dados para salvar
    const strategyData = {
      userId,
      name: data.name,
      symbol: data.symbol,
      type: data.type,
      active: data.active || false,
      config: {}
    };
    
    // Adicionar configurações específicas com base no tipo
    switch (data.type) {
      case 'DCA':
        strategyData.config = {
          amount: data.amount,
          currency: data.currency || 'BRL',
          amountType: data.amountType || 'fixed',
          percentage: data.percentage,
          frequency: data.frequency,
          dayOfWeek: data.dayOfWeek,
          dayOfMonth: data.dayOfMonth,
          hour: data.hour
        };
        break;
        
      case 'BollingerBands':
        strategyData.config = {
          period: data.period,
          deviation: data.deviation,
          amount: data.amount,
          buyLowerBand: data.buyLowerBand,
          sellUpperBand: data.sellUpperBand,
          trailingStopLoss: data.trailingStopLoss
        };
        break;
        
      case 'MovingAverage':
        strategyData.config = {
          fastPeriod: data.fastPeriod,
          slowPeriod: data.slowPeriod,
          signalPeriod: data.signalPeriod,
          amount: data.amount,
          maType: data.maType
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Tipo de estratégia inválido' },
          { status: 400 }
        );
    }
    
    // Criar a estratégia no banco de dados
    const strategy = await prisma.strategy.create({
      data: strategyData
    });
    
    return NextResponse.json(strategy, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar estratégia:', error);
    return NextResponse.json(
      { error: 'Erro ao criar estratégia' },
      { status: 500 }
    );
  }
}