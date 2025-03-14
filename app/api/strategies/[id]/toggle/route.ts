// app/api/strategies/[id]/toggle/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Função auxiliar para verificar propriedade da estratégia
async function isStrategyOwner(strategyId: string, userId: string) {
  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    select: { userId: true }
  });
  
  return strategy?.userId === userId;
}

export async function POST(
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
    
    // Alternar o estado ativo da estratégia
    const updatedStrategy = await prisma.strategy.update({
      where: { id: strategyId },
      data: {
        active: !strategy.active,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(updatedStrategy);
  } catch (error) {
    console.error('Erro ao alternar estado da estratégia:', error);
    return NextResponse.json(
      { error: 'Erro ao alternar estado da estratégia' },
      { status: 500 }
    );
  }
}