'use client';
import { useState, useEffect } from "react"; 
import  MainSidebar  from "../../../components/main-sidebar"; 
import { useAuth } from "@/hooks/useAuth";
import Skeleton from "@/components/ui/skeleton";
import { BusinessList } from "@/components/business-list";

export default function CumplidoPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNegocios();
    }
    // eslint-disable-next-line
  }, [isAuthenticated]);

  const fetchNegocios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/negocios");
      if (!res.ok) throw new Error("No se pudieron obtener los negocios");
      const data = await res.json();
      // Adaptar los datos para BusinessList
      const negociosAdaptados = data.map((n: any) => ({
        title: n.nombre_negocio,
        description: n.activo ? "Negocio activo" : "Negocio inactivo",
        link: `/programacion/cumplido/${encodeURIComponent(n.nombre_negocio.replace(/ /g, '_'))}`,
      }));
      setNegocios(negociosAdaptados);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <MainSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="w-full bg-[#000e3a] py-6 text-center sticky top-0 z-10">
            <h1 className="text-3xl font-semibold text-white">CUMPLIDOS POR NEGOCIO</h1>

            </div>
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-lg shadow">
                    <div className="divide-y">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Skeleton className="h-6 w-6" />
                              <div>
                                <Skeleton className="h-6 w-32 mb-2" />
                                <Skeleton className="h-4 w-48" />
                              </div>
                            </div>
                            <Skeleton className="h-5 w-5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="w-full bg-[#000e3a] py-6 text-center sticky top-0 z-10">
            <h1 className="text-3xl font-semibold text-white">CUMPLIDOS POR NEGOCIO</h1>
          </div>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                {error ? (
                  <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-center">{error}</div>
                ) : (
                  <BusinessList negocios={negocios} />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}