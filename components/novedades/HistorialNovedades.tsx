'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, Send, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ModalEnviarNovedad from '@/components/novedades/ModalEnviarNovedad'
import ModalConfirmacion from '@/components/novedades/ModalConfirmacion'

interface Novedad {
  id_novedad: number
  consecutivo: number
  fecha_hora_novedad: string
  nombre_estado: string
  nombre_tipo_reporte: string
  nombre_tipo_evento: string
  nombre_tipo_negocio: string 
  nombre_departamento: string
  nombre_municipio: string
  nombre_zona: string
  gestion: string
  descripcion: string
  imagenes: string
  evento_critico: boolean
  ha_sido_enviada?: boolean
  nombre_negocio: string
  nombre_unidad_negocio: string
  nombre_puesto: string
}

export default function HistorialNovedades() {
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [novedadToDelete, setNovedadToDelete] = useState<Novedad | null>(null)
  const [filtros, setFiltros] = useState({
    tipoReporte: 'todos',
    tipoEvento: 'todos',
    fecha: '',
    consecutivo: '',
    limite: '100',
    negocio: 'todos'
  })
  const [filtrosDebounced, setFiltrosDebounced] = useState(filtros)
  const [tiposReporte, setTiposReporte] = useState<Array<{id_tipo_reporte: number, nombre_tipo_reporte: string}>>([])
  const [tiposEvento, setTiposEvento] = useState<Array<{id_tipo_evento: number, nombre_tipo_evento: string}>>([])
  const [negocios, setNegocios] = useState<Array<{id_negocio: number, nombre_negocio: string}>>([])
  const [todosNegocios, setTodosNegocios] = useState<Array<{id_negocio: number, nombre_negocio: string}>>([])

  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltrosDebounced(filtros)
    }, 1000)

    return () => clearTimeout(timer)
  }, [filtros])

  useEffect(() => {
    const fetchNegocios = async () => {
      try {
        const res = await fetch('/api/negocios')
        const data = await res.json()
        setNegocios(data)
        setTodosNegocios(data)
      } catch (error) {
        console.error('Error al cargar negocios:', error)
      }
    }
    fetchNegocios()
  }, [])

  // Corrijo el useEffect de tiposReporte para validar que la respuesta sea un array
  useEffect(() => {
    const fetchTiposReporte = async () => {
      try {
        const res = await fetch('/api/novedades/tipos-reporte');
        const data = await res.json();
        if (Array.isArray(data)) {
          setTiposReporte(data);
        } else {
          setTiposReporte([]);
        }
      } catch (error) {
        console.error('Error cargando tipos de reporte:', error);
        setTiposReporte([]);
      }
    };
    
    fetchTiposReporte();
  }, [])

  // Corrijo el useEffect de tiposEvento para validar que la respuesta sea un array
  useEffect(() => {
    const fetchTiposEvento = async () => {
      try {
        const res = await fetch('/api/novedades/tipos-evento');
        const data = await res.json();
        if (Array.isArray(data)) {
          setTiposEvento(data);
        } else {
          setTiposEvento([]);
        }
      } catch (error) {
        console.error('Error cargando tipos de evento:', error);
        setTiposEvento([]);
      }
    };
    
    fetchTiposEvento();
  }, [])

  useEffect(() => {
    loadNovedades()
  }, [filtrosDebounced])

  const loadNovedades = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (filtrosDebounced.tipoReporte && filtrosDebounced.tipoReporte !== 'todos') queryParams.append('tipoReporte', filtrosDebounced.tipoReporte)
      if (filtrosDebounced.tipoEvento && filtrosDebounced.tipoEvento !== 'todos') queryParams.append('tipoEvento', filtrosDebounced.tipoEvento)
      if (filtrosDebounced.negocio && filtrosDebounced.negocio !== 'todos') queryParams.append('negocio', filtrosDebounced.negocio)
      if (filtrosDebounced.fecha) {
        const fechaSeleccionada = new Date(filtrosDebounced.fecha + 'T00:00:00')
        const fechaFormateada = format(fechaSeleccionada, 'yyyy-MM-dd')
        queryParams.append('fecha', fechaFormateada)
      }
      if (filtrosDebounced.consecutivo) queryParams.append('consecutivo', filtrosDebounced.consecutivo)
      queryParams.append('limite', filtrosDebounced.limite)

      const response = await fetch(`/api/novedades?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar las novedades')
      }
      
      const data = await response.json()
      setNovedades(data)
    } catch (error) {
      console.error('Error al cargar novedades:', error)
      toast.error('No se pudieron cargar las novedades')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (novedad: Novedad) => {
    setSelectedNovedad(novedad)
    setShowDetailsModal(true)
  }

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false)
    setSelectedNovedad(null)
  }

  const handleDelete = async (novedad: Novedad) => {
    setNovedadToDelete(novedad)
    setShowConfirmModal(true)
  }

  const confirmDelete = async () => {
    if (!novedadToDelete) return

    try {
      const response = await fetch(`/api/novedades/${novedadToDelete.id_novedad}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la novedad')
      }

      toast.success('Novedad eliminada correctamente')

      loadNovedades()
    } catch (error) {
      toast.error('No se pudo eliminar la novedad')
    } finally {
      setShowConfirmModal(false)
      setNovedadToDelete(null)
    }
  }

  const handleSend = (novedad: Novedad) => {
    setSelectedNovedad(novedad)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedNovedad(null)
  }

  const handleFiltroNegocio = (valor: string) => {
    setFiltros({ ...filtros, negocio: valor })
    if (valor === 'todos') {
      setNegocios(todosNegocios)
    } else {
      // Aquí puedes filtrar o volver a cargar según el negocio seleccionado
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center"> 
          <Button onClick={() => router.push('/novedades/registrar')}>
            Registrar Novedad
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
          {[...Array(7)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-md animate-pulse" />
          </div>
          ))}
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(8)].map((_, index) => (
                  <TableHead key={index} className="whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {[...Array(8)].map((_, cellIndex) => (
                    <TableCell key={cellIndex} className="whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"> 
        <Button onClick={() => router.push('/novedades/registrar')}>
          Registrar Novedad
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
        <div className="space-y-2">
          <Label>Tipo de Reporte</Label>
          <Select value={filtros.tipoReporte} onValueChange={(value) => setFiltros({ ...filtros, tipoReporte: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Array.isArray(tiposReporte) && tiposReporte.map((tipo) => (
                <SelectItem key={tipo.id_tipo_reporte} value={tipo.id_tipo_reporte.toString()}>
                  {tipo.nombre_tipo_reporte}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Evento</Label>
          <Select value={filtros.tipoEvento} onValueChange={(value) => setFiltros({ ...filtros, tipoEvento: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Array.isArray(tiposEvento) && tiposEvento.map((tipo) => (
                <SelectItem key={tipo.id_tipo_evento} value={tipo.id_tipo_evento.toString()}>
                  {tipo.nombre_tipo_evento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Negocio</Label>
          <Select value={filtros.negocio} onValueChange={handleFiltroNegocio}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar negocio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Array.isArray(negocios) && negocios
                .filter((negocio) => negocio && negocio.id_negocio !== undefined)
                .map((negocio) => (
                  <SelectItem key={negocio.id_negocio} value={negocio.id_negocio.toString()}>
                    {negocio.nombre_negocio}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input
            type="date"
            value={filtros.fecha}
            onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })}
            className="w-full"
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>

        <div className="space-y-2">
          <Label>Consecutivo</Label>
          <Input
            placeholder="Buscar por consecutivo"
            value={filtros.consecutivo}
            onChange={(e) => setFiltros({ ...filtros, consecutivo: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Límite de Registros</Label>
          <Input
            type="number"
            min="1"
            max="1000"
            value={filtros.limite}
            onChange={(e) => setFiltros({ ...filtros, limite: e.target.value })}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg shadow overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="min-w-[1200px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Consecutivo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Fecha y Hora
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Tipo de Reporte
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Tipo de Evento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Unidad de Negocio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Negocio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Evento Crítico
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {novedades.map((novedad) => (
                <tr key={novedad.id_novedad} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{novedad.consecutivo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(novedad.fecha_hora_novedad), "dd/MM/yyyy HH:mm", { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{novedad.nombre_tipo_reporte}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{novedad.nombre_tipo_evento}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{novedad.nombre_unidad_negocio}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{novedad.nombre_negocio}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      novedad.evento_critico 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {novedad.evento_critico ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(novedad)}
                        title="Ver detalles de la novedad"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(novedad)}
                        title="Eliminar novedad"
                        disabled={novedad.ha_sido_enviada}
                        className={novedad.ha_sido_enviada ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSend(novedad)}
                        title="Enviar novedad por correo"
                      >
                        <Send className={`h-4 w-4 ${novedad.ha_sido_enviada ? 'text-green-600' : ''}`} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailsModal && selectedNovedad && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
            {/* Header visual */}
            <div className="flex items-center gap-4 border-b pb-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Detalles de la Novedad {(selectedNovedad.nombre_negocio && selectedNovedad.nombre_puesto) ? `(${selectedNovedad.nombre_negocio} - ${selectedNovedad.nombre_puesto})` : ''}</h2>
                <div className="text-sm text-gray-500">
                  {format(new Date(selectedNovedad.fecha_hora_novedad), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDetailsModalClose}
                className="ml-auto text-gray-400 hover:text-gray-700"
                aria-label="Cerrar"
              >
                ×
              </Button>
            </div>

            {/* Estado y tipo */}
            <div className="flex flex-wrap gap-4 mb-6">
              {selectedNovedad.nombre_estado && (
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                  Estado: {selectedNovedad.nombre_estado}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedNovedad.evento_critico ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Evento Crítico: {selectedNovedad.evento_critico ? 'Sí' : 'No'}</span>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                {selectedNovedad.nombre_tipo_reporte}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                {selectedNovedad.nombre_tipo_evento}
              </span>
              <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                {selectedNovedad.nombre_unidad_negocio}
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                {selectedNovedad.nombre_negocio}
              </span>
            </div>

            {/* Info general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {(selectedNovedad.nombre_municipio || selectedNovedad.nombre_departamento) && (
                <div>
                  <div className="text-xs text-gray-500">Ubicación</div>
                  <div className="font-medium">{[selectedNovedad.nombre_municipio, selectedNovedad.nombre_departamento].filter(Boolean).join(", ")}</div>
                </div>
              )}
              {selectedNovedad.nombre_zona && (
                <div>
                  <div className="text-xs text-gray-500">Zona</div>
                  <div className="font-medium">{selectedNovedad.nombre_zona}</div>
                </div>
              )}
            </div>

            {/* Gestión y descripción */}
            {selectedNovedad.gestion && (
              <div className="mb-6">
                <div className="text-xs text-gray-500 mb-1">Gestión</div>
                <div className="bg-gray-50 rounded-md p-4 text-gray-700 whitespace-pre-line">{selectedNovedad.gestion}</div>
              </div>
            )}
            {selectedNovedad.descripcion && (
              <div className="mb-6">
                <div className="text-xs text-gray-500 mb-1">Descripción</div>
                <div className="bg-gray-50 rounded-md p-4 text-gray-700 whitespace-pre-line">{selectedNovedad.descripcion}</div>
              </div>
            )}

            {/* Imágenes */}
            {selectedNovedad.imagenes && (
              <div>
                <div className="text-xs text-gray-500 mb-2">Imágenes</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedNovedad.imagenes.split(',').map((url, index) => (
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
          </div>
        </div>
      )}

      {showModal && selectedNovedad && (
        <ModalEnviarNovedad
          novedad={selectedNovedad}
          onClose={handleModalClose}
          onSuccess={() => {
            loadNovedades()
            handleModalClose()
          }}
        />
      )}

      <ModalConfirmacion
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setNovedadToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Eliminar Novedad"
        description="¿Está seguro que desea eliminar esta novedad? Esta acción no se puede deshacer."
      />
    </div>
  )
} 