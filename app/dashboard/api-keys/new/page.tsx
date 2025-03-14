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
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2