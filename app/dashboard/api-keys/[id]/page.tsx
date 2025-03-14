'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Key } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';

// Schema para validação
const apiKeyEditSchema = z.object({
  permissions: z.object({
    spot: z.boolean().default(false),
    margin: z.boolean().default(false),
    futures: z.boolean().default(false),
    withdraw: z.boolean().default(false),
  }),
});

type ApiKeyEditFormValues = z.infer<typeof apiKeyEditSchema>;

export default function EditApiKeyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState<any>(null);
  
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<ApiKeyEditFormValues>({
    resolver: zodResolver(apiKeyEditSchema),
    defaultValues: {
      permissions: {
        spot: false,
        margin: false,
        futures: false,
        withdraw: false,
      },
    },
  });
  
  // Carregar os dados da chave API
  useEffect(() => {
    const fetchApiKey = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/api-keys/${id}`);
        
        if (!response.ok) {
          throw new Error('Falha ao carregar chave API');
        }
        
        const data = await response.json();
        setApiKey(data);
        
        // Definir permissões no formulário
        data.permissions.forEach((perm: string) => {
          setValue(`permissions.${perm}`, true);
        });
        
      } catch (error) {
        console.error('Erro ao carregar chave API:', error);
        toast.error('Não foi possível carregar os dados da chave API.');
        router.push('/dashboard/api-keys');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiKey();
  }, [id, router, setValue]);
  
  const onSubmit = async (data: ApiKeyEditFormValues) => {
    setIsSaving(true);
    
    try {
      // Converter permissões de objeto para array
      const permissionsArray = Object.entries(data.permissions)
        .filter(([_, value]) => value)
        .map(([key]) => key);
      
      if (permissionsArray.length === 0) {
        toast.error('Selecione pelo menos uma permissão');
        setIsSaving(false);
        return;
      }
      
      // Enviar apenas as permissões para atualização
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: permissionsArray,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar chave API');
      }
      
      toast.success('Permissões da chave API atualizadas com sucesso!');
      router.push('/dashboard/api-keys');
    } catch (error) {
      console.error('Erro ao atualizar chave API:', error);
      toast.error('Ocorreu um erro ao atualizar as permissões da chave API.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!apiKey) {
    return (
      <div className="text-center">
        <p>Chave API não encontrada.</p>
        <Button onClick={() => router.push('/dashboard/api-keys')} className="mt-4">
          Voltar para lista de chaves
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/dashboard/api-keys">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Editar Permissões da Chave API</h1>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 p-2 bg-indigo-100 rounded-full">
                <Key className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle>{apiKey.name}</CardTitle>
                <CardDescription>
                  {apiKey.exchange === 'binance' ? 'Binance' : 'Binance US'}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Ativa</Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div className="border rounded p-3 bg-gray-50">
              <h3 className="text-sm font-medium mb-2">Informações da Chave</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="apiKey" className="text-xs text-gray-500">Chave API</Label>
                  <div className="font-mono text-sm px-2 py-1.5 bg-white rounded border border-gray-200">
                    {apiKey.apiKey.substring(0, 10)}•••••••••••••••••••••••
                  </div>
                </div>
                <div>
                  <Label htmlFor="secretKey" className="text-xs text-gray-500">Chave Secreta</Label>
                  <div className="font-mono text-sm px-2 py-1.5 bg-white rounded border border-gray-200">
                    •••••••••••••••••••••••
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Criada em {new Date(apiKey.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Permissões</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded p-4">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="permissions.spot"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="spot-permission" 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="spot-permission" className="cursor-pointer">Spot Trading</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="permissions.margin"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="margin-permission" 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="margin-permission" className="cursor-pointer">Margin Trading</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="permissions.futures"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="futures-permission" 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="futures-permission" className="cursor-pointer">Futures Trading</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="permissions.withdraw"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="withdraw-permission" 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="withdraw-permission" className="cursor-pointer">Saques</Label>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-md flex items-start">
                  <div className="text-yellow-500 mr-3 mt-0.5">⚠️</div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Atenção</h4>
                    <p className="text-sm text-yellow-700">
                      A alteração de permissões afeta apenas o controle local. Para restringir totalmente o acesso da chave API,
                      você deve configurar as permissões diretamente na interface da exchange.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push('/dashboard/api-keys')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                  >
                    {isSaving && (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Permissões
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}