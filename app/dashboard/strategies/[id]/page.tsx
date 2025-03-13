// app/dashboard/strategies/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Importar o mesmo formulário usado na criação
// Nota: Em uma implementação real, você extrairia o formulário para um componente separado
// e o reutilizaria aqui. Para evitar duplicação, estamos simplificando.

export default function EditStrategyPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [strategy, setStrategy] = useState(null);
  
  useEffect(() => {
    // Simular carregamento da estratégia da API
    const fetchStrategy = async () => {
      setIsLoading(true);
      try {
        // Em um caso real, você faria uma chamada à API
        // await fetch(`/api/strategies/${id}`)
        
        // Simulação
        setTimeout(() => {
          // Dados fictícios - em um caso real, viria da sua API
          const mockStrategy = {
            id: id,
            name: 'DCA Bitcoin Semanal',
            type: 'DCA',
            symbol: 'BTC/USDT',
            active: true,
            config: {
              amount: 50,
              frequency: 'weekly',
              dayOfWeek: 1,
              hour: 9,
            },
          };
          
          setStrategy(mockStrategy);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erro ao carregar estratégia:', error);
        setIsLoading(false);
      }
    };
    
    fetchStrategy();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Estratégia não encontrada</h3>
        <p className="text-gray-500 mb-6">
          A estratégia que você está procurando não existe ou foi removida.
        </p>
        <Link href="/dashboard/strategies">
          <Button>Voltar para estratégias</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard/strategies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">Editar Estratégia</h1>
      </div>
      
      <Card className="p-6">
        <p className="text-gray-600 mb-6">
          Aqui você editaria os detalhes da estratégia "{strategy.name}".
          <br />
          Em uma implementação real, este formulário teria os mesmos campos da criação, mas pré-preenchidos.
        </p>
        
        <div className="mt-6 flex justify-between">
          <Button 
            variant="destructive" 
            onClick={() => {
              if (confirm('Tem certeza que deseja excluir esta estratégia?')) {
                // Simular exclusão
                router.push('/dashboard/strategies');
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Estratégia
          </Button>
          
          <div>
            <Button 
              type="button" 
              variant="outline" 
              className="mr-2"
              onClick={() => router.push('/dashboard/strategies')}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                // Simular salvamento
                setTimeout(() => {
                  router.push('/dashboard/strategies');
                }, 1000);
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}