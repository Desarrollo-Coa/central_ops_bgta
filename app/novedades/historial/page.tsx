"use client";
export const dynamic = "force-dynamic";
import HistorialNovedades from '@/components/novedades/HistorialNovedades'
import NovedadesAside from '@/components/novedades/NovedadesAside'
import RenoaHeader from '@/components/novedades/RenoaHeader'

export default function HistorialNovedadesPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 h-full bg-white border-r flex-shrink-0">
        <NovedadesAside />
      </aside>
      {/* Área principal */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="w-full">
          <RenoaHeader 
            title="RENOA"
            subtitle="Historial de Novedades"
          />
        </header>
        {/* Contenido ocupa todo el espacio disponible */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow p-6 m-2">
              <HistorialNovedades />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 