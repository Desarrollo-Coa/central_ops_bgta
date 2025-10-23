import { useState, useEffect } from 'react';
import { Negocio } from '@/types/cumplido';

interface UseNegociosReturn {
  negocios: Negocio[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNegocios(): UseNegociosReturn {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNegocios = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/negocios');
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setNegocios(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar negocios';
      setError(errorMessage);
      console.error('Error al cargar negocios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegocios();
  }, []);

  return {
    negocios,
    loading,
    error,
    refetch: fetchNegocios,
  };
}

// Hook para buscar un negocio específico por nombre
export function useNegocioPorNombre(nombreParam: string | string[] | undefined) {
  const { negocios, loading: negociosLoading, error: negociosError } = useNegocios();
  const [negocio, setNegocio] = useState<{ id_negocio: number; nombre_negocio: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!negociosLoading && nombreParam) {
      setLoading(true);
      setError(null);
      
      try {
        const nombreParamDecoded = decodeURIComponent(
          Array.isArray(nombreParam) ? nombreParam[0] || '' : nombreParam || ''
        )
          .replace(/_/g, ' ')
          .trim()
          .toLowerCase();
        
        const encontrado = negocios.find((n) => 
          n.nombre_negocio.trim().toLowerCase() === nombreParamDecoded
        );
        
        if (!encontrado) {
          setError('Negocio no encontrado');
          setNegocio(null);
        } else {
          setNegocio({ 
            id_negocio: encontrado.id_negocio, 
            nombre_negocio: encontrado.nombre_negocio 
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al procesar el nombre del negocio';
        setError(errorMessage);
        setNegocio(null);
      } finally {
        setLoading(false);
      }
    } else if (negociosError) {
      setError(negociosError);
      setLoading(false);
    }
  }, [negocios, negociosLoading, negociosError, nombreParam]);

  return {
    negocio,
    loading: loading || negociosLoading,
    error: error || negociosError,
  };
}
