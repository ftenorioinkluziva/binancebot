'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/app/components/ui/alert';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Trade {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
  status: string;
  strategy?: string;
  [key: string]: any; // Permite outras propriedades
}

export default function TestTradesHistoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  const fetchTradesHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/trades-history');
      const data = await response.json();
      
      setRawResponse(data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar histórico de trades');
      }
      
      if (Array.isArray(data)) {
        setTrades(data);
      } else if (data.trades && Array.isArray(data.trades)) {
        setTrades(data.trades);
      } else {
        console.log('Formato de resposta inesperado:', data);
        setTrades([]);
        setError('Formato de resposta inesperado. Veja o console para detalhes.');
      }
    } catch (err) {
      console.error('Erro ao buscar histórico de trades:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Não carregar automaticamente para evitar possíveis problemas com a API
  }, []);
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Teste de getUserTradesHistory</h1>
        </div>
        <Button 
          onClick={fetchTradesHistory} 
          disabled={isLoading}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Carregando...' : 'Buscar Trades'}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Resultado da API ({trades.length} trades encontrados)</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              {isLoading ? 'Carregando dados...' : 'Nenhum trade encontrado. Clique em "Buscar Trades" para testar.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Par</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trade.id && trade.id.toString().substring(0, 8)}...
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(trade.timestamp)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trade.symbol}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          trade.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.side}
                        </span>
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
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Dados Brutos da Resposta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
            <pre className="text-xs text-gray-700">
              {rawResponse ? JSON.stringify(rawResponse, null, 2) : 'Nenhum dado disponível'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}