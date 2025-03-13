// app/(auth)/reset-password/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { AuthCard } from '@/components/ui/auth-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const resetPasswordSchema = z.object({
  email: z.string().email('Por favor, insira um email válido'),
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });
  
  const onSubmit = async (data: ResetPasswordValues) => {
    setIsLoading(true);
    
    try {
      // Aqui você implementaria a chamada para a API de recuperação de senha
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      
      // Simular sucesso
      setEmailSent(true);
    } catch (err) {
      console.error('Erro ao enviar email de recuperação', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (emailSent) {
    return (
      <AuthCard
        title="Email enviado"
        description="Enviamos instruções de recuperação de senha para o seu email"
      >
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </p>
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Voltar para o login
          </Link>
        </div>
      </AuthCard>
    );
  }
  
  return (
    <AuthCard
      title="Recuperar senha"
      description="Enviaremos um link para redefinir sua senha"
      footer={
        <p className="text-center text-sm text-gray-600">
          Lembrou sua senha?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Voltar para o login
          </Link>
        </p>
      }
    >
      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="seu@email.com"
          />
        </div>
        
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          Enviar link de recuperação
        </Button>
      </form>
    </AuthCard>
  );
}