// Configuración centralizada de rutas y permisos

export interface RouteConfig {
  path: string;
  requiresAuth: boolean;
  requiresAdmin: boolean;
  allowedRoles: string[];
  acceptsSubroutes?: boolean;
}

// Rutas públicas que no requieren autenticación
export const publicRoutes = [
  '/login',
  '/accesos/login',
  '/accesos/login/[negocio]',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/verify-admin',
  '/api/middleware-routes',
  '/api/test-middleware',
  '/api/accesos/negocios/by-hash',
  '/api/accesos/auth/login',
  '/api/accesos/auth/me',
  '/api/accesos/auth/logout',
  '/api/accesos/stats',
  '/api/accesos/puestos',
  '/api/accesos/turnos',
  '/api/accesos/asignaciones',
  '/api/accesos/profile/photo',
  '/api/accesos/links',
  '/api/accesos/negocios',
  '/favicon.ico',
  '/_next',
  '/api/webhooks',
];

// Rutas que requieren autenticación pero son accesibles para todos los usuarios autenticados
export const authenticatedRoutes = [
  '/',
  '/novedades/estadisticas-generales',
  '/api/users/password',
  '/api/logout',
  '/api/stats/active-users',
  '/api/stats/users',
];

// Configuración de módulos principales
export const moduleRoutes: RouteConfig[] = [
  // Módulo de Accesos (requiere autenticación)
  {
    path: '/accesos',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // Módulo de Ausencias
  {
    path: '/ausencias',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // Módulo de Novedades
  {
    path: '/novedades',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // Módulo de Programación
  {
    path: '/programacion',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // Módulo de Comunicación
  {
    path: '/comunicacion',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // Módulo de Settings (Configuración)
  {
    path: '/settings',
    requiresAuth: true,
    requiresAdmin: true,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // Módulo de Usuarios
  {
    path: '/users',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // Módulo de Marcaciones
  {
    path: '/marcaciones-mitra',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: false,
  },
];

// Configuración de rutas de API
export const apiRoutes: RouteConfig[] = [
  // API de Accesos
  {
    path: '/api/accesos',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // API de Ausencias
  {
    path: '/api/ausencias',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // API de Novedades
  {
    path: '/api/novedades',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // API de Programación
  {
    path: '/api/programacion',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // API de Comunicación
  {
    path: '/api/comunicacion',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // API de Settings
  {
    path: '/api/settings',
    requiresAuth: true,
    requiresAdmin: true,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // API de Marcaciones
  {
    path: '/api/marcaciones',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // API de Cumplidos
  {
    path: '/api/cumplidos',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
  
  // API de Módulos de Usuario
  {
    path: '/api/modules/user',
    requiresAuth: true,
    requiresAdmin: false,
    allowedRoles: ['administrador'],
    acceptsSubroutes: true,
  },
];

// Función para normalizar rutas
export function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/').replace(/\/$/, '');
}

// Función para verificar si una ruta es pública
export function isPublicRoute(path: string): boolean {
  const normalizedPath = normalizePath(path);
  
  // Remover parámetros de consulta para la comparación
  const pathWithoutQuery = normalizedPath.split('?')[0];
  
  return publicRoutes.some(route => {
    // Comparar rutas exactas
    if (pathWithoutQuery === route) return true;
    
    // Comparar rutas que empiezan con el patrón
    if (pathWithoutQuery.startsWith(route + '/')) return true;
    
    // Rutas especiales
    if (pathWithoutQuery.startsWith('/_next/')) return true;
    if (pathWithoutQuery.startsWith('/api/webhooks/')) return true;
    
    return false;
  });
}

// Función para verificar si una ruta requiere solo autenticación
export function isAuthenticatedRoute(path: string): boolean {
  const normalizedPath = normalizePath(path);
  return authenticatedRoutes.some(route => 
    normalizedPath === route || 
    normalizedPath.startsWith(route + '/')
  );
}

// Función para obtener la configuración de una ruta
export function getRouteConfig(path: string): RouteConfig | null {
  const normalizedPath = normalizePath(path);
  
  // Buscar en rutas de módulos
  const moduleConfig = moduleRoutes.find(config => {
    if (config.acceptsSubroutes) {
      return normalizedPath === config.path || normalizedPath.startsWith(config.path + '/');
    }
    return normalizedPath === config.path;
  });
  
  if (moduleConfig) return moduleConfig;
  
  // Buscar en rutas de API
  const apiConfig = apiRoutes.find(config => {
    if (config.acceptsSubroutes) {
      return normalizedPath === config.path || normalizedPath.startsWith(config.path + '/');
    }
    return normalizedPath === config.path;
  });
  
  return apiConfig || null;
}

// Función para verificar si un usuario tiene permisos para una ruta
export function hasRoutePermission(userRole: string, routeConfig: RouteConfig | null): boolean {
  if (!routeConfig) return false;
  
  // Si requiere admin, solo administrador puede acceder
  if (routeConfig.requiresAdmin && userRole !== 'administrador') {
    return false;
  }
  
  // Si es administrador, tiene acceso a todo
  if (userRole === 'administrador') {
    return true;
  }
  
  // Para otros roles, el acceso se verifica en la base de datos
  // Esta función solo verifica permisos basados en configuración
  // Los permisos de módulos se verifican en el middleware
  return false;
} 