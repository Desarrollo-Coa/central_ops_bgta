"use client";
import { useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Skeleton from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UnidadNegocio {
  id_unidad: number;
  nombre_unidad: string;
  id_negocio: number;
}
interface Negocio {
  id_negocio: number;
  nombre_negocio: string;
}

export default function UnidadesNegocioPage() {
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [selectedNegocio, setSelectedNegocio] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{ id_unidad?: number; nombre_unidad: string; id_negocio: string }>({ nombre_unidad: "", id_negocio: "" });
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id_unidad?: number }>({ open: false });

  useEffect(() => {
    fetchNegocios();
  }, []);

  useEffect(() => {
    if (selectedNegocio) {
      fetchUnidades(selectedNegocio);
    } else {
      setUnidades([]);
    }
  }, [selectedNegocio]);

  const fetchUnidades = async (idNegocio: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/unidades-negocio?id_negocio=${idNegocio}`);
      if (!res.ok) throw new Error("No se pudieron obtener las unidades de negocio");
      const data = await res.json();
      setUnidades(data);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNegocios = async () => {
    try {
      const res = await fetch("/api/negocios");
      if (!res.ok) throw new Error("No se pudieron obtener los negocios");
      const data = await res.json();
      setNegocios(data);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre_unidad.trim() || !formData.id_negocio) return;
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = "/api/settings/unidades-negocio";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { id_unidad: formData.id_unidad, nombre_unidad: formData.nombre_unidad } : { nombre_unidad: formData.nombre_unidad, id_negocio: formData.id_negocio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setIsDialogOpen(false);
      setFormData({ nombre_unidad: "", id_negocio: "" });
      setIsEditing(false);
      if (selectedNegocio) fetchUnidades(selectedNegocio);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    }
  };

  const handleEdit = (unidad: UnidadNegocio) => {
    setFormData({ id_unidad: unidad.id_unidad, nombre_unidad: unidad.nombre_unidad, id_negocio: unidad.id_negocio.toString() });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.id_unidad) return;
    try {
      const res = await fetch(`/api/settings/unidades-negocio?idUnidad=${deleteDialog.id_unidad}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      if (selectedNegocio) fetchUnidades(selectedNegocio);
      setDeleteDialog({ open: false });
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      setDeleteDialog({ open: false });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
       <div className="flex-1 flex flex-col overflow-hidden">
        <div className="w-full bg-[#000e3a] py-6 text-center sticky top-0 z-10">
          <h1 className="text-3xl font-semibold text-white">UNIDADES DE NEGOCIO</h1>
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <Label>Filtrar por Negocio</Label>
                <Select value={selectedNegocio} onValueChange={v => setSelectedNegocio(v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccione un negocio" />
                  </SelectTrigger>
                  <SelectContent>
                    {negocios.map(n => (
                      <SelectItem key={n.id_negocio} value={n.id_negocio.toString()}>{n.nombre_negocio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => { setIsDialogOpen(true); setIsEditing(false); setFormData({ nombre_unidad: "", id_negocio: selectedNegocio }); }} disabled={!selectedNegocio}>Agregar Unidad</Button>
            </div>
            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-center">{error}</div>}
            {isLoading ? (
              <div className="bg-white rounded-lg shadow p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : selectedNegocio && (
              <div className="bg-white rounded-lg shadow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Negocio</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unidades.map((unidad) => {
                      const negocio = negocios.find(n => n.id_negocio === unidad.id_negocio);
                      return (
                        <TableRow key={unidad.id_unidad}>
                          <TableCell>{unidad.id_unidad}</TableCell>
                          <TableCell>{unidad.nombre_unidad}</TableCell>
                          <TableCell>{negocio ? negocio.nombre_negocio : unidad.id_negocio}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(unidad)}>Editar</Button>
                            <Button variant="destructive" size="sm" className="ml-2" onClick={() => setDeleteDialog({ open: true, id_unidad: unidad.id_unidad })}>Eliminar</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Unidad de Negocio" : "Agregar Unidad de Negocio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre de la Unidad</Label>
              <Input
                value={formData.nombre_unidad}
                onChange={e => setFormData(f => ({ ...f, nombre_unidad: e.target.value }))}
                placeholder="Nombre de la unidad"
                required
              />
            </div>
            {!isEditing && (
              <div>
                <Label>Negocio</Label>
                <Select value={formData.id_negocio} onValueChange={v => setFormData(f => ({ ...f, id_negocio: v }))} required disabled={!!selectedNegocio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un negocio" />
                  </SelectTrigger>
                  <SelectContent>
                    {negocios.map(n => (
                      <SelectItem key={n.id_negocio} value={n.id_negocio.toString()}>{n.nombre_negocio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="submit">{isEditing ? "Guardar Cambios" : "Agregar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Seguro que deseas eliminar esta unidad?</DialogTitle>
          </DialogHeader>
          <div>Esta acción no se puede deshacer.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 