// components/dashboard/market-overview.tsx
'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

type MarketItem = {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
};

export function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulação de carregamento de dados
  useEffect(() => {
    // Em um caso real, você buscaria esses dados da API da Binance
    setTimeout(() => {
      setMarketData([
        { symbol: 'BTC/USDT', price: 43250.78, change24h: 2.8, volume: 24789651.34 },
        { symbol: 'ETH/USDT', price: 3278.45, change24h: 1.5, volume: 15489621.23 },
        { symbol: 'BNB/USDT', price: 432.12, change24h: -0.7, volume: 5987432.12 },
        { symbol: 'SOL/USDT', price: 98.75, change24h: 5.2, volume: 4123654.45 },
        { symbol: 'XRP/USDT', price: 0.578, change24h: -1.2, volume: 3452187.67 },
      ]);
      setIsLoading(false);
    }, 1200);
  }, []);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Visão Geral do Mercado
        </h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Par
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    24h %
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {marketData.map((item) => (
                  <tr key={item.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: item.price < 1 ? 4 : 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium flex items-center justify-end ${
                        item.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.change24h >= 0 ? (
                          <TrendingUp className="mr-1 h-4 w-4" />
                        ) : (
                          <TrendingDown className="mr-1 h-4 w-4" />
                        )}
                        {item.change24h >= 0 ? '+' : ''}{item.change24h}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-500">
                        ${item.volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a href="/dashboard/market" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
            Ver todos os mercados
            <ChevronRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}