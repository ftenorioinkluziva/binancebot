'use client'
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';

interface TradingPair {
  id: string;
  symbol: string;
  active: boolean;
}

export default function TradingPairsPage() {
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Buscar pares de trading existentes
  const fetchTradingPairs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/trading-pairs');
      if (!response.ok) throw new Error('Falha ao buscar pares de trading');
      const data = await response.json();
      setTradingPairs(data);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível carregar os pares de trading');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar símbolos disponíveis
  const fetchAvailableSymbols = async () => {
    try {
      const response = await fetch('/api/trading-pairs/available-symbols');
      if (!response.ok) throw new Error('Falha ao buscar símbolos');
      const data = await response.json();
      setAvailableSymbols(data);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível carregar os símbolos disponíveis');
    }
  };

  // Adicionar novo par de trading
  const addTradingPair = async () => {
    if (!newSymbol) {
      toast.error('Selecione um símbolo');
      return;
    }

    try {
      const response = await fetch('/api/trading-pairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: newSymbol })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao adicionar par de trading');
      }

      const newPair = await response.json();
      setTradingPairs([...tradingPairs, newPair]);
      setNewSymbol('');
      setIsDialogOpen(false);
      toast.success(`Par ${newPair.symbol} adicionado com sucesso`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar par de trading');
    }
  };

  // Alternar status do par de trading
  const toggleTradingPairStatus = async (pair: TradingPair) => {
    try {
      const response = await fetch(`/api/trading-pairs?id=${pair.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !pair.active })
      });

      if (!response.ok) throw new Error('Falha ao atualizar status');

      const updatedPair = await response.json();
      setTradingPairs(tradingPairs.map(p => 
        p.id === pair.id ? updatedPair : p
      ));
      
      toast.success(`Par ${updatedPair.symbol} ${updatedPair.active ? 'ativado' : 'desativado'}`);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível alterar o status do par');
    }
  };

  // Remover par de trading
  const removeTradingPair = async (pairId: string) => {
    if (!window.confirm('Tem certeza que deseja remover este par de trading?')) return;

    try {
      const response = await fetch(`/api/trading-pairs?id=${pairId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Falha ao remover par de trading');

      setTradingPairs(tradingPairs.filter(p => p.id !== pairId));
      toast.success('Par de trading removido com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível remover o par de trading');
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchTradingPairs();
    fetchAvailableSymbols();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Pares de Trading</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Par
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Par de Trading</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select 
                value={newSymbol} 
                onValueChange={setNewSymbol}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um símbolo" />
                </SelectTrigger>
                <SelectContent>
                  {availableSymbols.map(symbol => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={addTradingPair} 
                className="w-full"
              >
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : tradingPairs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">Nenhum par de trading configurado</p>
            <p className="text-sm text-gray-400 mb-6 text-center">
              Adicione pares de trading para monitorar suas operações automáticas
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeiro Par
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tradingPairs.map(pair => (
            <Card key={pair.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{pair.symbol}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => toggleTradingPairStatus(pair)}
                      className="text-gray-500 hover:text-gray-700"
                      title={pair.active ? 'Desativar' : 'Ativar'}
                    >
                      {pair.active ? (
                        <ToggleRight className="h-6 w-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                    <button 
                      onClick={() => removeTradingPair(pair.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Remover"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  Status: {pair.active ? 'Ativo' : 'Inativo'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}