import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

export function getTokenFromRequest(request: NextRequest) {
  // Primero buscar en el header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remover 'Bearer '
    console.log('🍪 getTokenFromRequest - Token encontrado en header:', !!token);
    if (token) {
      console.log('🍪 Token (primeros 20 chars):', token.substring(0, 20) + '...');
    }
    return token;
  }
  
  // Si no está en el header, buscar en las cookies
  const token = request.cookies.get('token')?.value;
  
  console.log('🍪 getTokenFromRequest - Token encontrado en cookies:', !!token);
  
  // Usar solo el token principal
  const finalToken = token;
  
  if (finalToken) {
    console.log('🍪 Token (primeros 20 chars):', finalToken.substring(0, 20) + '...');
  }
  
  return finalToken;
}

export function getVigilanteTokenFromRequest(request: NextRequest) {
  // Buscar en el header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('🍪 getVigilanteTokenFromRequest - Token encontrado en header:', !!token);
    return token;
  }
  
  // Buscar en las cookies de vigilante
  const vigilanteTokenCookie = request.cookies.get('vigilante_token')?.value;
  
  console.log('🍪 getVigilanteTokenFromRequest - Vigilante token encontrado en cookies:', !!vigilanteTokenCookie);
  
  if (vigilanteTokenCookie) {
    try {
      const sessionData = JSON.parse(vigilanteTokenCookie);
      const token = sessionData.token;
      console.log('🍪 Vigilante Token (primeros 20 chars):', token.substring(0, 20) + '...');
      return token;
    } catch (error) {
      console.error('Error parsing vigilante token cookie:', error);
      return null;
    }
  }
  
  return null;
}

export async function verifyToken(token: string) {
  console.log('🔐 verifyToken - Iniciando verificación');
  console.log('🔐 SECRET_KEY configurada:', !!SECRET_KEY);
  
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(SECRET_KEY)
    );
    console.log('✅ verifyToken - Token válido, payload:', {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      exp: payload.exp
    });
    return payload;
  } catch (error) {
    console.error('❌ verifyToken - Error verificando token:', error);
    return null;
  }
}

export async function createToken(payload: any) {
  console.log('🎫 createToken - Creando token para:', {
    id: payload.id,
    email: payload.email,
    role: payload.role
  });
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(new TextEncoder().encode(SECRET_KEY));
  
  console.log('✅ createToken - Token creado exitosamente');
  return token;
}

export function setTokenCookie(response: NextResponse, token: string) {
  console.log('🍪 setTokenCookie - Configurando cookie de token');
  
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60 // 8 horas en segundos
  });
  
  console.log('✅ setTokenCookie - Cookie configurada correctamente');
  return response;
} 