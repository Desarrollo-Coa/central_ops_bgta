'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'

export default function NovedadesAside() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  return (
    <aside className="w-64 bg-white shadow-md hidden md:block fixed h-screen overflow-y-auto border-r">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Menú</h3>
        <nav className="space-y-2">
          <div>
            <Button
              variant="ghost"
              className="w-full justify-between text-gray-600 hover:text-gray-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              Novedades
              {isMenuOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {isMenuOpen && (
              <div className="pl-4 space-y-2 mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-gray-900"
                  onClick={() => router.push('/novedades/registrar')}
                >
                  Registrar Novedad
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-gray-900"
                  onClick={() => router.push('/novedades/historial')}
                >
                  Historial de Novedades
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-gray-900"
                  onClick={() => router.push('/novedades/envios')}
                >
                  Historial de Envíos
                </Button>
              </div>
            )}
          </div>

          <div>
            <Button
              variant="ghost"
              className="w-full justify-between text-gray-600 hover:text-gray-900"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuraciones
              </div>
              {isConfigOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {isConfigOpen && (
              <div className="pl-4 space-y-2 mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-gray-900"
                  onClick={() => router.push('/novedades/configuracion/tipos-reporte')}
                >
                  Tipos de Reporte
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-gray-900"
                  onClick={() => router.push('/novedades/configuracion/tipos-evento')}
                >
                  Tipos de Evento
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  )
} 