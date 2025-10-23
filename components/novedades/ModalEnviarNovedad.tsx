'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input' 
import { toast } from 'sonner'
import { Send, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface Destinatario {
  email: string
  nombre: string
  asignado: boolean
  existe: boolean
}

interface ModalEnviarNovedadProps {
  novedad: {
    id_novedad: number
    consecutivo: number
    fecha_hora_novedad: string
    nombre_estado: string
    nombre_tipo_reporte: string
    nombre_tipo_evento: string
    nombre_tipo_negocio: string 
    nombre_puesto: string
    nombre_departamento: string
    nombre_municipio: string
    nombre_zona: string
    gestion: string
    descripcion: string
    imagenes: string
    evento_critico: boolean
  }
  onClose: () => void
  onSuccess: () => void
}

export default function ModalEnviarNovedad({ novedad, onClose, onSuccess }: ModalEnviarNovedadProps) {
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([])
  const [loading, setLoading] = useState(false)
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [sugerencias, setSugerencias] = useState<Destinatario[]>([])

  const router = useRouter()
  const [destinatariosExistentes, setDestinatariosExistentes] = useState<Set<string>>(new Set())

  useEffect(() => {
    cargarDestinatariosAsignados()
  }, [])

  const cargarDestinatariosAsignados = async () => {
    try {
      const response = await fetch(`/api/novedades/destinatarios-asignados/${novedad.id_novedad}`)
      if (!response.ok) throw new Error('Error al cargar destinatarios')
      
      const data = await response.json()
      const destinatariosFormateados = data.map((d: any) => ({
        email: d.email,
        nombre: d.nombre,
        asignado: true,
        existe: true
      }))

      setDestinatarios(destinatariosFormateados)
      setDestinatariosExistentes(new Set(destinatariosFormateados.map((d: any) => d.email)))
    } catch (error) {
      console.error('Error:', error)
      toast.error('No se pudieron cargar los destinatarios asignados')
    }
  }

  const buscarSugerencias = async (email: string) => {
    if (!email) {
      setSugerencias([])
      return
    }

    try {
      const response = await fetch(`/api/novedades/destinatarios/buscar?email=${email}`)
      if (!response.ok) throw new Error('Error al buscar sugerencias')
      
      const data = await response.json()
      setSugerencias(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al buscar sugerencias')
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setNuevoEmail(email)
    buscarSugerencias(email)
  }

  const agregarDestinatario = async (email: string, nombre: string) => {
    // Verificar si el destinatario existe en la base de datos
    try {
      const response = await fetch(`/api/novedades/destinatarios/verificar?email=${email}`)
      const data = await response.json()
      
      setDestinatarios([...destinatarios, { 
        email, 
        nombre, 
        asignado: false,
        existe: data.existe 
      }])
      setNuevoEmail('')
      setSugerencias([])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al verificar el destinatario')
    }
  }

  const quitarDestinatario = (email: string) => {
    setDestinatarios(destinatarios.filter(d => d.email !== email))
  }

  const handleEnviar = async () => {
    if (destinatarios.length === 0) {
      toast.error('Debe seleccionar al menos un destinatario')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/novedades/enviar/${novedad.id_novedad}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinatarios: destinatarios.map(d => ({
            email: d.email,
            nombre: d.nombre
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Error al enviar la novedad')
      }

      toast.success('Novedad enviada correctamente')

      onSuccess()
      onClose()
      
      setTimeout(() => {
        router.push('/novedades/envios')
      }, 1500)
    } catch (error) {
      console.error('Error:', error)
      toast.error('No se pudo enviar la novedad')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return format(date, 'dd/MM/yyyy', { locale: es })
    } catch (error) {
      console.error('Error al formatear fecha:', dateString, error)
      return 'N/A'
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Enviar Novedad</DialogTitle>
        {/* Header visual */}
        <div className="flex items-center gap-4 border-b px-8 pt-8 pb-4 bg-blue-50 rounded-t-2xl relative">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Enviar Novedad</h2>
            <div className="text-sm text-gray-500">
              {novedad.nombre_tipo_negocio && novedad.nombre_puesto ? `${novedad.nombre_tipo_negocio} - ${novedad.nombre_puesto}` : ''}
            </div>
          </div> 
        </div>
        <div className="space-y-8 px-8 py-6">
          {/* Badges y fecha */}
          <div className="flex flex-wrap gap-4 mb-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
              {novedad.nombre_tipo_reporte}
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
              {novedad.nombre_tipo_evento}
            </span>
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
              {novedad.nombre_tipo_negocio}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${novedad.evento_critico ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Evento Crítico: {novedad.evento_critico ? 'Sí' : 'No'}</span>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              {formatDate(novedad.fecha_hora_novedad)}
            </span>
          </div>

          {/* Detalles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Consecutivo</div>
                <div className="p-2 bg-gray-50 rounded-md break-words font-medium">{novedad.consecutivo}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Puesto</div>
                <div className="p-2 bg-gray-50 rounded-md break-words font-medium">{novedad.nombre_puesto}</div>
              </div>
              {novedad.nombre_departamento && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Departamento</div>
                  <div className="p-2 bg-gray-50 rounded-md break-words font-medium">{novedad.nombre_departamento}</div>
                </div>
              )}
              {novedad.nombre_municipio && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Municipio</div>
                  <div className="p-2 bg-gray-50 rounded-md break-words font-medium">{novedad.nombre_municipio}</div>
                </div>
              )}
              {novedad.nombre_zona && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Zona</div>
                  <div className="p-2 bg-gray-50 rounded-md break-words font-medium">{novedad.nombre_zona}</div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Descripción</div>
                <div className="p-3 bg-gray-50 rounded-md min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words">
                  {novedad.descripcion}
                </div>
              </div>
              {novedad.gestion && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Gestión Realizada</div>
                  <div className="p-3 bg-gray-50 rounded-md min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap break-words">
                    {novedad.gestion}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Imágenes */}
          {novedad.imagenes && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Imágenes Adjuntas</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {novedad.imagenes.split(',').map((url, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img
                      src={url}
                      alt={`Imagen ${index + 1} de la novedad`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center rounded-lg">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        Ver imagen
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Destinatarios */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Destinatarios</h3>
              <span className="text-xs text-gray-500">{destinatarios.length} seleccionado(s)</span>
            </div>
            <div className="space-y-2 mb-4">
              {destinatarios.map((destinatario, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <div className={`flex items-center space-x-2 ${destinatario.existe ? 'text-green-700' : 'text-red-700'}`}> 
                    <span className="font-medium">{destinatario.nombre || destinatario.email}</span>
                    <span className="text-xs text-gray-500">({destinatario.email})</span>
                    {!destinatario.existe && <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">Nuevo</span>}
                  </div>
                  <button
                    onClick={() => quitarDestinatario(destinatario.email)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mb-2">
              <div className="font-semibold mb-1">Agregar Destinatario</div>
              <div className="flex gap-2 items-center">
                <Input
                  type="email"
                  placeholder="Ingrese el correo electrónico"
                  value={nuevoEmail}
                  onChange={handleEmailChange}
                  className="flex-1"
                />
                <Button
                  onClick={() => agregarDestinatario(nuevoEmail, '')}
                  disabled={!nuevoEmail}
                  variant="secondary"
                >
                  Agregar
                </Button>
              </div>
              {sugerencias.length > 0 && (
                <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto mt-2 bg-white shadow">
                  {sugerencias.map((sugerencia) => (
                    <div
                      key={sugerencia.email}
                      className="p-2 hover:bg-gray-100 cursor-pointer rounded-md"
                      onClick={() => agregarDestinatario(sugerencia.email, sugerencia.nombre)}
                    >
                      <div className="font-medium">{sugerencia.nombre}</div>
                      <div className="text-sm text-gray-500">{sugerencia.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={loading} className="font-bold px-8 py-2 text-base">
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 