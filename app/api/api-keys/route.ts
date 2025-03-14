// app/api/api-keys/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ApiKeyService } from '@/app/lib/services/api-key-service';
import { z } from 'zod';

// Schema de validação para criação de chaves API
const apiKeySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  exchange: z.string().default('binance'),
  apiKey: z.string().min(10, 'Chave API inválida'),
  apiSecret: z.string().min(10, 'Chave secreta inválida'),
  permissions: z.array(z.string()).default(['spot']),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Buscar todas as chaves API do usuário
    const apiKeys = await ApiKeyService.getApiKeys(userId);
    
    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Erro ao buscar chaves API:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar chaves API' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await req.json();
    
    // Validar os dados
    const validatedData = apiKeySchema.parse(body);
    
    // Criar a chave API
    const apiKey = await ApiKeyService.createApiKey(validatedData, userId);
    
    return NextResponse.json(apiKey, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar chave API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar chave API' },
      { status: 500 }
    );
  }
}