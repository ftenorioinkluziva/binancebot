// components/dashboard/portfolio-summary.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Link from 'next/link';

type AssetData = {
  symbol: string;
  value: number;
  color: string;
};

export function PortfolioSummary() {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulação de carregamento de dados
  useEffect(() => {
    // Em um caso real, você buscaria esses dados da API da Binance
    setTimeout(() => {
      setAssets([
        { symbol: 'BTC', value: 6542.87, color: '#F7931A' },
        { symbol: 'ETH', value: 2985.34, color: '#627EEA' },
        { symbol: 'BNB', value: 1685.21, color: '#F3BA2F' },
        { symbol: 'SOL', value: 754.92, color: '#00FFA3' },
        { symbol: 'USDT', value: 484.94, color: '#26A17B' },
      ]);
      setIsLoading(false);
    }, 1500);
  }, []);

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Resumo do Portfólio
        </h3>
      </div>
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assets}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ symbol }) => symbol}
                  >
                    {assets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Valor']} 
                    labelFormatter={(index) => assets[index as number].symbol}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full mr-3" style={{ backgroundColor: asset.color }}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{asset.symbol}</p>
                        <p className="text-sm text-gray-500">
                          {((asset.value / totalValue) * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link href="/dashboard/portfolio" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
            Ver detalhes completos
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}