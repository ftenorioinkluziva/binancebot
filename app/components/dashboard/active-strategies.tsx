// components/dashboard/active-strategies.tsx
'use client';

import { Play, Pause, ChevronRight, AlertTriangle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StrategyOverview } from '@/app/lib/services/dashboard-service';

interface ActiveStrategiesProps {
  strategies: StrategyOverview[];
  isLoading: boolean;
  isToggling?: boolean;
  onToggleStrategy?: (id: string) => Promise<void>;
}

export function ActiveStrategies({ 
  strategies, 
  isLoading, 
  isToggling = false,
  onToggleStrategy 
}: ActiveStrategiesProps) {
  const [updatingStrategyId, setUpdatingStrategyId] = useState<string | null>(null);

  const handleToggleStrategy = async (id: string) => {
    if (!onToggleStrategy) return;
    
    setUpdatingStrategyId(id);
    try {
      await onToggleStrategy(id);
    } finally {
      setUpdatingStrategyId(null);
    }
  };

  const getLastRunText = (lastRun: string | null) => {
    if (!lastRun) return 'Nunca executada';
    
    const lastRunDate = new Date(lastRun);
    const now = new Date();
    const diffMs = now.getTime() - lastRunDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `Há ${diffMins} minutos`;
    } else if (diffHours < 24) {
      return `Há ${diffHours} horas`;
    } else {
      return `Há ${diffDays} dias`;
    }
  };

  const getStrategyTypeLabel = (type: string) => {
    switch (type) {
      case 'DCA':
        return 'Compra média';
      case 'BollingerBands':
        return 'Bandas de Bollinger';
      case 'MovingAverage':
        return 'Média Móvel';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Estratégias Ativas
        </h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : strategies.length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma estratégia configurada</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece criando sua primeira estratégia de trading automatizado.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/strategies/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Criar estratégia
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{strategy.name}</h4>
                    <div className="mt-1 flex items-center">
                      <span className="text-xs text-gray-500 mr-2">{getStrategyTypeLabel(strategy.type)}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {strategy.symbol}
                      </span>
                    </div>
                  </div>
                  {onToggleStrategy && (
                    <button
                      onClick={() => handleToggleStrategy(strategy.id)}
                      disabled={isToggling || updatingStrategyId === strategy.id}
                      className={`p-2 rounded-full ${
                        isToggling || updatingStrategyId === strategy.id
                          ? 'bg-gray-100 text-gray-400'
                          : strategy.active 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isToggling || updatingStrategyId === strategy.id ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-b-transparent"></div>
                      ) : strategy.active ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Última execução:</span>
                    <div className="font-medium text-gray-900">
                      {getLastRunText(strategy.lastRun)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Performance:</span>
                    <div className={`font-medium ${
                      strategy.performance && strategy.performance >= 0 
                        ? 'text-green-600' 
                        : strategy.performance ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {strategy.performance !== null 
                        ? `${strategy.performance >= 0 ? '+' : ''}${strategy.performance}%` 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link href="/dashboard/strategies" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
            Gerenciar estratégias
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}