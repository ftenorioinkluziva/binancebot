// app/dashboard/strategies/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Button } from '@/app/components/ui/button';  
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { StrategyService } from '@/app/lib/services/strategy-service';

// Definir schema para os formulários com Zod
const baseStrategySchema = z.object({
  name: z.string().min(3, 'Nome precisa ter pelo menos 3 caracteres'),
  symbol: z.string().min(1, 'Selecione um par de trading'),
  type: z.enum(['DCA', 'BollingerBands', 'MovingAverage']),
  active: z.boolean().default(false),
});

const dcaSchema = baseStrategySchema.extend({
  type: z.literal('DCA'),
  amount: z.number().min(1, 'Valor precisa ser maior que 0'),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  dayOfWeek: z.number().optional(),
  dayOfMonth: z.number().optional(),
  hour: z.number().min(0).max(23).optional(),
});

const bollingerSchema = baseStrategySchema.extend({
  type: z.literal('BollingerBands'),
  period: z.number().min(5).max(100),
  deviation: z.number().min(1).max(5),
  amount: z.number().min(1, 'Valor precisa ser maior que 0'),
  buyLowerBand: z.boolean(),
  sellUpperBand: z.boolean(),
  trailingStopLoss: z.number().optional(),
});

const maSchema = baseStrategySchema.extend({
  type: z.literal('MovingAverage'),
  fastPeriod: z.number().min(5).max(50),
  slowPeriod: z.number().min(10).max(200),
  signalPeriod: z.number().min(5).max(50),
  amount: z.number().min(1, 'Valor precisa ser maior que 0'),
  maType: z.enum(['SMA', 'EMA', 'WMA']),
});

// Definir tipos baseados nos schemas
type DCAStrategy = z.infer<typeof dcaSchema>;
type BollingerStrategy = z.infer<typeof bollingerSchema>;
type MAStrategy = z.infer<typeof maSchema>;

// Função para verificar se uma estratégia é do tipo DCA
const isDCAStrategy = (data: any): data is DCAStrategy => {
  return data && data.type === 'DCA';
};

export default function NewStrategyPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'DCA' | 'BollingerBands' | 'MovingAverage'>('DCA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Simular lista de pares disponíveis
  const availablePairs = [
    { value: 'BTC/USDT', label: 'BTC/USDT - Bitcoin' },
    { value: 'ETH/USDT', label: 'ETH/USDT - Ethereum' },
    { value: 'BNB/USDT', label: 'BNB/USDT - Binance Coin' },
    { value: 'SOL/USDT', label: 'SOL/USDT - Solana' },
    { value: 'ADA/USDT', label: 'ADA/USDT - Cardano' },
    { value: 'XRP/USDT', label: 'XRP/USDT - Ripple' },
    { value: 'DOGE/USDT', label: 'DOGE/USDT - Dogecoin' },
  ];

  // Vamos usar uma abordagem que cria um novo formulário quando o tipo muda
  const DCAForm = useForm<DCAStrategy>({
    resolver: zodResolver(dcaSchema),
    defaultValues: {
      type: 'DCA',
      active: false,
      amount: 50,
      frequency: 'weekly',
      dayOfWeek: 1,
    }
  });
  
  const BollingerForm = useForm<BollingerStrategy>({
    resolver: zodResolver(bollingerSchema),
    defaultValues: {
      type: 'BollingerBands',
      active: false,
      period: 20,
      deviation: 2,
      amount: 100,
      buyLowerBand: true,
      sellUpperBand: true,
    }
  });
  
  const MAForm = useForm<MAStrategy>({
    resolver: zodResolver(maSchema),
    defaultValues: {
      type: 'MovingAverage',
      active: false,
      fastPeriod: 9,
      slowPeriod: 21,
      signalPeriod: 9,
      amount: 75,
      maType: 'EMA',
    }
  });

  // Selecionar o formulário apropriado baseado no tipo
  const currentForm = selectedType === 'DCA' 
    ? DCAForm 
    : selectedType === 'BollingerBands' 
      ? BollingerForm 
      : MAForm;
  
  const { register, handleSubmit, control, formState: { errors }, watch, reset } = currentForm;
  
  // Para DCA, nos precisamos acessar o frequency
  const watchedValues = watch();
  const frequency = selectedType === 'DCA' ? (watchedValues as DCAStrategy).frequency : undefined;

  const onSubmit = async (data: DCAStrategy | BollingerStrategy | MAStrategy) => {
    setIsSubmitting(true);
    
    try {
      // Usar o serviço para criar estratégia
      await StrategyService.createStrategy(data);
      
      // Mensagem de sucesso
      toast.success('Estratégia criada com sucesso!');
      
      // Redirecionar para a lista de estratégias
      router.push('/dashboard/strategies');
    } catch (error) {
      console.error('Erro ao salvar estratégia:', error);
      toast.error('Ocorreu um erro ao salvar a estratégia. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (value: 'DCA' | 'BollingerBands' | 'MovingAverage') => {
    setSelectedType(value);
    
    // Resetar o formulário com os valores padrão do novo tipo
    if (value === 'DCA') {
      reset({
        type: 'DCA',
        active: false,
        name: '',
        symbol: '',
        amount: 50,
        frequency: 'weekly',
        dayOfWeek: 1,
      } as z.infer<typeof dcaSchema>);
    } else if (value === 'BollingerBands') {
      reset({
        type: 'BollingerBands',
        active: false,
        name: '',
        symbol: '',
        period: 20,
        deviation: 2,
        amount: 100,
        buyLowerBand: true,
        sellUpperBand: true,
      } as z.infer<typeof bollingerSchema>);
    } else if (value === 'MovingAverage') {
      reset({
        type: 'MovingAverage',
        active: false,
        name: '',
        symbol: '',
        fastPeriod: 9,
        slowPeriod: 21,
        signalPeriod: 9,
        amount: 75,
        maType: 'EMA',
      } as z.infer<typeof maSchema>);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link href="/dashboard/strategies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">Nova Estratégia</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Estratégia</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: DCA Bitcoin Semanal" 
                  {...register('name')} 
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="symbol">Par de Trading</Label>
                <Controller
                  name="symbol"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="symbol">
                        <SelectValue placeholder="Selecione um par" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePairs.map((pair) => (
                          <SelectItem key={pair.value} value={pair.value}>
                            {pair.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.symbol && (
                  <p className="text-sm text-red-500">{errors.symbol.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Estratégia</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Tabs 
                    value={field.value} 
                    onValueChange={(value: 'DCA' | 'BollingerBands' | 'MovingAverage') => {
                      field.onChange(value);
                      handleTypeChange(value);
                    }}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="DCA">Compra Média (DCA)</TabsTrigger>
                      <TabsTrigger value="BollingerBands">Bandas de Bollinger</TabsTrigger>
                      <TabsTrigger value="MovingAverage">Média Móvel</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <Switch 
                    id="active" 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                )}
              />
              <Label htmlFor="active">Ativar estratégia imediatamente</Label>
            </div>
          </CardContent>
        </Card>
        
        {/* Configurações específicas para cada tipo de estratégia */}
        {selectedType === 'DCA' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Compra Média (DCA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor por Execução (USDT)</Label>
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="amount" 
                        type="number"
                        min="1"
                        step="0.1"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    )}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Controller
                    name={`frequency`}
                    control={control}
                    render={({ field }) => (
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="frequency">
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diária</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              
              {frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Dia da Semana</Label>
                  <Controller
                    name="dayOfWeek"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        value={field.value ? String(field.value) : '1'} 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger id="dayOfWeek">
                          <SelectValue placeholder="Selecione o dia da semana" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Segunda-feira</SelectItem>
                          <SelectItem value="2">Terça-feira</SelectItem>
                          <SelectItem value="3">Quarta-feira</SelectItem>
                          <SelectItem value="4">Quinta-feira</SelectItem>
                          <SelectItem value="5">Sexta-feira</SelectItem>
                          <SelectItem value="6">Sábado</SelectItem>
                          <SelectItem value="0">Domingo</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              
              {frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label htmlFor="dayOfMonth">Dia do Mês</Label>
                  <Controller
                    name="dayOfMonth"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        value={String(field.value || 1)} 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger id="dayOfMonth">
                          <SelectValue placeholder="Selecione o dia do mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={String(day)}>
                              Dia {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="hour">Hora do Dia</Label>
                <Controller
                  name="hour"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={String(field.value || 0)} 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <SelectTrigger id="hour">
                        <SelectValue placeholder="Selecione a hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <SelectItem key={hour} value={String(hour)}>
                            {hour.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Resumo da Estratégia</h4>
                <p className="text-sm text-blue-700">
                  {isDCAStrategy(watchedValues) && (
                    <>
                      Esta estratégia irá comprar 
                      <span className="font-medium"> {watchedValues.amount} USDT </span>
                      de {watchedValues.symbol || '[selecione um par]'} 
                      {watchedValues.frequency === 'daily' && ' todos os dias'}
                      {watchedValues.frequency === 'weekly' && ` toda semana às ${
                        watchedValues.dayOfWeek === 0 ? 'domingos' :
                        watchedValues.dayOfWeek === 1 ? 'segundas-feiras' :
                        watchedValues.dayOfWeek === 2 ? 'terças-feiras' :
                        watchedValues.dayOfWeek === 3 ? 'quartas-feiras' :
                        watchedValues.dayOfWeek === 4 ? 'quintas-feiras' :
                        watchedValues.dayOfWeek === 5 ? 'sextas-feiras' :
                        'sábados'
                      }`}
                      {watchedValues.frequency === 'monthly' && ` todo mês no dia ${watchedValues.dayOfMonth || 1}`}
                      {watchedValues.hour !== undefined && ` às ${watchedValues.hour.toString().padStart(2, '0')}:00`}.
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {selectedType === 'BollingerBands' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Bandas de Bollinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Conteúdo para Bollinger Bands - sem alterações */}
              {/* ... */}
            </CardContent>
          </Card>
        )}
        
        {selectedType === 'MovingAverage' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Média Móvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Conteúdo para Moving Average - sem alterações */}
              {/* ... */}
            </CardContent>
          </Card>
        )}
        
        <div className="mt-6 flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            className="mr-2"
            onClick={() => router.push('/dashboard/strategies')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
            )}
            <Save className="mr-2 h-4 w-4" />
            Salvar Estratégia
          </Button>
        </div>
      </form>
    </div>
  );
}