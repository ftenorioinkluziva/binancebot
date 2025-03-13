// components/dashboard/recent-trades.tsx
'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';

type Trade = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
  strategy: string;
};

export function RecentTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulação de carregamento de dados
  useEffect(() => {
    // Em um caso real, você buscaria esses dados da API
    setTimeout(() => {
      setTrades([
        { 
          id: 't1', 
          symbol: 'BTC/USDT', 
          side: 'BUY', 
          quantity: 0.052, 
          price: 43250.78, 
          total: 2249.04, 
          timestamp: '2025-03-13T10:15:23Z',
          strategy: 'DCA Bitcoin'
        },
        { 
          id: 't2', 
          symbol: 'ETH/USDT', 
          side: 'BUY', 
          quantity: 0.85, 
          price: 3278.45, 
          total: 2786.68, 
          timestamp: '2025-03-12T21:34:12Z',
          strategy: 'Bollinger ETH'
        },
        { 
          id: 't3', 
          symbol: 'SOL/USDT', 
          side: 'SELL', 
          quantity: 12.5, 
          price: 98.75, 
          total: 1234.38, 
          timestamp: '2025-03-12T18:22:47Z',
          strategy: 'MA CrossOver SOL'
        },
        { 
          id: 't4', 
          symbol: 'BNB/USDT', 
          side: 'BUY', 
          quantity: 1.25, 
          price: 432.12, 
          total: 540.15, 
          timestamp: '2025-03-11T15:45:36Z',
          strategy: 'Manual'
        },
      ]);
      setIsLoading(false);
    }, 1500);
  }, []);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Operações Recentes
        </h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Par
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(trade.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {trade.symbol}
                      </div>
                      <div className="text-xs text-gray-500">
                        {trade.strategy}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        trade.side === 'BUY' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.side === 'BUY' ? (
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="mr-1 h-3 w-3" />
                        )}
                        {trade.side}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ${trade.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: trade.price < 1 ? 6 : 2 })}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {trade.quantity.toLocaleString('en-US', { minimumFractionDigits: trade.quantity < 1 ? 6 : 2, maximumFractionDigits: 8 })}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a href="/dashboard/trades" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
            Ver todas as operações
            <ChevronRight className="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}