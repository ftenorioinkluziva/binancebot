// app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { AuthCard } from '@/components/ui/auth-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const registerSchema = z.object({
  name: z.string().min(2, 'Por favor, insira seu nome completo'),
  email: z.string().email('Por favor, insira um email válido'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });
  
  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.message || 'Erro ao registrar a conta. Por favor, tente novamente.');
        return;
      }
      
      router.push('/login?registered=true');
    } catch (err) {
      setError('Ocorreu um erro ao tentar criar sua conta. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthCard
      title="Crie sua conta"
      description="Registre-se para começar a usar o BinanceBot"
      footer={
        <p className="text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Entrar
          </Link>
        </p>
      }
    >
      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <Input
            label="Nome completo"
            type="text"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Seu Nome Completo"
          />
          
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="seu@email.com"
          />
          
          <Input
            label="Senha"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            placeholder="********"
          />
          
          <Input
            label="Confirmar senha"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            placeholder="********"
          />
        </div>
        
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          Criar conta
        </Button>
      </form>
    </AuthCard>
  );
}