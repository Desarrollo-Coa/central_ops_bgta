'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MainSidebar from '@/components/main-sidebar';
import { ModuleCards } from '@/components/settings-cards';
import { ClipboardList, BarChart2 } from 'lucide-react';
import Skeleton from '../../../components/ui/skeleton';


export default function CumplidoNegocio() {
  const params = useParams();
  const nombreNegocioParam = params?.nombre_negocio;
  const [negocio, setNegocio] = useState<{ id_negocio: number; nombre_negocio: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNegocio = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/negocios');
        if (!res.ok) throw new Error('No se pudieron obtener los negocios');
        const data = await res.json();
        // Buscar por nombre (case-insensitive, sin espacios extra)
        const nombreParam = decodeURIComponent(Array.isArray(nombreNegocioParam) ? nombreNegocioParam[0] : nombreNegocioParam || '').replace(/_/g, ' ').trim().toLowerCase();
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
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="border rounded-lg bg-white min-h-[140px] flex flex-col justify-between p-4">
                    <div className="flex flex-row items-center gap-4 pb-2 pt-4 flex-1">
                      <div className="flex items-center justify-center rounded-full h-10 w-10 bg-gray-100">
                        <Skeleton className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-red-600 font-semibold">{error}</div>
            ) : negocio ? (
              <>
                <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">{negocio.nombre_negocio}</h1>
                <ModuleCards modules={[
                  {
                    title: 'Reporte comunicación',
                    description: 'Ver y gestionar el reporte de comunicación de este negocio.',
                    icon: ClipboardList,
                    href: `/comunicacion/${encodeURIComponent(negocio.nombre_negocio.replace(/ /g, '_'))}/reporte`,
                  },
                  {
                    title: 'Consolidado',
                    description: 'Ver el consolidado de reportes de comunicación.',
                    icon: BarChart2,
                    href: `/comunicacion/${encodeURIComponent(negocio.nombre_negocio.replace(/ /g, '_'))}/consolidado`,
                  },
                ]} />
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
} 