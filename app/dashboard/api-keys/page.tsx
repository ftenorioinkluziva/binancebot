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
  Eye
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
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Falha ao validar chave API');
      }
      
      const { valid } = await response.json();
      
      if (valid) {
        toast.success('Chave API válida e conectada com sucesso!');
      } else {
        toast.error('Chave API inválida ou sem permissões necessárias.');
      }
    } catch (error) {
      console.error('Erro ao validar chave API:', error);
      toast.error('Ocorreu um erro ao validar a chave API.');
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
            <Card key={apiKey.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                  <Badge variant="outline">{apiKey.exchange}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">Chave API:</p>
                    <p className="text-sm font-mono">{apiKey.apiKey}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">Chave Secreta:</p>
                    <p className="text-sm font-mono">{apiKey.apiSecret}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {apiKey.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/api-keys/${apiKey.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteApiKey(apiKey.id!)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => validateApiKey(apiKey.id!)}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Validar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}