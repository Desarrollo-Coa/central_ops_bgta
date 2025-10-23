'use client';
export const dynamic = "force-dynamic";
import { useParams } from 'next/navigation';
import { CumplidoNegocioTable } from '@/components/reporte-diario';
import SelectorNegocioGenerales from '@/components/negocios/SelectorNegocioGenerales';
import { useRouter } from 'next/navigation';
import { useNegocios, useNegocioPorNombre } from '@/hooks/useNegocios';

export default function ReporteDiarioPage() {
  const params = useParams();
  const nombreNegocioParam = params?.nombre_negocio;
  const router = useRouter();
  
  const { negocios, loading: negociosLoading, error: negociosError } = useNegocios();
  const { negocio, loading: negocioLoading, error: negocioError } = useNegocioPorNombre(nombreNegocioParam);
  
  const loading = negociosLoading || negocioLoading;
  const error = negocioError || negociosError;

  return (
    <div className="flex h-screen bg-gray-100">
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
                      router.replace(`/comunicacion/${encodeURIComponent(nuevoNegocio.nombre.replace(/ /g, '_'))}/reporte`);
                    }
                  }}
                  opcionGenerales={false}
                  setOpcionGenerales={() => {}}
                />
              </div>
            )}
            {loading ? null : error ? (
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