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
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Envio {
  id_envio: number
  id_novedad: number
  consecutivo: string
  fecha_envio: string
  operador: string
  destinatarios: Array<{ email: string; nombre: string; activo: boolean; existe: boolean }>
  estado: 'enviado' | 'error'
  mensaje_error: string | null
}

export default function HistorialEnvios() {
  const [envios, setEnvios] = useState<Envio[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    loadEnvios()
  }, [])

  const loadEnvios = async () => {
    try {
      const response = await fetch('/api/novedades/envios')
      if (!response.ok) throw new Error('Error al cargar el historial de envíos')
      
      const data = await response.json()
      setEnvios(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('No se pudieron cargar el historial de envíos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(6)].map((_, index) => (
                  <TableHead key={index} className="whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {[...Array(6)].map((_, cellIndex) => (
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
      <h2 className="text-2xl font-semibold">Historial de Envíos</h2>
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Consecutivo</TableHead>
                <TableHead className="whitespace-nowrap">Fecha Envío</TableHead>
                <TableHead className="whitespace-nowrap">Operador</TableHead>
                <TableHead className="min-w-[200px]">Destinatarios</TableHead>
                <TableHead className="whitespace-nowrap">Estado</TableHead>
                <TableHead className="min-w-[200px]">Mensaje de Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {envios.map((envio) => (
                <TableRow key={envio.id_envio}>
                  <TableCell className="whitespace-nowrap">{envio.consecutivo}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(envio.fecha_envio), 'dd/MM/yyyy HH:mm', {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{envio.operador}</TableCell>
                  <TableCell className="min-w-[200px]">
                    <ul className="list-disc list-inside">
                      {envio.destinatarios.map((destinatario, index) => (
                        <li 
                          key={index}
                          className={`p-2 rounded-md ${
                            destinatario.existe 
                              ? 'bg-green-50' 
                              : 'bg-red-50'
                          }`}
                        >
                          {destinatario.nombre} ({destinatario.email})
                          </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        envio.estado === 'enviado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {envio.estado === 'enviado' ? 'Enviado' : 'Error'}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-[200px]">
                    {envio.mensaje_error || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 