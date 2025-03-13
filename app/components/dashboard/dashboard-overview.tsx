// components/dashboard/dashboard-overview.tsx
'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';

export function DashboardOverview() {
  const [stats, setStats] = useState({
    totalBalance: 0,
    dailyChange: 0,
    totalProfit: 0,
    activeStrategies: 0,
  });
  
  // Simulação de carregamento de dados
  useEffect(() => {
    // Em um caso real, você buscaria esses dados da API
    setTimeout(() => {
      setStats({
        totalBalance: 12453.28,
        dailyChange: 2.7,
        totalProfit: 1241.87,
        activeStrategies: 3,
      });
    }, 1000);
  }, []);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-blue-100 p-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Saldo Total
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    ${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
              {stats.dailyChange >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Variação 24h
                </dt>
                <dd>
                  <div className={`text-lg font-medium ${
                    stats.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.dailyChange >= 0 ? '+' : ''}{stats.dailyChange}%
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-indigo-100 p-3">
              <DollarSign className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Lucro Total
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    ${stats.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-purple-100 p-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Estratégias Ativas
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {stats.activeStrategies}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}