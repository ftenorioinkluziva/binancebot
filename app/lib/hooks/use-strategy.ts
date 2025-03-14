// app/lib/hooks/use-strategy.ts
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface UseStrategyResult {
  isToggling: boolean;
  toggleStrategy: (id: string) => Promise<boolean>;
}

export function useStrategy(): UseStrategyResult {
  const [isToggling, setIsToggling] = useState(false);

  const toggleStrategy = async (id: string): Promise<boolean> => {
    setIsToggling(true);
    
    try {
      const response = await fetch(`/api/strategies/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao alternar estado da estratégia');
      }

      const updatedStrategy = await response.json();
      
      toast.success(`Estratégia ${updatedStrategy.active ? 'ativada' : 'desativada'} com sucesso!`);
      
      return true;
    } catch (error) {
      console.error('Erro ao alternar estado da estratégia:', error);
      toast.error('Ocorreu um erro ao alterar o estado da estratégia.');
      return false;
    } finally {
      setIsToggling(false);
    }
  };

  return {
    isToggling,
    toggleStrategy
  };
}