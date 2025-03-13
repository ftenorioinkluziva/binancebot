// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Definir quais caminhos são protegidos e públicos
  const isPublicPath = path === '/login' || path === '/register' || path === '/reset-password';
  const isApiAuthPath = path.startsWith('/api/auth');
  
  if (isPublicPath || isApiAuthPath) {
    return NextResponse.next();
  }
  
  const token = await getToken({ req });
  
  // Redirecionar para login se não estiver autenticado
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Proteger todas as rotas internas e API exceto auth
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};