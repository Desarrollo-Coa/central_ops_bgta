"use client";
export const dynamic = "force-dynamic";

import RegistrarNovedades from "@/components/novedades/RegistrarNovedades"
import NovedadesAside from "@/components/novedades/NovedadesAside"
import RenoaHeader from "@/components/novedades/RenoaHeader"

export default function Page() {
  return (
<div className="h-[100dvh] flex"> {/* Página */}
<NovedadesAside />
      <div className="flex-1 flex flex-col md:ml-64">
        <RenoaHeader 
          title="RENOA"
          subtitle="Registrar Novedad"
        />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <RegistrarNovedades />
            </div>
          </div>
        </main>
          </div>
    </div>
  )
}
