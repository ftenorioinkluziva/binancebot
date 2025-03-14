// components/dashboard/portfolio-summary.tsx
'use client';

import { ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Link from 'next/link';

// Expandimos a interface AssetBalance para incluir quantity e pricePerUnit
interface AssetBalance {
  symbol: string;
  value: number;
  percentage: number;
  color: string;
  quantity: number; // Quantidade de tokens
  pricePerUnit: number; // Preço unitário do token
}

interface PortfolioSummaryProps {
  assets: AssetBalance[];
  isLoading: boolean;
}

export function PortfolioSummary({ assets, isLoading }: PortfolioSummaryProps) {
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  
  // Função para formatar a quantidade de token com base no valor
  const formatQuantity = (quantity: number): string => {
    if (quantity < 0.001) return quantity.toFixed(8);
    if (quantity < 0.01) return quantity.toFixed(6);
    if (quantity < 1) return quantity.toFixed(4);
    if (quantity < 1000) return quantity.toFixed(2);
    return quantity.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Função para formatar o preço unitário com base no valor
  const formatPrice = (price: number): string => {
    if (price < 0.01) return '$' + price.toFixed(6);
    if (price < 1) return '$' + price.toFixed(4);
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
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
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-gray-500 mb-4">Nenhum ativo encontrado em seu portfólio.</p>
            <p className="text-sm text-gray-400">
              Adicione uma chave API válida ou faça seu primeiro depósito para começar.
            </p>
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
                  <div key={asset.symbol} className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full mr-3" style={{ backgroundColor: asset.color }}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{asset.symbol}</p>
                          <p className="text-sm text-gray-500">
                            {asset.percentage.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    {/* Adicionamos informações de quantidade e preço unitário */}
                    <div className="ml-11 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <span>Quantidade: </span>
                        <span className="font-medium">{formatQuantity(asset.quantity)} {asset.symbol}</span>
                      </div>
                      <div>
                        <span>Preço: </span>
                        <span className="font-medium">{formatPrice(asset.pricePerUnit)}</span>
                      </div>
                    </div>
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