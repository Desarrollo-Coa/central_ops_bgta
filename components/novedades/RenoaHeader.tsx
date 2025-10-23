import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

interface RenoaHeaderProps {
  title: string;
  subtitle: string;
  showMobileNav?: boolean;
}

export default function RenoaHeader({ title, subtitle, showMobileNav = true }: RenoaHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-[#212529] shadow-lg sticky top-0 z-10 border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y Títulos */}
          <div className="flex items-center gap-4 transition-transform hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md">
              <span className="text-2xl font-bold text-[#004e89]">R</span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{title}</h1>
              <h2 className="text-lg text-white italic">{subtitle}</h2>
            </div>
          </div>

          {/* Navegación Móvil */}
          {showMobileNav && (
            <nav className="flex gap-4 md:hidden">
              <Button 
                variant="outline" 
                onClick={() => router.push('/novedades/historial')}
                className="whitespace-nowrap border-[#ffb4a2] text-[#ffb4a2] font-semibold rounded-full px-6 py-2 hover:bg-[#ffb4a2] hover:text-white transition-all duration-300"
              >
                Historial
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/novedades/envios')}
                className="whitespace-nowrap border-[#ffb4a2] text-[#ffb4a2] font-semibold rounded-full px-6 py-2 hover:bg-[#ffb4a2] hover:text-white transition-all duration-300"
              >
                Envíos
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/novedades')}
                className="whitespace-nowrap border-gray-700 text-gray-700 font-semibold rounded-full px-6 py-2 hover:bg-gray-700 hover:text-white transition-all duration-300"
              >
                Volver
              </Button>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
} 