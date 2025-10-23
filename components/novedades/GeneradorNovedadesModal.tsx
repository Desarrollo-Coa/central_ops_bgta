import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function GeneradorNovedadesModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");
  const [cantidadExistentes, setCantidadExistentes] = useState(0);
  const [loadingEliminar, setLoadingEliminar] = useState(false);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Función para contar novedades de prueba existentes
  const contarNovedadesPrueba = async () => {
    try {
      const res = await fetch("/api/novedades/eliminar-fake");
      const data = await res.json();
      setCantidadExistentes(data.cantidad || 0);
    } catch (e) {
      console.error('Error contando novedades:', e);
    }
  };

  // Función para eliminar todas las novedades de prueba
  const eliminarNovedadesPrueba = async () => {
    if (cantidadExistentes === 0) return;
    
    if (!confirm(`¿Estás seguro de eliminar ${cantidadExistentes} novedades de prueba? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoadingEliminar(true);
    setError("");
    
    try {
      const res = await fetch("/api/novedades/eliminar-fake", {
        method: "DELETE"
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResultado(data.message);
        setCantidadExistentes(0);
        // Recargar la página después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError("Error al eliminar novedades");
    }
    setLoadingEliminar(false);
  };

  // Cargar cantidad existente cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      contarNovedadesPrueba();
    }
  }, [open]);

  const handleGenerar = async () => {
    setLoading(true);
    setResultado("");
    setError("");
    
    try {
      const res = await fetch("/api/novedades/generar-fake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, año }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResultado(data.message);
        // Actualizar contador
        contarNovedadesPrueba();
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          onOpenChange(false);
          // Recargar la página para mostrar las nuevas novedades
          window.location.reload();
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError("Error al generar novedades");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Novedades de Prueba</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Se generarán 7-15 novedades por cada tipo de evento para el mes seleccionado.
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Mes:</label>
              <select
                value={mes}
                onChange={e => setMes(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                {meses.map((nombre, index) => (
                  <option key={index + 1} value={index + 1}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Año:</label>
              <select
                value={año}
                onChange={e => setAño(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
            <strong>Nota:</strong> Las novedades generadas tendrán:
            <ul className="mt-1 ml-4 list-disc">
              <li>Prefijo "NOVEDAD DE PRUEBA" en la descripción</li>
              <li>Consecutivos que empiecen con "100" (100001, 100002, etc.)</li>
              <li>Imágenes de prueba adjuntas (todas las novedades)</li>
            </ul>
          </div>

          {/* Información de novedades existentes */}
          {cantidadExistentes > 0 && (
            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800">
              <strong>⚠️ Atención:</strong> Existen {cantidadExistentes} novedades de prueba en el sistema.
            </div>
          )}

          <div className="space-y-2">
            <Button 
              onClick={handleGenerar} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Generando..." : `Generar para ${meses[mes - 1]} ${año}`}
            </Button>
            
            {cantidadExistentes > 0 && (
              <Button 
                onClick={eliminarNovedadesPrueba} 
                disabled={loadingEliminar}
                variant="destructive"
                className="w-full"
              >
                {loadingEliminar ? "Eliminando..." : `🗑️ Eliminar ${cantidadExistentes} novedades de prueba`}
          </Button>
            )}
          </div>
          
          {resultado && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
              {resultado}
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 