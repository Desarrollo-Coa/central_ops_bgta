'use client'

import NovedadesAside  from '@/components/novedades/NovedadesAside'

export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh]">
      <div className="w-72 flex-shrink-0">
        <NovedadesAside />
      </div>
      <main className="flex-1 overflow-y-auto p-8 bg-white">
        {children}
      </main>
    </div>
  )
} 