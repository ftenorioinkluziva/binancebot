// app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { DashboardOverview } from '@/app/components/dashboard/dashboard-overview';    
import { PortfolioSummary } from '@/app/components/dashboard/portfolio-summary';
import { MarketOverview } from '@/app/components/dashboard/market-overview';
import { RecentTrades } from '@/app/components/dashboard/recent-trades';
import { ActiveStrategies } from '@/app/components/dashboard/active-strategies';
import { useDashboardData } from '@/app/lib/hooks/use-dashboard-data';
import { useStrategy } from '@/app/lib/hooks/use-strategy';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export default function DashboardPage() {
  const { isLoading, dashboardData, strategies, trades, refetch } = useDashboardData();
  const { isToggling, toggleStrategy } = useStrategy();
  
  // Configurar atualização automática dos dados a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, [refetch]);
  
  const handleRefresh = () => {
    refetch();
  };
  
  const handleToggleStrategy = async (id: string) => {
    const success = await toggleStrategy(id);
    if (success) {
      // Atualizar os dados do dashboard após alternar uma estratégia
      refetch();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
      
      <DashboardOverview 
        totalBalance={dashboardData?.totalBalance || 0}
        dailyChange={dashboardData?.dailyChange || 0}
        totalProfit={dashboardData?.totalProfit || 0}
        activeStrategies={dashboardData?.activeStrategies || 0}
        isLoading={isLoading}
      />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PortfolioSummary 
          assets={dashboardData?.portfolio || []}
          isLoading={isLoading}
        />
        
        <MarketOverview 
          marketData={dashboardData?.marketOverview || []}
          isLoading={isLoading}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActiveStrategies 
          strategies={strategies}
          isLoading={isLoading}
          isToggling={isToggling}
          onToggleStrategy={handleToggleStrategy}
        />
        
        <RecentTrades 
          trades={trades}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}