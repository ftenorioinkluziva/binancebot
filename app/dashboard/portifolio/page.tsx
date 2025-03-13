// app/dashboard/portfolio/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortfolioSummary } from '@/components/dashboard/portfolio-summary';
import { PriceChart } from '@/components/charts/price-chart';

// Dados simulados para o gráfico de preços
const generateCandlestickData = (days = 30, basePrice = 43000, volatility = 1000) => {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const prevClose = data.length ? data[data.length - 1].close : basePrice;
    const change = (Math.random() - 0.5) * volatility;
    const close = prevClose + change;
    const open = prevClose + (Math.random() - 0.5) * (volatility * 0.5);
    const high = Math.max(open, close) + Math.random() * (volatility * 0.3);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.3);
    
    data.push({
      time: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
    });
  }
  
  return data;
};

export default function PortfolioPage() {
  const [candlestickData, setCandlestickData] = useState([]);
  
  useEffect(() => {
    // Simular dados de velas para BTC
    setCandlestickData(generateCandlestickData());
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Portfólio</h1>
      
      <PortfolioSummary />
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="assets">Ativos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>BTC/USDT</CardTitle>
                <CardDescription>Histórico de Preços</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {candlestickData.length > 0 && (
                    <PriceChart 
                      data={candlestickData} 
                      symbol="BTC/USDT" 
                      height={350} 
                    />
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Ativos</CardTitle>
                <CardDescription>Alocação atual do portfólio</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Aqui iria um componente de gráfico de distribuição de ativos */}
                <div className="h-[350px] flex items-center justify-center bg-gray-50">
                  Implementar visualização de distribuição de ativos
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Seus Ativos</CardTitle>
              <CardDescription>Detalhes de todos os ativos no seu portfólio</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Aqui iria uma tabela detalhada de ativos */}
              <div className="h-[400px] flex items-center justify-center bg-gray-50">
                Implementar tabela detalhada de ativos
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance do Portfólio</CardTitle>
              <CardDescription>Análise de desempenho ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Aqui iria um gráfico de performance */}
              <div className="h-[400px] flex items-center justify-center bg-gray-50">
                Implementar gráfico de performance
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}