// lib/binance.ts
import { Spot } from '@binance/connector';

export const createBinanceClient = (apiKey: string, apiSecret: string) => {
  return new Spot(apiKey, apiSecret);
};