import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import TradingPairsComponent from '@/app/components/trading-pairs/trading-pairs';

export default async function TradingPairsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return <TradingPairsComponent />;
}