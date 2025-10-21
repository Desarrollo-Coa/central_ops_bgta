import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import {
  isPublicRoute, 
  isAuthenticatedRoute,  
  normalizePath 
} from '@/lib/route-config';

// Función para verificar permisos de módulos desde la base de datos
async function checkModulePermissions(userId: number, path: string, token: string): Promise<boolean> {
  try {
    // Para rutas de API, permitir acceso si el usuario está autenticado
    // La verificación específica se hará en cada endpoint
    if (path.startsWith('/api/')) {
      return true;
    }
    
    // Para rutas de páginas, verificar en la base de datos usando el endpoint middleware-routes
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/middleware-routes?path=${encodeURIComponent(path)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Error verificando permisos de módulos:', error);
    // En caso de error, permitir acceso para evitar bloqueos
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPath = normalizePath(pathname);

  console.log('=== [MIDDLEWARE] ===');
  console.log('Ruta solicitada:', normalizedPath);

  // Permitir archivos estáticos sin verificación
  if (
    normalizedPath.startsWith('/_next/') ||
    normalizedPath.startsWith('/public/') ||
    normalizedPath.startsWith('/img/') ||
    normalizedPath.startsWith('/api/webhooks/') ||

    normalizedPath === '/favicon.ico'
  ) {
    console.log('[MIDDLEWARE] Archivo estático, acceso permitido');
    return NextResponse.next();
  }

  // Permitir rutas públicas sin verificación
  if (isPublicRoute(normalizedPath)) {
    console.log('[MIDDLEWARE] Ruta pública, acceso permitido');
    console.log('[MIDDLEWARE] Ruta normalizada:', normalizedPath);
    return NextResponse.next();
  }

  // Verificar token de autenticación (principal o vigilante)
  let token = getTokenFromRequest(request);
  
  // Si no hay token principal, intentar con token de vigilante
  if (!token) {
    const vigilanteTokenCookie = request.cookies.get('vigilante_token')?.value;
    if (vigilanteTokenCookie) {
      try {
        const sessionData = JSON.parse(vigilanteTokenCookie);
        token = sessionData.token;
      } catch (error) {
        console.error('Error parsing vigilante token:', error);
      }
    }
  }
  
  if (!token) {
    console.log('[MIDDLEWARE] No hay token, redirigiendo a login');
    
    // Si es una ruta de accesos que requiere autenticación, redirigir al login específico
    if (normalizedPath.startsWith('/accesos/')) {
      // Extraer el hash del negocio de la URL si está presente
      const pathParts = normalizedPath.split('/');
      const negocioIndex = pathParts.findIndex(part => part === 'login');
      if (negocioIndex !== -1 && pathParts[negocioIndex + 1]) {
        const negocioHash = pathParts[negocioIndex + 1];
        const accesosLoginUrl = new URL(`/accesos/login/${negocioHash}`, request.url);
        return NextResponse.redirect(accesosLoginUrl);
      }
      
      // Si es otra ruta de accesos protegida, redirigir al login general
      const accesosLoginUrl = new URL('/accesos/login', request.url);
      return NextResponse.redirect(accesosLoginUrl);
    }
    
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar validez del token
  const payload = await verifyToken(token);
  if (!payload) {
    console.log('[MIDDLEWARE] Token inválido, redirigiendo a login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = (payload.role as string | undefined)?.toLowerCase() || '';
  const userId = payload.id as number;

  console.log('[MIDDLEWARE] Usuario autenticado:', { userId, role });

  // Si es administrador, permitir acceso a todas las rutas sin verificar permisos
  if (role === 'administrador') {
    console.log('[MIDDLEWARE] Es administrador, acceso permitido a todas las rutas');
    return NextResponse.next();
  }

    // Verificar rutas que solo requieren autenticación
  if (isAuthenticatedRoute(normalizedPath)) {
    console.log('[MIDDLEWARE] Ruta de usuario autenticado, acceso permitido');
    return NextResponse.next();
  }

  // Para rutas que requieren token principal, verificar antes de ir a BD
  if (normalizedPath.startsWith('/users/') || normalizedPath.startsWith('/api/users/') || normalizedPath.startsWith('/api/modules/user/')) {
    const tokenFromCookies = request.cookies.get('token')?.value;
    if (!tokenFromCookies) {
      console.log('[MIDDLEWARE] Ruta requiere token principal, redirigiendo a login');
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Verificar que el token principal sea válido
    const principalPayload = await verifyToken(tokenFromCookies);
    if (!principalPayload) {
      console.log('[MIDDLEWARE] Token principal inválido, redirigiendo a login');
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    console.log('[MIDDLEWARE] Token principal válido, continuando con verificación de módulos');
  }
  
  // Para usuarios no administradores, verificar permisos de módulos desde la base de datos
  console.log('[MIDDLEWARE] Verificando permisos de módulos desde BD para:', normalizedPath);
  const hasPermission = await checkModulePermissions(userId, normalizedPath, token);
  
  if (!hasPermission) {
    console.log('[MIDDLEWARE] Acceso denegado a:', normalizedPath);
    
    if (normalizedPath.startsWith('/api/')) {
      return new NextResponse(null, { status: 403 });
    } else {
      // Redirigir a dashboard o página de acceso denegado
      const dashboardUrl = new URL('/users/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  console.log('[MIDDLEWARE] Acceso permitido a:', normalizedPath);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder and its contents
     * - img folder and its contents
     * - api/webhooks (webhook endpoints)

     */
    '/((?!_next/static|_next/image|favicon.ico|public/|img/|api/webhooks/).*)',
  ],
}; 
