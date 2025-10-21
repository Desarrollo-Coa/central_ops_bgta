'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

interface PermissionCheck {
  loading: boolean;
  hasPermission: boolean;
  error: string | null;
}

export function usePermissions(path: string): PermissionCheck {
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkPermission = async () => {
      if (authLoading) return;

      if (!user) {
        setError('Usuario no autenticado');
        setLoading(false);
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`/api/middleware-routes?path=${encodeURIComponent(path)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.status === 200) {
          setHasPermission(true);
          setError(null);
        } else if (response.status === 403) {
          setHasPermission(false);
          setError('Acceso denegado');
        } else {
          setHasPermission(false);
          setError('Error verificando permisos');
        }
      } catch (err) {
        setHasPermission(false);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [path, user, authLoading, router]);

  return { loading, hasPermission, error };
}

// Hook para verificar si el usuario tiene un rol específico
export function useRole(requiredRole: string): boolean {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const userRole = user.role?.toLowerCase() || '';
  const requiredRoleLower = requiredRole.toLowerCase();
  
  // Administradores tienen acceso a todo
  if (userRole === 'administrador') return true;
  
  return userRole === requiredRoleLower;
}

// Hook para verificar si el usuario tiene al menos uno de los roles requeridos
export function useAnyRole(requiredRoles: string[]): boolean {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const userRole = user.role?.toLowerCase() || '';
  
  // Administradores tienen acceso a todo
  if (userRole === 'administrador') return true;
  
  return requiredRoles.some(role => userRole === role.toLowerCase());
} 