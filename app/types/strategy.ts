// types/strategy.ts
export interface Strategy {
    id: string;
    userId: string;
    name: string;
    symbol: string;
    type: 'DCA' | 'BollingerBands' | 'MovingAverage';
    active: boolean;
    config: any;
    createdAt: string;
    updatedAt: string;
    lastRun?: string;
    performance?: number;
  }
  
  export interface DCAConfig {
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour?: number;
  }
  
  export interface BollingerBandsConfig {
    period: number;
    deviation: number;
    amount: number;
    buyLowerBand: boolean;
    sellUpperBand: boolean;
    trailingStopLoss?: number;
  }
  
  export interface MovingAverageConfig {
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
    amount: number;
    maType: 'SMA' | 'EMA' | 'WMA';
  }