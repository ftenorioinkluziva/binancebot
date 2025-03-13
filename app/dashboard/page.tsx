// app/dashboard/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { PortfolioSummary } from '@/components/dashboard/portfolio-summary';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { RecentTrades } from '@/components/dashboard/recent-trades';
import { ActiveStrategies } from '@/components/dashboard/active-strategies';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <DashboardOverview />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PortfolioSummary />
        <MarketOverview />
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActiveStrategies />
        <RecentTrades />
      </div>
    </div>
  );
}