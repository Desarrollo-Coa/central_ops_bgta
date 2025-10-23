'use client'

import { useState } from 'react'
import AsignarDestinatarios from '@/components/novedades/AsignarDestinatarios'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, BarChart2, ArrowLeft, Menu, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

export default function DestinatariosPage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Registrar Novedad",
      onClick: () => {
        router.push('/novedades/registrar')
        setIsOpen(false)
      }
    },
    {
      icon: <BarChart2 className="h-4 w-4" />,
      label: "Estadísticas",
      onClick: () => {
        router.push('/novedades/estadisticas')
        setIsOpen(false)
      }
    },
    {
      icon: <ArrowLeft className="h-4 w-4" />,
      label: "Volver",
      onClick: () => {
        router.push('/novedades')
        setIsOpen(false)
      }
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-4">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="sm:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[250px] sm:w-[300px] p-0">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 p-4 border-b">
                      <img 
                        src="/img/modulos/novedades/LOGO-RENOA.jpeg" 
                        alt="Logo RENOA" 
                        className="h-8 w-auto rounded-lg"
                      />
                      <div>
                        <SheetTitle className="text-lg font-bold text-gray-900">RENOA</SheetTitle>
                        <p className="text-xs text-gray-500">Menú de Navegación</p>
                      </div>
                    </div>
                    <nav className="flex-1 p-4">
                      <ul className="space-y-2">
                        {menuItems.map((item, index) => (
                          <li key={index}>
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-2 text-gray-600 hover:text-gray-900"
                              onClick={item.onClick}
                            >
                              {item.icon}
                              <span>{item.label}</span>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              <img 
                src="/img/modulos/novedades/LOGO-RENOA.jpeg" 
                alt="Logo RENOA" 
                className="h-8 sm:h-12 w-auto rounded-lg shadow-sm"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">RENOA</h1>
                <p className="text-xs sm:text-sm text-gray-500">Gestión de Destinatarios</p>
              </div>
            </div>
            <nav className="hidden sm:flex items-center gap-3">
              {menuItems.map((item, index) => (
                <Button 
                  key={index}
                  variant="ghost" 
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  onClick={item.onClick}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <AsignarDestinatarios />
        </div>
      </main>
    </div>
  )
} 