// app/dashboard/strategies/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
  Play, 
  Pause,
  Edit,
  Trash2,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { StrategyService } from '@/app/lib/services/strategy-service';
import { Strategy } from '@/app/types/strategy';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadStrategies = async () => {
      setIsLoading(true);
      try {
        const data = await StrategyService.getStrategies();
        setStrategies(data);
      } catch (error) {
        console.error('Erro ao carregar estratégias:', error);
        toast.error('Não foi possível carregar suas estratégias.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStrategies();
  }, []);

  const toggleStrategy = async (id: string) => {
    try {
      const updatedStrategy = await StrategyService.toggleStrategy(id);
      setStrategies(strategies.map(strategy => 
        strategy.id === id ? { ...strategy, active: updatedStrategy.active } : strategy
      ));
      toast.success(`Estratégia ${updatedStrategy.active ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alternar estado da estratégia:', error);
      toast.error('Ocorreu um erro ao alterar o estado da estratégia.');
    }
  };

  const deleteStrategy = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta estratégia?')) {
      try {
        await StrategyService.deleteStrategy(id);
        setStrategies(strategies.filter(strategy => strategy.id !== id));
        toast.success('Estratégia excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir estratégia:', error);
        toast.error('Ocorreu um erro ao excluir a estratégia.');
      }
    }
  };

  const getStrategyTypeLabel = (type: string) => {
    switch (type) {
      case 'DCA':
        return 'Compra média';
      case 'BollingerBands':
        return 'Bandas de Bollinger';
      case 'MovingAverage':
        return 'Média Móvel';
      default:
        return type;
    }
  };

  const getLastRunText = (lastRun: string | null) => {
    if (!lastRun) return 'Nunca executada';
    
    const lastRunDate = new Date(lastRun);
    const now = new Date();
    const diffMs = now.getTime() - lastRunDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `Há ${diffMins} minutos`;
    } else if (diffHours < 24) {
      return `Há ${diffHours} horas`;
    } else {
      return `Há ${diffDays} dias`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Estratégias</h1>
        <Link href="/dashboard/strategies/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Estratégia
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="active">Ativas</TabsTrigger>
          <TabsTrigger value="inactive">Inativas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : strategies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma estratégia encontrada</h3>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  Você ainda não configurou nenhuma estratégia de trading automatizado.
                  Comece criando sua primeira estratégia.
                </p>
                <Link href="/dashboard/strategies/new">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar primeira estratégia
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.map((strategy) => (
                <Card key={strategy.id} className="overflow-hidden">
                  <div className={`h-2 ${strategy.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <Badge variant={strategy.active ? "success" : "secondary"}>
                        {strategy.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex items-center">
                        {getStrategyTypeLabel(strategy.type)}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50">
                        {strategy.symbol}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-gray-500">Última execução</p>
                          <p className="font-medium text-gray-900">
                            {strategy.lastRun ? getLastRunText(strategy.lastRun) : 'Nunca executada'}
                          </p>
                        </div>
                      </div>
                      
                      {strategy.performance !== null && (
                        <div className="flex items-center">
                          {strategy.performance >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <div>
                            <p className="text-gray-500">Performance</p>
                            <p className={`font-medium ${
                              strategy.performance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {strategy.performance >= 0 ? '+' : ''}{strategy.performance}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/strategies/${strategy.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteStrategy(strategy.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                      <Button 
                        variant={strategy.active ? "success" : "secondary"} 
                        size="sm"
                        onClick={() => toggleStrategy(strategy.id)}
                      >
                        {strategy.active ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.filter(s => s.active).map((strategy) => (
                <Card key={strategy.id} className="overflow-hidden">
                  <div className="h-2 bg-green-500"></div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <Badge variant="success">Ativa</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex items-center">
                        {getStrategyTypeLabel(strategy.type)}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50">
                        {strategy.symbol}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-gray-500">Última execução</p>
                          <p className="font-medium text-gray-900">
                            {strategy.lastRun ? getLastRunText(strategy.lastRun) : 'Nunca executada'}
                          </p>
                        </div>
                      </div>
                      
                      {strategy.performance !== null && (
                        <div className="flex items-center">
                          {strategy.performance >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <div>
                            <p className="text-gray-500">Performance</p>
                            <p className={`font-medium ${
                              strategy.performance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {strategy.performance >= 0 ? '+' : ''}{strategy.performance}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/strategies/${strategy.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteStrategy(strategy.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => toggleStrategy(strategy.id)}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {!isLoading && strategies.filter(s => s.active).length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">Nenhuma estratégia ativa encontrada.</p>
              <Link href="/dashboard/strategies/new" className="mt-4 inline-block">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar estratégia
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.filter(s => !s.active).map((strategy) => (
                <Card key={strategy.id} className="overflow-hidden">
                  <div className="h-2 bg-gray-300"></div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <Badge variant="secondary">Inativa</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex items-center">
                        {getStrategyTypeLabel(strategy.type)}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50">
                        {strategy.symbol}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-gray-500">Última execução</p>
                          <p className="font-medium text-gray-900">
                            {strategy.lastRun ? getLastRunText(strategy.lastRun) : 'Nunca executada'}
                          </p>
                        </div>
                      </div>
                      
                      {strategy.performance !== null && (
                        <div className="flex items-center">
                          {strategy.performance >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <div>
                            <p className="text-gray-500">Performance</p>
                            <p className={`font-medium ${
                              strategy.performance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {strategy.performance >= 0 ? '+' : ''}{strategy.performance}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/strategies/${strategy.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteStrategy(strategy.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => toggleStrategy(strategy.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Ativar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {!isLoading && strategies.filter(s => !s.active).length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">Nenhuma estratégia inativa encontrada.</p>
              <Link href="/dashboard/strategies/new" className="mt-4 inline-block">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar estratégia
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}