import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import Skeleton from "@/components/ui/skeleton";

interface Configuracion {
  id: number;
  fecha_inicial: string;
  cantidad_diurno: number;
  cantidad_nocturno: number;
  id_zona: number;
}

interface ConfiguracionesReportesModalProps {
  open: boolean;
  onClose: () => void;
  negocioId: number;
}

// Utilidad para formatear fecha a DD/MM/YYYY
function formatFecha(fecha: string) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Utilidad para formatear fecha a YYYY-MM-DD para el input date
function toInputDate(fecha: string) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ConfiguracionesReportesModal({ open, onClose, negocioId }: ConfiguracionesReportesModalProps) {
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Configuracion> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarConfiguraciones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reporte-comunicacion/configuraciones?negocioId=${negocioId}`);
      const data = await res.json();
      setConfiguraciones(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Error al cargar configuraciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) cargarConfiguraciones();
  }, [open, negocioId]);

  const handleEdit = (config: Configuracion) => {
    setForm({
      ...config,
      fecha_inicial: toInputDate(config.fecha_inicial),
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setForm({ fecha_inicial: '', cantidad_diurno: 0, cantidad_nocturno: 0 });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/reporte-comunicacion/configuraciones?id=${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      setConfirmDelete(false);
      await cargarConfiguraciones();
    } catch (e) {
      setError("Error al eliminar configuración");
    }
  };

  const handleSave = async () => {
    if (!form?.fecha_inicial || form.cantidad_diurno === undefined || form.cantidad_nocturno === undefined) {
      setError("Todos los campos son obligatorios");
      return;
    }
    const fechaMysql = form.fecha_inicial;
    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch('/api/reporte-comunicacion/configuraciones', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          fecha_inicial: fechaMysql,
          cantidad_diurno: form.cantidad_diurno,
          cantidad_nocturno: form.cantidad_nocturno,
          negocioId: negocioId,
        }),
      });
      if (!res.ok) {
        let msg = "Error al guardar configuración";
        try {
          const data = await res.json();
          if (data?.error && typeof data.error === 'string') {
            if (data.error.includes('Duplicate entry') || data.error.includes('unique_fecha_zona')) {
              msg = "Ya existe una configuración para este día y zona.";
            } else {
              msg = data.error;
            }
          }
        } catch {}
        setError(msg);
        return;
      }
      setShowForm(false);
      setForm(null);
      await cargarConfiguraciones();
    } catch (e) {
      setError("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full min-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-900 mb-2">Configuraciones de Reportes de Comunicación</DialogTitle>
          </DialogHeader>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full">
            {/* Formulario a la izquierda */}
            <div className="md:w-[320px] w-full bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-100 h-fit self-start flex-shrink-0">
              <div className="text-lg font-bold text-blue-900 mb-2">{form && form.id ? 'Editar Configuración' : 'Nueva Configuración'}</div>
              <div className="flex flex-col gap-2">
                <div>
                  <Label className="text-xs text-blue-900">Fecha Inicial</Label>
                  <Input type="date" value={form?.fecha_inicial || ''} onChange={e => setForm(f => ({ ...f!, fecha_inicial: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-blue-900">Cantidad Diurna</Label>
                  <Input type="number" min={0} value={form?.cantidad_diurno ?? 0} onChange={e => setForm(f => ({ ...f!, cantidad_diurno: parseInt(e.target.value) || 0 }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-blue-900">Cantidad Nocturna</Label>
                  <Input type="number" min={0} value={form?.cantidad_nocturno ?? 0} onChange={e => setForm(f => ({ ...f!, cantidad_nocturno: parseInt(e.target.value) || 0 }))} className="mt-1" />
                </div>
                <div className="flex flex-row gap-2 mt-2">
                  {form && form.id ? (
                    <Button onClick={handleSave} className="bg-blue-700 hover:bg-blue-800 text-white" disabled={saving}>
                      {saving ? <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block align-middle" /> : null}
                      Guardar Cambios
                    </Button>
                  ) : (
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                      {saving ? <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block align-middle" /> : null}
                      Crear
                    </Button>
                  )}
                  {form && form.id && (
                    <Button variant="outline" onClick={() => { setForm({ fecha_inicial: '', cantidad_diurno: 0, cantidad_nocturno: 0 }); }} className="border-gray-300">Cancelar</Button>
                  )}
                </div>
              </div>
            </div>
            {/* Listado a la derecha */}
            <div className="md:w-[320px] w-full flex-1">
              <div className="font-semibold text-blue-900 mb-2 flex items-center justify-between">
                <span>Listado de Configuraciones</span>
              </div>
              <div className="max-h-80 overflow-auto rounded-lg border border-gray-200 shadow-sm bg-white">
                {loading ? (
                  <div className="p-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex flex-row gap-4 mb-2">
                        <Skeleton className="h-6 w-32 rounded" />
                        <Skeleton className="h-6 w-16 rounded" />
                        <Skeleton className="h-6 w-16 rounded" />
                        <Skeleton className="h-6 w-24 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="text-left px-3 py-2 text-blue-900 font-semibold">Fecha Inicial</th>
                        <th className="text-left px-3 py-2 text-blue-900 font-semibold">Diurno</th>
                        <th className="text-left px-3 py-2 text-blue-900 font-semibold">Nocturno</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {configuraciones.length === 0 && !loading && (
                        <tr><td colSpan={4} className="text-center text-gray-400 py-4">No hay configuraciones registradas</td></tr>
                      )}
                      {configuraciones.map(cfg => (
                        <tr key={cfg.id} className="border-b hover:bg-blue-50 transition-all">
                          <td className="px-3 py-2">{formatFecha(cfg.fecha_inicial)}</td>
                          <td className="px-3 py-2">{cfg.cantidad_diurno}</td>
                          <td className="px-3 py-2">{cfg.cantidad_nocturno}</td>
                          <td className="px-3 py-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(cfg)} className="border-blue-400 text-blue-700 hover:bg-blue-100">Editar</Button>
                            <Button size="sm" variant="destructive" onClick={() => { setDeleteId(cfg.id); setConfirmDelete(true); }} className="bg-red-100 text-red-700 hover:bg-red-200">Eliminar</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta configuración?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Esta acción no se puede deshacer.</div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
            <AlertDialogAction onClick={() => setConfirmDelete(false)} asChild>
              <button>Cancelar</button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 