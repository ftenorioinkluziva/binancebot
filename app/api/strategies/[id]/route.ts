// app/api/strategies/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

// Função auxiliar para verificar propriedade da estratégia
async function isStrategyOwner(strategyId: string, userId: string) {
  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    select: { userId: true }
  });
  
  return strategy?.userId === userId;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const strategyId = params.id;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Verificar se o usuário tem acesso à estratégia
    if (!(await isStrategyOwner(strategyId, userId))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Buscar a estratégia
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId }
    });
    
    if (!strategy) {
      return NextResponse.json(
        { error: 'Estratégia não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(strategy);
  } catch (error) {
    console.error('Erro ao buscar estratégia:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estratégia' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const strategyId = params.id;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Verificar se o usuário tem acesso à estratégia
    if (!(await isStrategyOwner(strategyId, userId))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Validar dados básicos
    if (!data.name || !data.symbol || !data.type) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }
    
    // Estruturar os dados para atualizar
    const strategyData: any = {
      name: data.name,
      symbol: data.symbol,
      type: data.type,
      active: data.active !== undefined ? data.active : undefined,
      config: {}
    };
    
    // Adicionar configurações específicas com base no tipo
    switch (data.type) {
      case 'DCA':
        strategyData.config = {
          amount: data.amount,
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
    
    // Atualizar a estratégia no banco de dados
    const strategy = await prisma.strategy.update({
      where: { id: strategyId },
      data: {
        name: strategyData.name,
        symbol: strategyData.symbol,
        active: strategyData.active,
        config: strategyData.config,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(strategy);
  } catch (error) {
    console.error('Erro ao atualizar estratégia:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar estratégia' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const strategyId = params.id;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Verificar se o usuário tem acesso à estratégia
    if (!(await isStrategyOwner(strategyId, userId))) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Excluir a estratégia
    await prisma.strategy.delete({
      where: { id: strategyId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir estratégia:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir estratégia' },
      { status: 500 }
    );
  }
}