"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface TipoEvento {
  id: number
  nombre: string
  id_tipo_reporte: number
}

interface TipoReporte {
  id: number
  nombre: string
}

export default function TiposEventoPage() {
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([])
  const [tiposReporte, setTiposReporte] = useState<TipoReporte[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoEvento | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    id_tipo_reporte: "",
  })


  const loadTiposEvento = async () => {
    try {
      const response = await fetch("/api/novedades/configuracion/tipos-evento")
      if (!response.ok) throw new Error("Error al cargar tipos de evento")
      const data = await response.json()
      setTiposEvento(data)
    } catch (error) {
      toast.error("No se pudieron cargar los tipos de evento")
    }
  }

  const loadTiposReporte = async () => {
    try {
      const response = await fetch("/api/novedades/configuracion/tipos-reporte")
      if (!response.ok) throw new Error("Error al cargar tipos de reporte")
      const data = await response.json()
      setTiposReporte(data)
    } catch (error) {
      toast.error("No se pudieron cargar los tipos de reporte")
    }
  }

  useEffect(() => {
    loadTiposEvento()
    loadTiposReporte()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTipo
        ? `/api/novedades/configuracion/tipos-evento/${editingTipo.id}`
        : "/api/novedades/configuracion/tipos-evento"
      
      const method = editingTipo ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_tipo_evento: formData.nombre,
          id_tipo_reporte: parseInt(formData.id_tipo_reporte),
        }),
      })

      if (!response.ok) throw new Error("Error al guardar tipo de evento")

      await loadTiposEvento()
      setIsDialogOpen(false)
      setFormData({ nombre: "", id_tipo_reporte: "" })
      setEditingTipo(null)
      toast.success(`Tipo de evento ${editingTipo ? "actualizado" : "creado"} exitosamente`)
    } catch (error) {
      toast.error("No se pudo guardar el tipo de evento")
    }
  }

  const handleEdit = (tipo: TipoEvento) => {
    setEditingTipo(tipo)
    setFormData({
      nombre: tipo.nombre,
      id_tipo_reporte: tipo.id_tipo_reporte.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este tipo de evento?")) return

    try {
      const response = await fetch(
        `/api/novedades/configuracion/tipos-evento/${id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Error al eliminar tipo de evento")

      await loadTiposEvento()
      toast.success("Tipo de evento eliminado exitosamente")
    } catch (error) {
      toast.error("No se pudo eliminar el tipo de evento")
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tipos de Evento</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo Tipo de Evento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTipo ? "Editar Tipo de Evento" : "Nuevo Tipo de Evento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Reporte</label>
                <Select
                  value={formData.id_tipo_reporte}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_tipo_reporte: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo de reporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposReporte.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setFormData({ nombre: "", id_tipo_reporte: "" })
                    setEditingTipo(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTipo ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo de Reporte</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiposEvento.map((tipo) => (
            <TableRow key={`tipo-evento-${tipo.id}`}>
              <TableCell>{tipo.id}</TableCell>
              <TableCell>{tipo.nombre}</TableCell>
              <TableCell>
                {tiposReporte.find((tr) => tr.id === tipo.id_tipo_reporte)?.nombre}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(tipo)}
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
  )
} 