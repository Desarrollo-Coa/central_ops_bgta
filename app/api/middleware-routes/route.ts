import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface Module extends RowDataPacket {
  ruta: string;
  acepta_subrutas: boolean;
}

// Función para normalizar rutas
function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/').replace(/\/$/, '');
}

async function getUserModules(userId: number): Promise<Module[]> {
  try {
    const [modules] = await pool.query<Module[]>(
      `SELECT m.ruta, m.acepta_subrutas
       FROM modulos m
       INNER JOIN usuarios_modulos um ON m.id = um.modulo_id
       WHERE um.user_id = ? AND um.permitido = TRUE AND m.activo = TRUE`,
      [userId]
    );
    
    return (modules as Module[]).map((module: Module) => ({
      ...module,
      ruta: normalizePath(module.ruta)
    }));
  } catch (error) {
    console.error('Error obteniendo módulos del usuario:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const requestedPath = request.nextUrl.searchParams.get('path');
  console.log('=== [middleware-routes] ===');
  console.log('Verificando acceso para ruta:', requestedPath);

  if (!requestedPath) {
    console.error('[middleware-routes] No se proporcionó una ruta en los parámetros');
    return new NextResponse(null, { status: 403 });
  }

  const url = normalizePath(requestedPath);
  console.log('[middleware-routes] Ruta normalizada:', url);

  const token = getTokenFromRequest(request);
  if (!token) {
    console.log('[middleware-routes] No token');
    return new NextResponse(null, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    console.log('[middleware-routes] Token inválido');
    return new NextResponse(null, { status: 401 });
  }

  const role = (payload.role as string | undefined)?.toLowerCase() || '';
  console.log('[middleware-routes] Rol:', role);

  // Si es administrador, permitir acceso a todas las rutas sin verificar permisos
  if (role === 'administrador') {
    console.log('[middleware-routes] Es administrador, acceso permitido a todas las rutas');
    return new NextResponse(null, { status: 200 });
  }

  // Permitir rutas públicas para usuarios autenticados
  const publicRoutes = [
    '/', 
    '/users/dashboard', 
    '/users/settings', 
    '/novedades/estadisticas-generales',
    '/api/users/password',
    '/api/logout',
    '/api/stats/active-users',
    '/api/stats/users'
  ];
  
  if (publicRoutes.includes(url)) {
    console.log('[middleware-routes] Ruta pública para autenticados:', url);
    return new NextResponse(null, { status: 200 });
  }

  // Para usuarios no administradores, verificar permisos de módulos
  const userId = payload.id as number;
  const modules = await getUserModules(userId);
  console.log('[middleware-routes] Módulos asignados:', modules);

  // Si no hay módulos asignados, denegar acceso
  if (!modules.length) {
    console.log('[middleware-routes] No hay módulos asignados para el usuario:', userId);
    return new NextResponse(null, { status: 403 });
  }

  // Verificar si la ruta actual está permitida
  const isAllowed = modules.some((module: Module) => {
    const modulePath = module.ruta;
    const acceptsSubroutes = module.acepta_subrutas;

    // Normalizar la ruta del módulo para comparación
    const normalizedModulePath = normalizePath(modulePath);

    // Coincidencia exacta
    if (url === normalizedModulePath) {
      console.log('[middleware-routes] Ruta coincide exactamente:', normalizedModulePath);
      return true;
    }

    // Verificar si la ruta es una subruta válida
    if (acceptsSubroutes && url.startsWith(normalizedModulePath + '/')) {
      console.log('[middleware-routes] Ruta es subruta permitida de:', normalizedModulePath);
      return true;
    }

    // Manejo de rutas dinámicas (ejemplo: /novedades/estadisticas/:id)
    const modulePathSegments = normalizedModulePath.split('/');
    const urlSegments = url.split('/');
    if (modulePathSegments.length === urlSegments.length) {
      const isDynamicMatch = modulePathSegments.every((segment, index) => {
        // Considerar parámetros dinámicos (como :id)
        if (segment.startsWith(':')) return true;
        return segment === urlSegments[index];
      });
      if (isDynamicMatch) {
        console.log('[middleware-routes] Ruta dinámica coincide:', normalizedModulePath);
        return true;
      }
    }

    return false;
  });

  if (!isAllowed) {
    console.log('[middleware-routes] Acceso denegado a:', url, 'para usuario:', userId);
    console.log('[middleware-routes] Rutas permitidas:', modules.map((m: Module) => m.ruta));
    return new NextResponse(null, { status: 403 });
  }

  console.log('[middleware-routes] Acceso permitido a:', url);
  return new NextResponse(null, { status: 200 });
}