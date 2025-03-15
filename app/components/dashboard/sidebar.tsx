// components/dashboard/sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BarChart2, 
  Settings, 
  Activity, 
  TrendingUp, 
  Layers, 
  PieChart,
  Repeat,
  ArrowRightLeft,
  Database
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Portfólio', href: '/dashboard/portfolio', icon: PieChart },
    { name: 'Estratégias', href: '/dashboard/strategies', icon: Activity },
    { name: 'Mercado', href: '/dashboard/market', icon: TrendingUp },
    { name: 'Pares de Trading', href: '/dashboard/trading-pairs', icon: Database }, // Novo item
    { name: 'Compra Recorrente', href: '/dashboard/recurring', icon: Repeat },
    { name: 'Opções', href: '/dashboard/options', icon: BarChart2 },
    { name: 'Transferências', href: '/dashboard/transfers', icon: ArrowRightLeft },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Database },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className={`${expanded ? 'w-64' : 'w-20'} transition-all duration-300 bg-indigo-800 text-white flex flex-col h-full`}>
      <div className="flex items-center justify-between h-16 flex-shrink-0 px-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {expanded ? (
              <span className="text-xl font-bold">BinanceBot</span>
            ) : (
              <span className="text-xl font-bold">BB</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        >
          <Layers className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-5 flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'bg-indigo-900 text-white'
                    : 'text-indigo-100 hover:bg-indigo-700'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                {expanded && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}