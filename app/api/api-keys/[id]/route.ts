// app/api/api-keys/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ApiKeyService } from '@/app/lib/services/api-key-service';
import { z } from 'zod';

// Schema de validação para atualização de chaves API
const updateApiKeySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  exchange: z.string().optional(),
  apiKey: z.string().min(10, 'Chave API inválida').optional(),
  apiSecret: z.string().min(10, 'Chave secreta inválida').optional(),
  permissions: z.array(z.string()).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const apiKeyId = params.id;
    
    // Buscar a chave API específica
    const apiKey = await ApiKeyService.getApiKey(apiKeyId, userId);
    
    return NextResponse.json(apiKey);
  } catch (error) {
    console.error('Erro ao buscar chave API:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar chave API' },
      { status: 500 }
    );
  }
}

// Schema de validação para atualização apenas das permissões
const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const apiKeyId = params.id;
    const body = await req.json();
    
    // Validar os dados - aceitamos apenas permissões aqui
    const validatedData = updatePermissionsSchema.parse(body);
    
    // Verificar se há pelo menos uma permissão
    if (validatedData.permissions.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos uma permissão' },
        { status: 400 }
      );
    }
    
    // Atualizar apenas as permissões da chave API
    const apiKey = await ApiKeyService.updateApiKey(apiKeyId, {
      permissions: validatedData.permissions
    }, userId);
    
    return NextResponse.json(apiKey);
  } catch (error) {
    console.error('Erro ao atualizar permissões da chave API:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar permissões da chave API' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const apiKeyId = params.id;
    
    // Excluir a chave API
    await ApiKeyService.deleteApiKey(apiKeyId, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir chave API:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir chave API' },
      { status: 500 }
    );
  }
}

// Endpoint para validar a chave API
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extrair o id dos parâmetros de forma assíncrona
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    //const apiKeyId = params.id;
    
    // Validar a chave API
    const validationResult = await ApiKeyService.validateApiKey(apiKeyId, userId);
    
    if (!validationResult.valid) {
      return NextResponse.json({ 
        valid: false, 
        error: validationResult.errorMessage || 'Chave API inválida' 
      }, { status: 400 });
    }
    
    return NextResponse.json({
      valid: true,
      permissions: validationResult.permissions
    });
  } catch (error) {
    console.error('Erro ao validar chave API:', error);
    return NextResponse.json(
      { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Erro ao validar chave API' 
      },
      { status: 500 }
    );
  }
}