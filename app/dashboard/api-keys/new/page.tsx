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
    spot: z.boolean().default(true),
    margin: z.boolean().default(false),
    futures: z.boolean().default(false),
    withdraw: z.boolean().default(false),
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
              <h3 className="text-sm font-medium text-gray-700 mb-3">Permissões</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="spot-permission">Spot Trading</Label>
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
                  <Label htmlFor="margin-permission">Margin Trading</Label>
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
                  <Label htmlFor="futures-permission">Futures Trading</Label>
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
                  <Label htmlFor="withdraw-permission">Withdraw</Label>
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