'use client';
export const dynamic = "force-dynamic";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CumplidoNegocioTable } from '@/components/cumplido';
import MainSidebar from '@/components/main-sidebar';
import SelectorNegocioGenerales, { Negocio } from '@/components/negocios/SelectorNegocioGenerales';
import { useRouter } from 'next/navigation';

export default function CumplidoNegocio() {
  const params = useParams();
  const nombreNegocioParam = params?.nombre_negocio;
  const [negocio, setNegocio] = useState<{ id_negocio: number; nombre_negocio: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchNegocios = async () => {
      try {
        const res = await fetch('/api/negocios')
        const data = await res.json()
        setNegocios(data)
      } catch (error) {
        console.error('Error al cargar negocios:', error)
      }
    }
    fetchNegocios()
  }, []);

  useEffect(() => {
    const fetchNegocio = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/negocios');
        if (!res.ok) throw new Error('No se pudieron obtener los negocios');
        const data = await res.json();
        // Buscar por nombre (case-insensitive, sin espacios extra)
        const nombreParam = decodeURIComponent(
          Array.isArray(nombreNegocioParam) ? nombreNegocioParam[0] || '' : nombreNegocioParam || ''
        )
          .replace(/_/g, ' ')
          .trim()
          .toLowerCase();
        const encontrado = data.find((n: any) => n.nombre_negocio.trim().toLowerCase() === nombreParam);
        if (!encontrado) {
          setError('Negocio no encontrado');
          setNegocio(null);
        } else {
          setNegocio({ id_negocio: encontrado.id_negocio, nombre_negocio: encontrado.nombre_negocio });
        }
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
        setNegocio(null);
      } finally {
        setLoading(false);
      }
    };
    if (nombreNegocioParam) fetchNegocio();
  }, [nombreNegocioParam]);

  return (
    <div className="flex h-screen bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            {negocios.length > 0 && negocio && (
              <div className="mb-6">
                <SelectorNegocioGenerales
                  negocios={negocios}
                  negocioSeleccionado={{
                    id: negocio.id_negocio,
                    nombre: negocio.nombre_negocio
                  }}
                  onSeleccionar={(nuevoNegocio) => {
                    if (nuevoNegocio) {
                      router.replace(`/programacion/cumplido/${encodeURIComponent(nuevoNegocio.nombre.replace(/ /g, '_'))}`);
                    }
                  }}
                  opcionGenerales={false}
                  setOpcionGenerales={() => {}}
                />
              </div>
            )}
            {loading ? (
              <div className="text-center text-gray-500">Cargando negocio...</div>
            ) : error ? (
              <div className="text-center text-red-600 font-semibold">{error}</div>
            ) : negocio ? (
              <CumplidoNegocioTable negocioId={negocio.id_negocio} negocioNombre={negocio.nombre_negocio} />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
} 