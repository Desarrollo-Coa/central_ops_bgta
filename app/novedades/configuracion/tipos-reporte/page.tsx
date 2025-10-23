'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface TipoReporte {
  id: number
  nombre: string
}

export default function TiposReportePage() {
  const [tiposReporte, setTiposReporte] = useState<TipoReporte[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoReporte | null>(null)


  useEffect(() => {
    loadTiposReporte()
  }, [])

  const loadTiposReporte = async () => {
    try {
      const response = await fetch('/api/novedades/configuracion/tipos-reporte')
      if (!response.ok) throw new Error('Error al cargar tipos de reporte')
      const data = await response.json()
      setTiposReporte(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('No se pudieron cargar los tipos de reporte')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      nombre_tipo_reporte: formData.get('nombre_tipo_reporte') as string,
    }

    try {
      const url = editingTipo 
        ? `/api/novedades/configuracion/tipos-reporte/${editingTipo.id}`
        : '/api/novedades/configuracion/tipos-reporte'
      
      const response = await fetch(url, {
        method: editingTipo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Error al guardar el tipo de reporte')

      toast.success(`Tipo de reporte ${editingTipo ? 'actualizado' : 'creado'} correctamente`)

      setIsDialogOpen(false)
      setEditingTipo(null)
      loadTiposReporte()  
    } catch (error) {
      console.error('Error:', error)
      toast.error('No se pudo guardar el tipo de reporte')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este tipo de reporte?')) return

    try {
      const response = await fetch(`/api/novedades/configuracion/tipos-reporte/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Error al eliminar el tipo de reporte')

      toast.success('Tipo de reporte eliminado correctamente')

      loadTiposReporte()
    } catch (error) {
      console.error('Error:', error)
      toast.error('No se pudo eliminar el tipo de reporte')
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
                {[...Array(3)].map((_, index) => (
                  <TableHead key={index} className="whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {[...Array(3)].map((_, cellIndex) => (
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
    <div className="h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tipos de Reporte</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona las diferentes categorías de reportes para clasificar las novedades
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTipo(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTipo ? 'Editar Tipo de Reporte' : 'Nuevo Tipo de Reporte'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_tipo_reporte">Nombre del Tipo</Label>
                <Input
                  id="nombre_tipo_reporte"
                  name="nombre_tipo_reporte"
                  defaultValue={editingTipo?.nombre}
                  required
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTipo ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposReporte.map((tipo) => (
              <TableRow key={`tipo-reporte-${tipo.id}`} className="hover:bg-gray-50">
                <TableCell className="font-medium">{tipo.id}</TableCell>
                <TableCell>{tipo.nombre}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTipo(tipo)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(tipo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 