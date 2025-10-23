"use client";
export const dynamic = "force-dynamic";

import NovedadesAside from '@/components/novedades/NovedadesAside'
import HistorialEnvios from '@/components/novedades/HistorialEnvios'
import RenoaHeader from '@/components/novedades/RenoaHeader'

export default function EnviosNovedadesPage() {
  return (
    <div className="min-h-screen bg-white flex">
      <NovedadesAside />
      <div className="flex-1 flex flex-col md:ml-64">
        <RenoaHeader 
          title="RENOA"
          subtitle="Historial de Envíos"
        />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-4">
            <HistorialEnvios />
          </div>
        </main>
      </div>
    </div>
  )
} 