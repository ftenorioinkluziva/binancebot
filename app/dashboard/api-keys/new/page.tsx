// app/dashboard/api-keys/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';

// Schema para validação
const apiKeySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  exchange: z.string().default('binance'),
  apiKey: z.string().min(10, 'Chave API inválida'),
  apiSecret: z.string().min(10, 'Chave secreta inválida'),
  permissions: z.object({
    enableReading: z.boolean().default(true),
    enableSpotAndMarginTrading: z.boolean().default(false),
    enableMarginLoan: z.boolean().default(false),
    enableUniversalTransfer: z.boolean().default(false),
    enableWithdraw: z.boolean().default(false),
    enableSymbolPermissionList: z.boolean().default(false),
  }),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

export default function NewApiKeyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  
  const { register, handleSubmit, control, formState: { errors } } = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      exchange: 'binance',
      permissions: {
        spot: true,
        margin: false,
        futures: false,
        withdraw: false,
      },
    },
  });
  
  const onSubmit = async (data: ApiKeyFormValues) => {
    setIsLoading(true);
    
    try {
      // Convertemos as permissões para o formato que a API espera
      const permissionsArray = ApiKeyService.convertInternalPermissionsToBinance({
        enableReading: true,
        enableSpotAndMarginTrading: data.permissions.enableSpotAndMarginTrading,
        enableMarginLoan: data.permissions.enableMarginLoan,
        enableUniversalTransfer: data.permissions.enableUniversalTransfer,
        enableWithdraw: data.permissions.enableWithdraw,
        enableSymbolPermissionList: data.permissions.enableSymbolPermissionList
      });
      
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

      const responseData = await response.json();
      
    if (!response.ok) {
      // Verificamos se o erro é específico de chave duplicada (status 409)
      if (response.status === 409) {
        toast.error(responseData.error || 'Já existe uma chave API para esta exchange');
        return;
      }
      
      throw new Error(responseData.error || 'Falha ao salvar chave API');
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
  
  const exchanges = [
    { value: 'binance', label: 'Binance' },
    { value: 'binance_us', label: 'Binance US' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/dashboard/api-keys">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Nova Chave API</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Chave API</CardTitle>
            <CardDescription>
              Adicione uma nova chave API para integração com a exchange. Certifique-se de criar a chave API com as permissões corretas.
              <div className="mt-1 text-amber-600">
                Observação: É permitida apenas uma chave API por exchange.
              </div>
            </CardDescription>
            <div className="bg-blue-50 p-4 rounded-md flex items-start mb-4">
              <div className="shrink-0 text-blue-400 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Uma chave API por exchange</h4>
                <p className="text-sm text-blue-700">
                  O sistema permite apenas uma chave API por exchange. Para usar uma chave diferente, 
                  edite ou remova a existente.
                </p>
              </div>
            </div>            
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="name">Nome da Chave</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Binance Principal" 
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exchange">Exchange</Label>
                <Controller
                  name="exchange"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="exchange">
                        <SelectValue placeholder="Selecione a exchange" />
                      </SelectTrigger>
                      <SelectContent>
                        {exchanges.map((exchange) => (
                          <SelectItem key={exchange.value} value={exchange.value}>
                            {exchange.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="apiKey">Chave API</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="h-6 w-6 p-0 rounded-full"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Input 
                id="apiKey" 
                type={showApiKey ? "text" : "password"} 
                placeholder="Insira sua chave API" 
                {...register('apiKey')}
              />
              {errors.apiKey && (
                <p className="text-sm text-red-500">{errors.apiKey.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="apiSecret">Chave Secreta</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowApiSecret(!showApiSecret)}
                  className="h-6 w-6 p-0 rounded-full"
                >
                  {showApiSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Input 
                id="apiSecret" 
                type={showApiSecret ? "text" : "password"} 
                placeholder="Insira sua chave secreta" 
                {...register('apiSecret')}
              />
              {errors.apiSecret && (
                <p className="text-sm text-red-500">{errors.apiSecret.message}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Restrições de API</h3>
              <div className="grid grid-cols-1 gap-3 border rounded p-4">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="permissions.enableReading"
                    control={control}
                    render={({ field }) => (
                      <Switch 
                        id="enable-reading" 
                        checked={true} 
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
                  {watchedValues.permissions?.enableSymbolPermissionList && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="ml-2"
                      type="button"
                      onClick={() => { /* Implementar edição de símbolos */ }}
                    >
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </div>            

            <div className="bg-yellow-50 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Importante sobre segurança</h4>
                <p className="text-sm text-yellow-700">
                  Suas chaves API são armazenadas com criptografia segura. No entanto, recomendamos:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  <li>Habilitar apenas as permissões necessárias (desative withdrawals se não forem necessários)</li>
                  <li>Restringir a chave API a endereços IP específicos na exchange</li>
                  <li>Criar chaves API diferentes para finalidades diferentes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            className="mr-2"
            onClick={() => router.push('/dashboard/api-keys')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
            )}
            <Save className="mr-2 h-4 w-4" />
            Salvar Chave API
          </Button>
        </div>
      </form>
    </div>
  );
}