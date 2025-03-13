// components/charts/price-chart.tsx
'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

interface PriceChartProps {
  data: { time: string; open: number; high: number; low: number; close: number }[];
  symbol: string;
  height?: number;
}

export function PriceChart({ data, symbol, height = 300 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return;
    
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
        textColor: 'rgba(17, 24, 39, 0.9)',
      },
      grid: {
        vertLines: { color: 'rgba(229, 231, 235, 0.7)' },
        horzLines: { color: 'rgba(229, 231, 235, 0.7)' },
      },
      width: chartContainerRef.current.clientWidth,
      height,
    });
    
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    
    candlestickSeries.setData(data);
    
    chart.timeScale().fitContent();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height]);

  return (
    <div className="w-full">
      <div className="px-4 py-2 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900">{symbol}</h4>
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
}