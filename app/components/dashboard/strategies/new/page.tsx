// app/dashboard/strategies/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

// Tipo da estratégia baseado nos schemas
type Strategy = z.infer<typeof dcaSchema> | z.infer<typeof bollingerSchema> | z.infer<typeof maSchema>;

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

  // Configurar o form baseado no tipo selecionado
  const { register, handleSubmit, control, formState: { errors }, watch } = useForm<Strategy>({
    resolver: zodResolver(
      selectedType === 'DCA' 
        ? dcaSchema 
        : selectedType === 'BollingerBands' 
          ? bollingerSchema 
          : maSchema
    ),
    defaultValues: {
      type: selectedType,
      active: false,
      // DCA defaults
      amount: 50,
      frequency: 'weekly',
      dayOfWeek: 1,
      // Bollinger defaults
      period: 20,
      deviation: 2,
      buyLowerBand: true,
      sellUpperBand: true,
      // MA defaults
      fastPeriod: 9,
      slowPeriod: 21,
      signalPeriod: 9,
      maType: 'EMA',
    }
  });

  const frequency = watch('frequency');

  const onSubmit = async (data: Strategy) => {
    setIsSubmitting(true);
    
    try {
      // Aqui você faria a chamada à API para salvar a estratégia
      console.log('Estratégia a ser salva:', data);
      
      // Simular uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirecionar para a lista de estratégias
      router.push('/dashboard/strategies');
    } catch (error) {
      console.error('Erro ao salvar estratégia:', error);
      alert('Ocorreu um erro ao salvar a estratégia. Tente novamente.');
    } finally {
      setIsSubmitting(false);
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
                      setSelectedType(value);
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
                    name="frequency"
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
                        value={String(field.value)} 
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
                  Esta estratégia irá comprar 
                  <span className="font-medium"> {watch('amount')} USDT </span>
                  de {watch('symbol')} 
                  {frequency === 'daily' && ' todos os dias'}
                  {frequency === 'weekly' && ` toda semana às segundas-feiras`}
                  {frequency === 'monthly' && ` todo mês no dia 1`}
                  {watch('hour') !== undefined && ` às ${watch('hour')}:00`}.
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="period">Período</Label>
                  <Controller
                    name="period"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="period" 
                        type="number"
                        min="5"
                        max="100"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500">Períodos para calcular a média móvel (recomendado: 20)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deviation">Desvio Padrão</Label>
                  <Controller
                    name="deviation"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="deviation" 
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        // app/dashboard/strategies/new/page.tsx (continuação do componente BollingerBands)
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500">Multiplicador do desvio padrão (recomendado: 2)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bbAmount">Valor por Operação (USDT)</Label>
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="bbAmount" 
                        type="number"
                        min="1"
                        step="0.1"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="buyLowerBand"
                    control={control}
                    render={({ field }) => (
                      <Switch 
                        id="buyLowerBand" 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    )}
                  />
                  <Label htmlFor="buyLowerBand">Comprar na banda inferior</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Controller
                    name="sellUpperBand"
                    control={control}
                    render={({ field }) => (
                      <Switch 
                        id="sellUpperBand" 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    )}
                  />
                  <Label htmlFor="sellUpperBand">Vender na banda superior</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trailingStopLoss">Stop Loss Móvel (%)</Label>
                <Controller
                  name="trailingStopLoss"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="trailingStopLoss" 
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Opcional"
                    />
                  )}
                />
                <p className="text-xs text-gray-500">Porcentagem para stop loss móvel (deixe em branco para desativar)</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Resumo da Estratégia</h4>
                <p className="text-sm text-blue-700">
                  Esta estratégia irá usar Bandas de Bollinger com período de {watch('period')} e desvio padrão de {watch('deviation')} 
                  para {watch('symbol')}.
                  {watch('buyLowerBand') && ' Comprará quando o preço tocar a banda inferior.'}
                  {watch('sellUpperBand') && ' Venderá quando o preço tocar a banda superior.'}
                  {' '}Cada operação utilizará {watch('amount')} USDT.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {selectedType === 'MovingAverage' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Média Móvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fastPeriod">Período Rápido</Label>
                  <Controller
                    name="fastPeriod"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="fastPeriod" 
                        type="number"
                        min="5"
                        max="50"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500">Período da média móvel rápida (recomendado: 9)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slowPeriod">Período Lento</Label>
                  <Controller
                    name="slowPeriod"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="slowPeriod" 
                        type="number"
                        min="10"
                        max="200"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500">Período da média móvel lenta (recomendado: 21)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maAmount">Valor por Operação (USDT)</Label>
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="maAmount" 
                        type="number"
                        min="1"
                        step="0.1"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="signalPeriod">Período de Sinal</Label>
                  <Controller
                    name="signalPeriod"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="signalPeriod" 
                        type="number"
                        min="5"
                        max="50"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500">Período para a linha de sinal (recomendado: 9)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maType">Tipo de Média Móvel</Label>
                  <Controller
                    name="maType"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="maType">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SMA">Simples (SMA)</SelectItem>
                          <SelectItem value="EMA">Exponencial (EMA)</SelectItem>
                          <SelectItem value="WMA">Ponderada (WMA)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Resumo da Estratégia</h4>
                <p className="text-sm text-blue-700">
                  Esta estratégia irá usar cruzamento de Médias Móveis do tipo {watch('maType')} com períodos 
                  de {watch('fastPeriod')} (rápida) e {watch('slowPeriod')} (lenta) para {watch('symbol')}.
                  Comprará quando a média rápida cruzar para cima da média lenta e venderá quando cruzar para baixo.
                  Cada operação utilizará {watch('amount')} USDT.
                </p>
              </div>
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