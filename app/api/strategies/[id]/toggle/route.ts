// app/api/strategies/[id]/toggle/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';


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
    const strategy = await prisma.strategy.findUnique({
      where: { 
        id: strategyId,
        userId
      }
    });
    
    if (!strategy) {
      return NextResponse.json(
        { error: 'Estratégia não encontrada ou acesso negado' },
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