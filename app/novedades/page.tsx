'use client'
 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FileText, BarChart2, Users } from 'lucide-react'

export default function Novedades() {
  const router = useRouter()

  const menuItems = [
    {
      title: "Registrar Novedades",
      description: "Registra y gestiona nuevas novedades.",
      content: "Ingresa y registra nuevas novedades en el sistema",
      icon: <FileText className="h-6 w-6 text-blue-600" />,
      path: '/novedades/registrar'
    },
    {
      title: "Estadísticas",
      description: "Visualiza estadísticas de novedades",
      content: "Consulta reportes y análisis de novedades",
      icon: <BarChart2 className="h-6 w-6 text-green-600" />,
      path: '/novedades/estadisticas'
    },
    {
      title: "Asignar Destinatarios",
      description: "Gestiona destinatarios de novedades",
      content: "Configura y asigna destinatarios para las novedades",
      icon: <Users className="h-6 w-6 text-purple-600" />,
      path: '/novedades/destinatarios'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-4">
              <Image 
                src="/img/modulos/novedades/LOGO-RENOA.jpeg" 
                alt="Logo RENOA" 
                width={48}
                height={48}
                className="h-10 sm:h-12 w-auto rounded-lg shadow-sm"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">RENOA</h1>
                <p className="text-xs sm:text-sm text-gray-500">Módulo de Novedades</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {menuItems.map((item, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-white"
              onClick={() => router.push(item.path)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <div>
                    <CardTitle className="text-base sm:text-lg">{item.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-gray-600">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}