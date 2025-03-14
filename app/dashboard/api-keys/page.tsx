// app/dashboard/api-keys/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Key, 
  Check, 
  AlertTriangle,
  EyeOff,
  Eye,
  Copy,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ApiKeyData } from '@/app/lib/services/api-key-service';

export default function ApiKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadApiKeys = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/api-keys');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar chaves API');
        }
        
        const data = await response.json();
        setApiKeys(data);
      } catch (error) {
        console.error('Erro ao carregar chaves API:', error);
        toast.error('Não foi possível carregar suas chaves API.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadApiKeys();
  }, []);

  const deleteApiKey = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta chave API?')) {
      try {
        const response = await fetch(`/api/api-keys/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Falha ao excluir chave API');
        }
        
        setApiKeys(apiKeys.filter(key => key.id !== id));
        toast.success('Chave API excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir chave API:', error);
        toast.error('Ocorreu um erro ao excluir a chave API.');
      }
    }
  };

  const validateApiKey = async (id: string) => {
    try {
      setValidating(id);
      toast.loading('Validando chave API...', { id: 'validating' });
      
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || 'Falha ao validar chave API', { id: 'validating' });
        return;
      }
      
      if (result.valid) {
        // Criar uma mensagem detalhada baseada nas permissões
        const permissionsText = Object.entries(result.permissions)
          .filter(([_, enabled]) => enabled)
          .map(([key]) => {
            switch(key) {
              case 'spot': return 'Spot Trading';
              case 'margin': return 'Margin Trading';
              case 'futures': return 'Futures Trading';
              case 'withdraw': return 'Saques';
              default: return key;
            }
          })
          .join(', ');
        
        toast.success(
          `Chave API válida! Permissões detectadas: ${permissionsText || 'Nenhuma'}`, 
          { id: 'validating', duration: 5000 }
        );
        
        // Recarregar os dados da chave para refletir as permissões atualizadas
        loadApiKeys();
      } else {
        toast.error(result.error || 'Chave API inválida', { id: 'validating' });
      }
    } catch (error) {
      console.error('Erro ao validar chave API:', error);
      toast.error('Ocorreu um erro ao validar a chave API.', { id: 'validating' });
    } finally {
      setValidating(null);
    }
  };
  
  // Adicionar função para recarregar as chaves
  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/api-keys');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar chaves API');
      }
      
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      console.error('Erro ao carregar chaves API:', error);
      toast.error('Não foi possível carregar suas chaves API.');
    } finally {
      setIsLoading(false);
    }
  };

  const [validating, setValidating] = useState<string | null>(null);

  const onSubmit = async (data: ApiKeyFormValues) => {
    setIsLoading(true);
    
    try {
      // Convertemos as permissões do objeto para array
      const permissionsArray = Object.entries(data.permissions)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      const apiKeyData = {
        name: data.name,
        exchange: data.exchange,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        permissions: permissionsArray,
      };
      
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiKeyData),
      });
      
      // Se o status for 409 Conflict, isso significa que já existe uma chave para essa exchange
      if (response.status === 409) {
        const errorData = await response.json();
        toast.error(errorData.error);
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar chave API');
      }
      
      toast.success('Chave API adicionada com sucesso!');
      router.push('/dashboard/api-keys');
    } catch (error) {
      console.error('Erro ao salvar chave API:', error);
      toast.error('Ocorreu um erro ao salvar a chave API. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }; 

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Chaves API</h1>
        <Link href="/dashboard/api-keys/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Chave API
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma chave API encontrada</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              Você ainda não configurou nenhuma chave API para integração com exchanges.
              Adicione sua primeira chave para começar a operar.
            </p>
            <Link href="/dashboard/api-keys/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar primeira chave API
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="overflow-hidden border-l-4 border-l-indigo-500 w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 p-2 bg-indigo-100 rounded-full">
                      <Key className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg truncate max-w-[200px]">{apiKey.name}</CardTitle>
                      <p className="text-sm text-gray-500">{apiKey.exchange === 'binance' ? 'Binance' : 'Binance US'}</p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap"
                  >
                    Ativa
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-500">Chave API</span>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                            <Eye className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="font-mono text-sm px-2 py-1.5 bg-white rounded border border-gray-200 overflow-x-auto">
                        {/* Mostrar apenas os 10 primeiros caracteres seguidos por pontos */}
                        {apiKey.apiKey.substring(0, 10)}•••••••••••••••••••••••
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-500">Chave Secreta</span>
                      </div>
                      <div className="font-mono text-sm px-2 py-1.5 bg-white rounded border border-gray-200 overflow-x-auto">
                        •••••••••••••••••••••••
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Permissões</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                      Leitura
                    </Badge>
                    
                    {apiKey.permissions.includes('SPOT') && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                        Spot Trading
                      </Badge>
                    )}
                    
                    {apiKey.permissions.includes('MARGIN') && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                        Margin Trading
                      </Badge>
                    )}
                    
                    {apiKey.permissions.includes('MARGIN_LOAN') && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                        Empréstimo de Margem
                      </Badge>
                    )}
                    
                    {apiKey.permissions.includes('TRANSFER') && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                        Transferência
                      </Badge>
                    )}
                    
                    {apiKey.permissions.includes('WITHDRAW') && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                        Saques
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    Criada em {new Date(apiKey.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 flex items-center"
                      onClick={() => router.push(`/dashboard/api-keys/${apiKey.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteApiKey(apiKey.id!)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => validateApiKey(apiKey.id!)}
                      className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 h-8 flex items-center"
                      disabled={validating === apiKey.id}
                    >
                      {validating === apiKey.id ? (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                      ) : (
                        <ShieldCheck className="h-4 w-4 mr-1" />
                      )}
                      Validar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          ))}
        </div>
      )}
    </div>
  );
}