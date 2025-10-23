'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, Users, UserPlus, Eye } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import  Skeleton from "@/components/ui/skeleton";
import ModalConfirmacion from "@/components/novedades/ModalConfirmacion";

// Tipos
interface Destinatario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
}

interface Asignacion {
  id: number;
  id_destinatario: number;
  nombre_destinatario: string;
  email_destinatario: string;
  id_tipo_evento: number;
  nombre_tipo_evento: string;
  id_puesto: number;
  nombre_puesto: string;
  id_unidad: number;
  nombre_unidad: string;
  id_negocio: number;
  nombre_negocio: string;
  activo: boolean;
}

interface TipoReporte {
  id_tipo_reporte: number;
  nombre_tipo_reporte: string;
}

interface TipoEvento {
  id_tipo_evento: number;
  nombre_tipo_evento: string;
  id_tipo_reporte: number;
}

interface Negocio {
  id_negocio: number;
  nombre_negocio: string;
}

interface UnidadNegocio {
  id_unidad: number;
  nombre_unidad: string;
  id_negocio: number;
}

interface Puesto {
  id_puesto: number;
  nombre_puesto: string;
  id_unidad: number;
}

export default function AsignarDestinatarios() {
  // Estados
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [tiposReporte, setTiposReporte] = useState<TipoReporte[]>([]);
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRegistroDialogOpen, setIsRegistroDialogOpen] = useState(false);
  const [selectedTipoReporte, setSelectedTipoReporte] = useState<string>('');
  const [selectedTipoEvento, setSelectedTipoEvento] = useState<string>('');
  const [selectedNegocio, setSelectedNegocio] = useState<string>('');
  const [selectedUnidad, setSelectedUnidad] = useState<string>('');
  const [selectedPuesto, setSelectedPuesto] = useState<string>('');
  const [selectedDestinatarios, setSelectedDestinatarios] = useState<number[]>([]);
  const [formData, setFormData] = useState({ nombre: '', email: '' });
  const [editingDestinatario, setEditingDestinatario] = useState<Destinatario | null>(null);
  const [isViewingAsignaciones, setIsViewingAsignaciones] = useState(false);
  const [selectedDestinatarioAsignaciones, setSelectedDestinatarioAsignaciones] = useState<Destinatario | null>(null);
  // Estado para el modal de confirmación de eliminación de destinatario
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    Promise.all([
      fetchData('/api/novedades/destinatarios', setDestinatarios),
      fetchData('/api/novedades/asignaciones', setAsignaciones),
      fetchData('/api/novedades/tipos-reporte', setTiposReporte),
              fetchData('/api/negocios', setNegocios),
    ]).catch(() => {
      toast.error("Error al cargar datos iniciales");
    });
  }, []);

  // Cargar tipos de evento cuando cambia el tipo de reporte
  useEffect(() => {
    if (selectedTipoReporte) {
      fetchData(`/api/novedades/tipos-evento/${selectedTipoReporte}`, setTiposEvento);
      setSelectedTipoEvento('');
      setSelectedNegocio('');
      setSelectedUnidad('');
      setSelectedPuesto('');
    } else {
      setTiposEvento([]);
      setSelectedTipoEvento('');
      setSelectedNegocio('');
      setSelectedUnidad('');
      setSelectedPuesto('');
    }
  }, [selectedTipoReporte]);

  // Cargar unidades de negocio cuando cambia el negocio
  useEffect(() => {
    if (selectedNegocio) {
      fetchData(`/api/settings/unidades-negocio?id_negocio=${selectedNegocio}`, setUnidades);
      setSelectedUnidad('');
      setSelectedPuesto('');
    } else {
      setUnidades([]);
      setSelectedUnidad('');
      setSelectedPuesto('');
    }
  }, [selectedNegocio]);

  // Cargar puestos cuando cambia la unidad
  useEffect(() => {
    if (selectedUnidad) {
      fetchData(`/api/novedades/puestos?id_unidad=${selectedUnidad}`, setPuestos);
      setSelectedPuesto('');
    } else {
      setPuestos([]);
      setSelectedPuesto('');
    }
  }, [selectedUnidad]);

  // Función genérica para fetch
  const fetchData = async <T,>(url: string, setter: (data: T[]) => void) => {
    setLoading(true);
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Error al cargar ${url}`);
      const data = await res.json();
      setter(data);
    } catch (error) {
      toast.error(`No se pudo cargar ${url}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar envío del formulario de destinatario
  const handleDestinatarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingDestinatario 
        ? `/api/novedades/destinatarios/${editingDestinatario.id}`
        : '/api/novedades/destinatarios';
      
      const method = editingDestinatario ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error al guardar');
      
      toast.success(editingDestinatario 
        ? "Destinatario actualizado correctamente" 
        : "Destinatario creado correctamente" 
      );
      
      setIsRegistroDialogOpen(false);
      setFormData({ nombre: '', email: '' });
      setEditingDestinatario(null);
      fetchData('/api/novedades/destinatarios', setDestinatarios);
    } catch (error) {
      toast.error(`No se pudo ${editingDestinatario ? 'actualizar' : 'crear'} el destinatario`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de destinatarios
  const handleDestinatarioSelect = (destinatarioId: number) => {
    setSelectedDestinatarios(prev => {
      if (prev.includes(destinatarioId)) {
        return prev.filter(id => id !== destinatarioId);
      }
      return [...prev, destinatarioId];
    });
  };

  // Guardar asignaciones
  const handleAsignacionesSubmit = async () => {
    if (!selectedTipoEvento || !selectedNegocio || !selectedUnidad || !selectedPuesto || selectedDestinatarios.length === 0) {
      toast.error("Por favor seleccione tipo de reporte, tipo de novedad, negocio, unidad de negocio, puesto y destinatarios");
      return;
    }

    setLoading(true);
    try {
      const promises = selectedDestinatarios.map(destinatarioId => 
        fetch('/api/novedades/asignaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            id_destinatario: Number(destinatarioId),
            id_tipo_evento: Number(selectedTipoEvento),
            id_puesto: Number(selectedPuesto)
          }),
        })
      );

      await Promise.all(promises);
      toast.success("Asignaciones guardadas correctamente");
      setIsDialogOpen(false);
      setSelectedTipoReporte('');
      setSelectedTipoEvento('');
      setSelectedNegocio('');
      setSelectedUnidad('');
      setSelectedPuesto('');
      setSelectedDestinatarios([]);
      fetchData('/api/novedades/asignaciones', setAsignaciones);
    } catch (error) {
      toast.error("No se pudieron guardar las asignaciones");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar asignación
  const handleRemoveAsignacion = async (id: number) => {
    try {
      const res = await fetch(`/api/novedades/asignaciones/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error al eliminar asignación');
      toast.success("Asignación eliminada");
      fetchData('/api/novedades/asignaciones', setAsignaciones);
    } catch (error) {
      toast.error("No se pudo eliminar la asignación");
    }
  };

  // Eliminar destinatario
  const handleDeleteDestinatario = (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId === null) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/novedades/destinatarios/${confirmDeleteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.status === 409) {
        toast.error("Este destinatario tiene asignaciones activas. Elimine primero las asignaciones antes de borrar el destinatario.");
        return;
      }
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success("Destinatario eliminado");
      fetchData('/api/novedades/destinatarios', setDestinatarios);
    } catch (error) {
      toast.error("No se pudo eliminar");
    } finally {
      setLoading(false);
      setConfirmDeleteId(null);
    }
  };

  // Función para ver asignaciones de un destinatario
  const handleViewAsignaciones = (destinatario: Destinatario) => {
    setSelectedDestinatarioAsignaciones(destinatario);
    setIsViewingAsignaciones(true);
  };

  // Filtrar asignaciones por destinatario
  const getAsignacionesByDestinatario = (destinatarioId: number) => {
    return asignaciones.filter(a => a.id_destinatario === destinatarioId);
  };

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Gestión de Destinatarios</h2>
          <p className="text-xs sm:text-sm text-gray-500">Administre los destinatarios y sus asignaciones</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Dialog open={isRegistroDialogOpen} onOpenChange={setIsRegistroDialogOpen}>
          <DialogTrigger asChild>
              <Button className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <UserPlus className="h-4 w-4" />
                <span>Nuevo Destinatario</span>
              </Button>
          </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto">
            <DialogHeader>
                <DialogTitle>Registrar Nuevo Destinatario</DialogTitle>
                <p className="text-sm text-gray-500">Complete los datos del nuevo destinatario</p>
            </DialogHeader>
            <form onSubmit={handleDestinatarioSubmit} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  required
                    placeholder="Ingrese el nombre completo"
                />
              </div>
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                    placeholder="ejemplo@correo.com"
                />
              </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full"
                >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingDestinatario ? 'Actualizar' : 'Crear'} Destinatario
              </Button>
            </form>
          </DialogContent>
        </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Users className="h-4 w-4" />
                <span>Gestionar Asignaciones</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto w-[98vw] max-w-3xl">
          <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Asignar Destinatarios a Novedades</DialogTitle>
                <p className="text-xs sm:text-sm text-gray-500">Seleccione los destinatarios para cada tipo de novedad y puesto</p>
          </DialogHeader>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
    {/* Fila 1 */}
    <div className="space-y-2">
      <Label>Tipo de Reporte</Label>
      <Select value={selectedTipoReporte} onValueChange={setSelectedTipoReporte}>
        <SelectTrigger className="w-full text-base min-h-[44px]">
          <SelectValue placeholder="Seleccione tipo de reporte" className="text-base" />
        </SelectTrigger>
        <SelectContent>
          {tiposReporte.map(tipo => (
            <SelectItem key={tipo.id_tipo_reporte} value={String(tipo.id_tipo_reporte)} className="text-base">
              {tipo.nombre_tipo_reporte}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Tipo de Novedad</Label>
      <Select value={selectedTipoEvento} onValueChange={setSelectedTipoEvento} disabled={!selectedTipoReporte}>
        <SelectTrigger className="w-full text-base min-h-[44px]">
          <SelectValue placeholder="Seleccione tipo de novedad" className="text-base" />
        </SelectTrigger>
        <SelectContent>
          {tiposEvento.map(tipo => (
            <SelectItem key={tipo.id_tipo_evento} value={String(tipo.id_tipo_evento)} className="text-base">
              {tipo.nombre_tipo_evento}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {/* Fila 2 */}
    <div className="space-y-2">
      <Label>Negocio</Label>
      <Select value={selectedNegocio} onValueChange={setSelectedNegocio} disabled={!selectedTipoEvento}>
        <SelectTrigger className="w-full text-base min-h-[44px]">
          <SelectValue placeholder="Seleccione un negocio" className="text-base" />
        </SelectTrigger>
        <SelectContent>
          {negocios.map(negocio => (
            <SelectItem key={negocio.id_negocio} value={String(negocio.id_negocio)} className="text-base">
              {negocio.nombre_negocio}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Unidad de Negocio</Label>
      <Select value={selectedUnidad} onValueChange={setSelectedUnidad} disabled={!selectedNegocio}>
        <SelectTrigger className="w-full text-base min-h-[44px]">
          <SelectValue placeholder="Seleccione una unidad" className="text-base" />
        </SelectTrigger>
        <SelectContent>
          {unidades.map(unidad => (
            <SelectItem key={unidad.id_unidad} value={String(unidad.id_unidad)} className="text-base">
              {unidad.nombre_unidad}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {/* Fila 3: Puesto ocupa las dos columnas */}
    <div className="space-y-2 col-span-1 sm:col-span-2">
      <Label>Puesto</Label>
      <Select value={selectedPuesto} onValueChange={setSelectedPuesto} disabled={!selectedUnidad}>
        <SelectTrigger className="w-full text-base min-h-[44px]">
          <SelectValue placeholder="Seleccione un puesto" className="text-base" />
        </SelectTrigger>
        <SelectContent>
          {puestos.map(puesto => (
            <SelectItem key={puesto.id_puesto} value={String(puesto.id_puesto)} className="text-base">
              {puesto.nombre_puesto}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>

                <div className="space-y-2">
                  <Label>Destinatarios</Label>
                  <div className="border rounded-lg p-2 sm:p-4 max-h-[40vh] overflow-y-auto bg-gray-50">
                    {destinatarios.map(destinatario => (
                      <div key={destinatario.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={`destinatario-${destinatario.id}`}
                          checked={selectedDestinatarios.includes(destinatario.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDestinatarios([...selectedDestinatarios, destinatario.id]);
                            } else {
                              setSelectedDestinatarios(selectedDestinatarios.filter(id => id !== destinatario.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`destinatario-${destinatario.id}`}
                          className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate"
                          title={`${destinatario.nombre} (${destinatario.email})`}
                        >
                          {destinatario.nombre} ({destinatario.email})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleAsignacionesSubmit}
                  disabled={loading || !selectedTipoReporte || !selectedTipoEvento || !selectedNegocio || !selectedUnidad || !selectedPuesto || selectedDestinatarios.length === 0}
                  className="w-full mt-4 text-base min-h-[44px]"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Asignar Destinatarios
                </Button>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Destinatarios Registrados</h3>
            <span className="text-xs sm:text-sm text-gray-500">{destinatarios.length} registros</span>
          </div>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
        </div>
      ) : (
              <div className="min-w-[300px] sm:min-w-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
                      <TableHead className="text-xs sm:text-sm">Nombre</TableHead>
                      <TableHead className="text-xs sm:text-sm">Email</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinatarios.map(destinatario => (
              <TableRow key={destinatario.id}>
                        <TableCell className="font-medium text-xs sm:text-sm max-w-[100px] sm:max-w-none truncate">{destinatario.nombre}</TableCell>
                        <TableCell className="text-gray-500 text-xs sm:text-sm max-w-[100px] sm:max-w-none truncate">{destinatario.email}</TableCell>
                        <TableCell className="text-right space-x-1 sm:space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleViewAsignaciones(destinatario)}
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => {
                      setEditingDestinatario(destinatario);
                      setFormData({
                        nombre: destinatario.nombre,
                                email: destinatario.email
                      });
                              setIsRegistroDialogOpen(true);
                    }}
                  >
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleDeleteDestinatario(destinatario.id)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Asignaciones Actuales</h3>
            <span className="text-xs sm:text-sm text-gray-500">{asignaciones.length} asignaciones</span>
          </div>
          <div className="overflow-x-auto w-full">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="min-w-[300px] sm:min-w-[500px]">
                <Table className="min-w-[900px] text-base">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-base">Destinatario</TableHead>
                      <TableHead className="text-base">Tipo de Novedad</TableHead>
                      <TableHead className="text-base">Negocio</TableHead>
                      <TableHead className="text-base">Unidad</TableHead>
                      <TableHead className="text-base">Puesto</TableHead>
                      <TableHead className="text-base text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asignaciones.map(asignacion => (
                      <TableRow key={asignacion.id}>
                        <TableCell className="font-medium text-base max-w-[180px] truncate" title={asignacion.nombre_destinatario}>{asignacion.nombre_destinatario}</TableCell>
                        <TableCell className="text-gray-500 text-base max-w-[180px] truncate" title={asignacion.nombre_tipo_evento}>{asignacion.nombre_tipo_evento}</TableCell>
                        <TableCell className="text-gray-500 text-base max-w-[180px] truncate" title={asignacion.nombre_negocio}>{asignacion.nombre_negocio}</TableCell>
                        <TableCell className="text-gray-500 text-base max-w-[180px] truncate" title={asignacion.nombre_unidad}>{asignacion.nombre_unidad}</TableCell>
                        <TableCell className="text-gray-500 text-base max-w-[180px] truncate" title={asignacion.nombre_puesto}>{asignacion.nombre_puesto}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleRemoveAsignacion(asignacion.id)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para ver asignaciones */}
      <Dialog open={isViewingAsignaciones} onOpenChange={setIsViewingAsignaciones}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[98vw] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Asignaciones de {selectedDestinatarioAsignaciones?.nombre} - ({selectedDestinatarioAsignaciones?.email})
            </DialogTitle>
            <p className="text-xs sm:text-sm text-gray-500">Lista de asignaciones actuales</p>
          </DialogHeader>
          <div className="mt-4 overflow-x-auto w-full">
            <Table className="min-w-[900px] text-base">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">Tipo de Novedad</TableHead>
                  <TableHead className="text-base">Negocio</TableHead>
                  <TableHead className="text-base">Unidad</TableHead>
                  <TableHead className="text-base">Puesto</TableHead>
                  <TableHead className="text-base text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDestinatarioAsignaciones &&
                  getAsignacionesByDestinatario(selectedDestinatarioAsignaciones.id).map(asignacion => (
                    <TableRow key={asignacion.id}>
                      <TableCell className="text-base max-w-[180px] truncate" title={asignacion.nombre_tipo_evento}>{asignacion.nombre_tipo_evento}</TableCell>
                      <TableCell className="text-base max-w-[180px] truncate" title={asignacion.nombre_negocio}>{asignacion.nombre_negocio}</TableCell>
                      <TableCell className="text-base max-w-[180px] truncate" title={asignacion.nombre_unidad}>{asignacion.nombre_unidad}</TableCell>
                      <TableCell className="text-base max-w-[180px] truncate" title={asignacion.nombre_puesto}>{asignacion.nombre_puesto}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => handleRemoveAsignacion(asignacion.id)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <ModalConfirmacion
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar destinatario"
        description="¿Seguro que desea eliminar este destinatario?"
      />
    </div>
  );
}