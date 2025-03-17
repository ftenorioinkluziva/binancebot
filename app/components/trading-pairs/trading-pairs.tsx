'use client'
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ToggleLeft, ToggleRight, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
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
  const [symbolSearch, setSymbolSearch] = useState('');
  const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
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
      setFilteredSymbols(data);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível carregar os símbolos disponíveis');
    }
  };

  // Filtrar símbolos
  useEffect(() => {
    if (!symbolSearch) {
      setFilteredSymbols(availableSymbols);
      return;
    }

    const lowercaseSearch = symbolSearch.toLowerCase();
    const filtered = availableSymbols.filter(symbol => 
      symbol.toLowerCase().includes(lowercaseSearch)
    );
    setFilteredSymbols(filtered);
  }, [symbolSearch, availableSymbols]);

  // Adicionar novo par de trading
  const addTradingPair = async (symbol: string) => {
    if (!symbol) {
      toast.error('Selecione um símbolo');
      return;
    }

    try {
      const response = await fetch('/api/trading-pairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao adicionar par de trading');
      }

      const newPair = await response.json();
      setTradingPairs([...tradingPairs, newPair]);
      setSymbolSearch('');
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
            <Button variant="primary">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Par
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className='text-gray-600 mb-2'>Adicionar Novo Par de Trading</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Selecione um par de trading para adicionar
                </p>
              </div>
              <div className="relative">
                <Input 
                  placeholder="Busque por símbolo ou par" 
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  className="pl-10 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500 text-gray-400 mb-2"
                />
                {symbolSearch ? (
                  <button 
                    onClick={() => setSymbolSearch('')} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                )}
              </div>
              
              <div className="max-h-64 overflow-y-auto border border-indigo-100 rounded">
                {filteredSymbols.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 bg-gray-50">
                    Nenhum par encontrado
                  </div>
                ) : (
                  filteredSymbols.map((symbol) => (
                    <div 
                      key={symbol} 
                      onClick={() => addTradingPair(symbol)}
                      className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-indigo-100 last:border-b-0 transition-colors duration-200 ease-in-out"
                    >
                      <span className="text-gray-800 font-medium">{symbol}</span>
                    </div>
                  ))
                )}
              </div>
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
            <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Primeiro Par
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tradingPairs.map(pair => (
            <Card key={pair.id} className="overflow-hidden border-l-4 border-l-indigo-500 w-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="mr-3 p-2 bg-indigo-100 rounded-full">
                      <PlusCircle className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg truncate max-w-[200px] text-gray-800">{pair.symbol}</CardTitle>
                    </div>
                  </div>
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