// components/dashboard/recent-trades.tsx
'use client';

import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { TradeOverview } from '@/app/lib/services/dashboard-service';

interface RecentTradesProps {
  trades: TradeOverview[];
  isLoading: boolean;
}

export function RecentTrades({ trades, isLoading }: RecentTradesProps) {
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
        ) : trades.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-2">Nenhuma operação encontrada.</p>
            <p className="text-xs text-gray-400">
              As operações de suas estratégias aparecerão aqui.
            </p>
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
                        {trade.orderType} {trade.orderId && `#${trade.orderId.substring(0,8)}`}
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
          <Link href="/dashboard/trades" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
            Ver todas as operações
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}