// components/dashboard/dashboard-overview.tsx
'use client';

import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';

interface DashboardOverviewProps {
  totalBalance: number;
  dailyChange: number;
  totalProfit: number;
  activeStrategies: number;
  isLoading: boolean;
}

export function DashboardOverview({
  totalBalance,
  dailyChange,
  totalProfit,
  activeStrategies,
  isLoading
}: DashboardOverviewProps) {
  
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
                  {isLoading ? (
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <div className="text-lg font-medium text-gray-900">
                      ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
              {dailyChange >= 0 ? (
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
                  {isLoading ? (
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <div className={`text-lg font-medium ${
                      dailyChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}%
                    </div>
                  )}
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
                  {isLoading ? (
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <div className="text-lg font-medium text-gray-900">
                      ${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
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
                  {isLoading ? (
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <div className="text-lg font-medium text-gray-900">
                      {activeStrategies}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}