// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DashboardService } from '@/app/lib/services/dashboard-service';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Obter dados do dashboard
    const dashboardData = await DashboardService.getDashboardData(userId);
    
    // Obter estratégias ativas
    const strategies = await DashboardService.getActiveStrategies(userId);
    
    // Obter operações recentes
    const trades = await DashboardService.getRecentTrades(userId);
    
    // Retornar todos os dados necessários para o dashboard
    return NextResponse.json({
      dashboardData,
      strategies,
      trades
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  }
}