// app/lib/hooks/use-dashboard-data.ts
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DashboardData, StrategyOverview, TradeOverview } from '@/app/lib/services/dashboard-service';

interface UseDashboardDataResult {
  isLoading: boolean;
  dashboardData: DashboardData | null;
  strategies: StrategyOverview[];
  trades: TradeOverview[];
  refetch: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataResult {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [strategies, setStrategies] = useState<StrategyOverview[]>([]);
  const [trades, setTrades] = useState<TradeOverview[]>([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do dashboard');
      }
      
      const data = await response.json();
      
      setDashboardData(data.dashboardData);
      setStrategies(data.strategies);
      setTrades(data.trades);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Não foi possível carregar alguns dados do dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    isLoading,
    dashboardData,
    strategies,
    trades,
    refetch: fetchDashboardData
  };
}
