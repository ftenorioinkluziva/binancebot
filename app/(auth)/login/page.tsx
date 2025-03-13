// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { AuthCard } from '@/components/ui/auth-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.string().email('Por favor, insira um email válido'),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });
      
      if (result?.error) {
        setError('Email ou senha inválidos. Por favor, tente novamente.');
        return;
      }
      
      router.push('/dashboard');
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthCard
      title="Entre na sua conta"
      description="Entre com suas credenciais para acessar o BinanceBot"
      footer={
        <p className="text-center text-sm text-gray-600">
          Não tem uma conta?{' '}
          <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Registre-se
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
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="seu@email.com"
          />
          
          <div>
            <div className="flex items-center justify-between">
              <Input
                label="Senha"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                placeholder="********"
              />
            </div>
            <div className="text-right mt-1">
              <Link href="/reset-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Esqueceu sua senha?
              </Link>
            </div>
          </div>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          Entrar
        </Button>
      </form>
    </AuthCard>
  );
}