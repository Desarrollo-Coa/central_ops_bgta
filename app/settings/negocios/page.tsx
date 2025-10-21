"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Skeleton from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Negocio {
  id_negocio: number;
  nombre_negocio: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export default function NegociosPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [negocioEditando, setNegocioEditando] = useState<Negocio | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [negocioAEliminar, setNegocioAEliminar] = useState<Negocio | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMsg, setErrorModalMsg] = useState("");

  useEffect(() => {
    fetchNegocios();
  }, []);

  const fetchNegocios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/negocios");
      if (!res.ok) throw new Error("No se pudieron obtener los negocios");
      const data = await res.json();
      setNegocios(data);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNegocio.trim()) return;
    try {
      const res = await fetch("/api/negocios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_negocio: nombreNegocio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear negocio");
      toast.success(`Se creó el negocio: ${data.negocio.nombre_negocio}`);
      setNombreNegocio("");
      setIsDialogOpen(false);
      fetchNegocios();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!negocioAEliminar) return;
    try {
      const res = await fetch(`/api/negocios/${negocioAEliminar.id_negocio}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          toast.error("No puedes eliminar este negocio porque tiene unidades, puestos o novedades asociadas. Elimina o reasigna esos datos antes de intentar borrar el negocio.");
        } else {
          toast.error(data.error || "No se pudo eliminar el negocio");
        }
        return;
      }
      toast.success(`Se eliminó el negocio: ${negocioAEliminar.nombre_negocio}`);
      setDeleteDialogOpen(false);
      setNegocioAEliminar(null);
      fetchNegocios();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negocioEditando || !nuevoNombre.trim()) return;
    try {
      const res = await fetch(`/api/negocios/${negocioEditando.id_negocio}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_negocio: nuevoNombre })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo editar el negocio");
      toast.success(`Nuevo nombre: ${data.negocio.nombre_negocio}`);
      setEditDialogOpen(false);
      setNegocioEditando(null);
      setNuevoNombre("");
      fetchNegocios();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Negocios</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Negocio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Negocio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Nombre del negocio"
                value={nombreNegocio}
                onChange={e => setNombreNegocio(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-28 flex flex-col justify-center items-center">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4 text-center">{error}</div>
      ) : negocios.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No hay negocios registrados.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {negocios.map((negocio) => (
            <Card key={negocio.id_negocio} className="h-28 flex flex-row items-center gap-4 px-6 w-full">
              <div className="flex items-center justify-center rounded-full h-10 w-10 bg-green-100">
                <span className="font-bold text-green-700 text-sm">{negocio.id_negocio}</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-gray-900 text-left flex-1 min-w-0">
                    <span className="truncate w-full text-sm max-w-full block" title={negocio.nombre_negocio}>
                      {negocio.nombre_negocio}
                    </span>
                  </CardTitle>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="icon" variant="outline" onClick={() => { setNegocioEditando(negocio); setNuevoNombre(negocio.nombre_negocio); setEditDialogOpen(true); }} title="Editar">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => { setNegocioAEliminar(negocio); setDeleteDialogOpen(true); }} title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {negocio.activo ? "Activo" : "Inactivo"} &middot; Creado: {new Date(negocio.fecha_creacion).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Diálogo de edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Negocio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <Input
              placeholder="Nuevo nombre del negocio"
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Diálogo de confirmación de borrado */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar negocio?</DialogTitle>
          </DialogHeader>
          <p>¿Estás seguro de que deseas eliminar el negocio <b>{negocioAEliminar?.nombre_negocio}</b>? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 