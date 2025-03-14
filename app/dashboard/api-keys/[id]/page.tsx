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

// Schema para formulário de edição de API key
const apiKeyEditSchema = z.object({
  permissions: z.object({
    enableReading: z.boolean().default(true),
    enableSpotAndMarginTrading: z.boolean().default(false),
    enableMarginLoan: z.boolean().default(false),
    enableUniversalTransfer: z.boolean().default(false),
    enableWithdraw: z.boolean().default(false),
    enableSymbolPermissionList: z.boolean().default(false),
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
  
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ApiKeyEditFormValues>({
    resolver: zodResolver(apiKeyEditSchema),
    defaultValues: {
      permissions: {
        enableReading: true,
        enableSpotAndMarginTrading: false,
        enableMarginLoan: false,
        enableUniversalTransfer: false,
        enableWithdraw: false,
        enableSymbolPermissionList: false,
      },
    },
  });
  
  // Watch para o valor de enableSymbolPermissionList
  const enableSymbolPermission = watch('permissions.enableSymbolPermissionList');
  
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
        
        // Mapear permissões da API para o formato do formulário
        const permissionsMap: Record<string, string> = {
          'READ': 'enableReading',
          'SPOT': 'enableSpotAndMarginTrading',
          'MARGIN': 'enableSpotAndMarginTrading',
          'MARGIN_LOAN': 'enableMarginLoan',
          'TRANSFER': 'enableUniversalTransfer',
          'WITHDRAW': 'enableWithdraw',
        };
        
        // Definir valores iniciais do formulário com base nas permissões existentes
        Object.values(permissionsMap).forEach(formPerm => {
          setValue(`permissions.${formPerm}`, false);
        });
        
        // Definir permissões que o usuário já tem
        data.permissions.forEach((perm: string) => {
          if (permissionsMap[perm]) {
            setValue(`permissions.${permissionsMap[perm]}`, true);
          }
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
      // Converter permissões de objeto para array no formato da API
      const permissionsMap: Record<string, string[]> = {
        'enableReading': ['READ'],
        'enableSpotAndMarginTrading': ['SPOT', 'MARGIN'],
        'enableMarginLoan': ['MARGIN_LOAN'],
        'enableUniversalTransfer': ['TRANSFER'],
        'enableWithdraw': ['WITHDRAW'],
      };
      
      let permissionsArray: string[] = [];
      
      // Adicionar permissões habilitadas
      Object.entries(data.permissions).forEach(([key, value]) => {
        if (value && permissionsMap[key]) {
          permissionsArray = [...permissionsArray, ...permissionsMap[key]];
        }
      });
      
      // A leitura é sempre habilitada
      if (!permissionsArray.includes('READ')) {
        permissionsArray.push('READ');
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
                <h3 className="text-sm font-medium">Restrições de API</h3>
                <div className="grid grid-cols-1 gap-3 border rounded p-4">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="permissions.enableReading"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="enable-reading" 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          disabled={true} // Sempre habilitado
                        />
                      )}
                    />
                    <Label htmlFor="enable-reading" className="cursor-pointer">
                      Habilitar Leitura
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="permissions.enableSpotAndMarginTrading"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="enable-spot-margin" 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="enable-spot-margin" className="cursor-pointer">
                      Ativar Trading Spot e de Margem
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="permissions.enableMarginLoan"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="enable-margin-loan" 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="enable-margin-loan" className="cursor-pointer">
                      Habilitar Empréstimo, Reembolso e Transferência de Margem
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="permissions.enableUniversalTransfer"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="enable-universal-transfer" 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="enable-universal-transfer" className="cursor-pointer">
                      Permitir Transferência Universal
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="permissions.enableWithdraw"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="enable-withdraw" 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="enable-withdraw" className="cursor-pointer">
                      Habilitar Saques
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="permissions.enableSymbolPermissionList"
                      control={control}
                      render={({ field }) => (
                        <Switch 
                          id="enable-symbol-permission" 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="enable-symbol-permission" className="cursor-pointer">
                      Ativar Lista de Permissões do Símbolo
                    </Label>
                    {enableSymbolPermission && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="ml-2"
                        type="button"
                        onClick={() => { /* Abrir modal para configurar símbolos permitidos */ }}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
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