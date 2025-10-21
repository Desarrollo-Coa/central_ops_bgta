'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from './AccessDenied';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  path: string;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export default function ProtectedRoute({
  children,
  path,
  fallback,
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const { loading, hasPermission, error } = usePermissions(path);

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!hasPermission) {
    if (showAccessDenied) {
      return <AccessDenied />;
    }
    return null;
  }

  return <>{children}</>;
}

// Componente para proteger rutas basadas en roles
interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRole: string;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export function RoleProtectedRoute({
  children,
  requiredRole,
  fallback,
  showAccessDenied = true,
}: RoleProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <AccessDenied title="No autenticado" description="Debes iniciar sesión para acceder a esta página." />;
  }

  const userRole = user.role?.toLowerCase() || '';
  const requiredRoleLower = requiredRole.toLowerCase();
  
  // Administradores tienen acceso a todo
  if (userRole === 'administrador') {
    return <>{children}</>;
  }
  
  if (userRole !== requiredRoleLower) {
    if (showAccessDenied) {
      return <AccessDenied title="Acceso Denegado" description={`Necesitas el rol de ${requiredRole} para acceder a esta página.`} />;
    }
    return null;
  }

  return <>{children}</>;
} 