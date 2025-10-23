import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Novedad {
  id_novedad: number
  consecutivo: string
  fecha_novedad: string
  hora_novedad: string
  fecha_registro: string
  descripcion: string
  gestion: string | null
  unidad_negocio: string
  tipo_novedad: string
  nivel_criticidad: string
  puesto: string
  operador_registro: string
  imagenes: string[]
}

interface ModalDetallesNovedadProps {
  novedad: Novedad
  onClose: () => void
}

export default function ModalDetallesNovedad({
  novedad,
  onClose,
}: ModalDetallesNovedadProps) {
  const formatDate = (dateString: string | null | undefined, formatString: string = "dd/MM/yyyy") => {
    if (!dateString) return 'N/A'
    try {
      let date: Date
      
      // Si la fecha incluye 'T', es una fecha ISO
      if (dateString.includes('T')) {
        date = new Date(dateString)
      } else {
        // Si es una fecha YYYY-MM-DD
        const [year, month, day] = dateString.split('-').map(Number)
        date = new Date(Date.UTC(year, month - 1, day))
      }

      // Ajustar la fecha a la zona horaria local
      const offset = date.getTimezoneOffset()
      date = new Date(date.getTime() + (offset * 60 * 1000))

      return format(date, formatString, { locale: es })
    } catch (error) {
      console.error('Error al formatear fecha:', dateString, error)
      return 'N/A'
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de la Novedad</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Consecutivo</Label>
                <div className="p-2 bg-gray-50 rounded-md">{novedad.consecutivo}</div>
              </div>

              <div>
                <Label>Fecha</Label>
                <div className="p-2 bg-gray-50 rounded-md">
                  {formatDate(novedad.fecha_novedad)}
                </div>
              </div>

              <div>
                <Label>Hora</Label>
                <div className="p-2 bg-gray-50 rounded-md">{novedad.hora_novedad}</div>
              </div>

              <div>
                <Label>Unidad de Negocio</Label>
                <div className="p-2 bg-gray-50 rounded-md">{novedad.unidad_negocio}</div>
              </div>

              <div>
                <Label>Puesto</Label>
                <div className="p-2 bg-gray-50 rounded-md">{novedad.puesto}</div>
              </div>

              <div>
                <Label>Tipo de Novedad</Label>
                <div className="p-2 bg-gray-50 rounded-md">{novedad.tipo_novedad}</div>
              </div>

              <div>
                <Label>Nivel de Criticidad</Label>
                <div className="p-2 bg-gray-50 rounded-md">{novedad.nivel_criticidad}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Descripción</Label>
                <Textarea 
                  value={novedad.descripcion} 
                  disabled 
                  className="min-h-[200px] bg-gray-50" 
                />
              </div>

              <div>
                <Label>Gestión Realizada</Label>
                <Textarea 
                  value={novedad.gestion || 'Sin gestión'} 
                  disabled 
                  className="min-h-[200px] bg-gray-50" 
                />
              </div>

              {novedad.imagenes && novedad.imagenes.length > 0 && (
                <div>
                  <Label>Imágenes Adjuntas</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {novedad.imagenes.map((imagen, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imagen}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                          <a
                            href={imagen}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white opacity-0 group-hover:opacity-100"
                          >
                            Ver imagen
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 