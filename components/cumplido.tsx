'use client';

import React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import  Skeleton  from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface CumplidoNegocioTableProps {
  negocioId: number;
  negocioNombre: string;
}

interface Cumplido {
  id_cumplido: number;
  fecha: string;
  id_puesto: number;
  id_tipo_turno: number;
  colaborador: string;
  nombre_puesto: string;
  nombre_unidad: string;
  notas?: Nota[];
  colaborador_nombre?: string;
  colaborador_apellido?: string;
  nombre_colaborador?: string;
}

interface Puesto {
  id_puesto: number;
  nombre_puesto: string;
  nombre_unidad: string;
  id_unidad: number;
  activo: boolean;
  fecha_inicial?: string;
}

interface Nota {
  id_nota: number;
  id_cumplido: number;
  nota: string;
}

interface UnidadNegocio {
  id_unidad: number;
  nombre_unidad: string;
}

interface DateState {
  anio: string;
  mes: string;
  dia: string;
}

interface ModalState {
  type: 'nota' | 'config' | null;
  open: boolean;
  nota?: {
    idCumplido?: number;
    idPuesto?: number;
    idTipoTurno?: number;
    nota?: string;
  };
  config?: {
    modo: 'agregar' | 'editar' | null;
    puesto?: Puesto;
  };
}

interface PendingChange {
  idPuesto: number;
  [turnoId: number]: string | number | null | undefined;
}

export function CumplidoNegocioTable({ negocioId, negocioNombre }: CumplidoNegocioTableProps) {
  const [date, setDate] = useState<DateState>({
    anio: new Date().getFullYear().toString(),
    mes: (new Date().getMonth() + 1).toString(),
    dia: new Date().getDate().toString(),
  });
  const [cumplidos, setCumplidos] = useState<Record<number, Record<number, Cumplido>>>({});
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<number, PendingChange>>(new Map());
  const [notas, setNotas] = useState<Map<string, Nota>>(new Map());
  const [modal, setModal] = useState<ModalState>({ type: null, open: false });
  const [unidadesNegocio, setUnidadesNegocio] = useState<UnidadNegocio[]>([]);
  const [nuevoPuesto, setNuevoPuesto] = useState({ nombre: '', id_unidad: '', fecha_inicial: '' });
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, idPuesto?: number }>({ open: false });
  const [excelMenuOpen, setExcelMenuOpen] = useState(false);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const [excelDesdeAnio, setExcelDesdeAnio] = useState(date.anio);
  const [excelDesdeMes, setExcelDesdeMes] = useState(date.mes);
  const [excelDesdeDia, setExcelDesdeDia] = useState(date.dia);
  const [excelHastaAnio, setExcelHastaAnio] = useState(date.anio);
  const [excelHastaMes, setExcelHastaMes] = useState(date.mes);
  const [excelHastaDia, setExcelHastaDia] = useState(date.dia);
  const [colaboradorSearch, setColaboradorSearch] = useState<Record<string, string>>({});

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [tiposTurno, setTiposTurno] = useState<Array<{ id_tipo_turno: number; nombre_tipo_turno: string }>>([]);

  // Memoized arrays for select options
  const anios = useMemo(
    () =>
      Array.from({ length: 13 }, (_, i) => {
    const year = new Date().getFullYear() + i;
    return { value: year.toString(), label: year.toString() };
      }),
    []
  );

  const meses = useMemo(
    () => [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
    ],
    []
  );

  const dias = useMemo(
    () =>
      Array.from({ length: 31 }, (_, i) => ({
    value: (i + 1).toString(),
        label: (i + 1).toString(),
      })),
    []
  );

  const clearData = useCallback(() => {
    setCumplidos({});
    setPendingChanges(new Map());
    setNotas(new Map());
  }, []);

  const handleCambioAnio = useCallback(
    (value: string) => {
      setDate((prev) => {
        const fechaActual = new Date();
        const nuevoAnio = parseInt(value);
        const esAnioActual = nuevoAnio === fechaActual.getFullYear();
        const esMesActual = parseInt(prev.mes) === fechaActual.getMonth() + 1;
        return {
          ...prev,
          anio: value,
          dia: esAnioActual && esMesActual ? fechaActual.getDate().toString() : '1',
        };
      });
      clearData();
      setColaboradorSearch({});
    },
    [clearData]
  );

  const handleCambioDia = useCallback(
    (value: string) => {
      setDate((prev) => ({ ...prev, dia: value }));
      clearData();
      setColaboradorSearch({});
    },
    [clearData]
  );

  const handleCambioMes = useCallback(
    (value: string) => {
      setDate((prev) => ({ ...prev, mes: value }));
      clearData();
      setColaboradorSearch({});
    },
    [clearData]
  );

  const cargarCumplidos = useCallback(async () => {
    if (!date.mes || !date.dia) return;
    setLoading(true);
    try {
      const fecha = new Date(parseInt(date.anio), parseInt(date.mes) - 1, parseInt(date.dia));
      const responseCumplidos = await fetch(`/api/cumplidos?negocioId=${negocioId}&fecha=${fecha.toISOString()}`);
      if (!responseCumplidos.ok) throw new Error('Error al cargar los cumplidos');
      const data: Cumplido[] = await responseCumplidos.json();
      // Agrupar por puesto y por tipo de turno
      const agrupados: Record<number, Record<number, Cumplido>> = {};
      data.forEach((cumplido) => {
        if (!agrupados[cumplido.id_puesto]) agrupados[cumplido.id_puesto] = {};
        agrupados[cumplido.id_puesto][cumplido.id_tipo_turno] = cumplido;
      });
      setCumplidos(agrupados);
      // Notas: ahora es un array por cumplido
      const nuevasNotas = new Map<string, Nota>();
      data.forEach((cumplido) => {
        if (cumplido.notas && Array.isArray(cumplido.notas)) {
          cumplido.notas.forEach((nota) => {
            nuevasNotas.set(`${cumplido.id_cumplido}`, nota);
          });
        }
      });
      setNotas(nuevasNotas);
    } catch (error) {
      console.error('Error:', error);
      setErrorDialog({ open: true, message: 'Error al cargar los cumplidos' });
    } finally {
      setLoading(false);
    }
  }, [date, negocioId]);

  const saveBatch = useCallback(async (changes: PendingChange[]) => {
    setSaving((prev) => {
      const newSet = new Set(prev);
      changes.forEach((change) => newSet.add(change.idPuesto));
      return newSet;
    });
    try {
      const fecha = new Date(parseInt(date.anio), parseInt(date.mes) - 1, parseInt(date.dia));
      const fechaFormateada = fecha.toISOString();
      // Genera el payload dinámicamente para todos los turnos
      const payload = changes.flatMap((change) => {
        const arr: any[] = [];
        for (const turno of tiposTurno) {
          const value = change[turno.id_tipo_turno];
          if (value !== undefined) {
            arr.push({
              id_puesto: change.idPuesto,
              fecha: fechaFormateada,
              id_tipo_turno: turno.id_tipo_turno,
              nombre_colaborador: value === null ? null : value,
            });
          }
        }
        return arr;
      });
      const response = await fetch('/api/cumplidos/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Error al guardar los cambios');
      const result = await response.json();
      toast.success(`Creados: ${result.creados}, Actualizados: ${result.actualizados}${result.errores && result.errores.length > 0 ? ', Errores: ' + result.errores.length : ''}`);
      setPendingChanges((prev) => {
        const newMap = new Map(prev);
        changes.forEach((change) => newMap.delete(change.idPuesto));
        return newMap;
      });
      await cargarCumplidos();
    } catch (error) {
      console.error('Error:', error);
      setErrorDialog({ open: true, message: 'Error al guardar los cambios' });
    } finally {
      setSaving((prev) => {
        const newSet = new Set(prev);
        changes.forEach((change) => newSet.delete(change.idPuesto));
        return newSet;
      });
    }
  }, [date, cargarCumplidos, toast, tiposTurno]);

  const handleColaboradorChange = useCallback((idPuesto: number, turnoId: number, value: string) => {
    setColaboradorSearch(prev => ({ ...prev, [`${idPuesto}-${turnoId}`]: value }));
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(idPuesto) || { idPuesto };
      existing[turnoId] = value; // Guardar el texto directamente
      newMap.set(idPuesto, existing);
      return newMap;
    });
  }, []);

  const cargarPuestos = useCallback(async () => {
    setLoading(true);
    try {
      const responsePuestos = await fetch(`/api/configuracion-puestos?negocioId=${negocioId}`);
      if (!responsePuestos.ok) throw new Error('Error al cargar los puestos');
      const data = await responsePuestos.json();
      setPuestos(data);
    } catch (error) {
      console.error('Error:', error);
      setErrorDialog({ open: true, message: 'Error al cargar los puestos' });
    } finally {
      setLoading(false);
    }
  }, [negocioId]);

  const cargarUnidadesNegocio = useCallback(async () => {
    try {
      const responseUnidades = await fetch(`/api/configuracion-unidades-negocio?id_negocio=${negocioId}`);
      if (!responseUnidades.ok) throw new Error('Error al cargar las unidades de negocio');
      const data = await responseUnidades.json();
      if (Array.isArray(data)) {
        setUnidadesNegocio(data);
      } else {
        console.error('Los datos recibidos no son un array:', data);
        setUnidadesNegocio([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorDialog({ open: true, message: 'Error al cargar las unidades de negocio' });
    }
  }, [negocioId]);

  const handleAgregarPuesto = useCallback(async () => {
    if (!nuevoPuesto.nombre || !nuevoPuesto.id_unidad || !nuevoPuesto.fecha_inicial) {
      setErrorDialog({ open: true, message: 'Por favor complete todos los campos' });
      return;
    }

    try {
      const responseAgregar = await fetch('/api/configuracion-puestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_puesto: nuevoPuesto.nombre,
          id_unidad: parseInt(nuevoPuesto.id_unidad),
          fecha_inicial: nuevoPuesto.fecha_inicial,
        }),
      });

      if (!responseAgregar.ok) throw new Error('Error al agregar el puesto');
      setModal({ type: null, open: false });
      setNuevoPuesto({ nombre: '', id_unidad: '', fecha_inicial: '' });
      cargarPuestos();
    } catch (error) {
      console.error('Error:', error);
      setErrorDialog({ open: true, message: 'Error al agregar el puesto' });
    }
  }, [nuevoPuesto, cargarPuestos]);

  const handleEditarPuesto = useCallback(async () => {
    if (!modal.config?.puesto) return;

    try {
      const responseEditar = await fetch('/api/configuracion-puestos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_puesto: modal.config.puesto.id_puesto,
          nombre_puesto: nuevoPuesto.nombre,
          id_unidad: parseInt(nuevoPuesto.id_unidad),
          fecha_inicial: nuevoPuesto.fecha_inicial,
        }),
      });

      if (!responseEditar.ok) throw new Error('Error al editar el puesto');
      setModal({ type: null, open: false });
      setNuevoPuesto({ nombre: '', id_unidad: '', fecha_inicial: '' });
      cargarPuestos();
    } catch (error) {
      console.error('Error:', error);
      setErrorDialog({ open: true, message: 'Error al editar el puesto' });
    }
  }, [modal.config, nuevoPuesto, cargarPuestos]);

  const handleEliminarPuesto = useCallback(
    async (idPuesto: number) => {
    try {
      const response = await fetch(`/api/configuracion-puestos?idPuesto=${idPuesto}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        let errorMsg = data.error || 'Error al eliminar el puesto';
        if (data.error && data.error.includes('registros asociados')) {
          const puesto = puestos.find(p => p.id_puesto === idPuesto);
          if (puesto) {
            errorMsg = `No se puede eliminar el puesto "${puesto.nombre_puesto}" porque tiene registros asociados.`;
          }
        }
        throw new Error(errorMsg);
      }
      cargarPuestos();
    } catch (error) {
      console.error('Error:', error);
      setErrorDialog({ open: true, message: error instanceof Error ? error.message : 'Error al eliminar el puesto' });
    }
    },
    [cargarPuestos, puestos]
  );

  const handleEdit = useCallback(
    (puesto: Puesto) => {
      setModal({ type: 'config', open: true, config: { modo: 'editar', puesto } });
      setNuevoPuesto({ 
        nombre: puesto.nombre_puesto, 
        id_unidad: puesto.id_unidad.toString(),
        fecha_inicial: puesto.fecha_inicial ? puesto.fecha_inicial.split('T')[0] : '',
      });
    },
    []
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, idPuesto: number, idTipoTurno: number) => {
      e.preventDefault();
      const cumplido = cumplidos[idPuesto]?.[idTipoTurno];
      const nota = cumplido?.id_cumplido ? notas.get(`${cumplido.id_cumplido}`) : null;
      setModal({
        type: 'nota',
        open: true,
        nota: {
          idCumplido: cumplido?.id_cumplido,
          idPuesto,
          idTipoTurno,
          nota: nota?.nota,
        },
      });
    },
    [cumplidos, notas]
  );


  const guardarNota = useCallback(async () => {
    if (!modal.nota?.idPuesto || !modal.nota?.idTipoTurno) return;
    try {
      const fecha = new Date(parseInt(date.anio), parseInt(date.mes) - 1, parseInt(date.dia));
      let idCumplido = undefined;
      const cumplido = cumplidos[modal.nota.idPuesto]?.[modal.nota.idTipoTurno];
      if (cumplido) {
        idCumplido = cumplido.id_cumplido;
      } else {
        // Si no existe, crear el cumplido primero con colaborador: null
        const response = await fetch('/api/cumplidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_puesto: modal.nota.idPuesto,
            fecha: fecha.toISOString(),
            id_tipo_turno: modal.nota.idTipoTurno,
            colaborador: null,
          }),
        });
        if (!response.ok) throw new Error('Error al crear el cumplido');
        const data = await response.json();
        idCumplido = data.id_cumplido;
      }
      if (!idCumplido) throw new Error('No se pudo obtener el ID del cumplido');
      const response = await fetch('/api/cumplidos/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idCumplido,
          nota: modal.nota.nota,
        }),
      });
      if (!response.ok) throw new Error('Error al guardar la nota');
      setNotas((prev) => {
        const newMap = new Map(prev);
        if (modal.nota?.nota) {
          newMap.set(`${idCumplido}`, {
            id_nota: 0,
            id_cumplido: idCumplido,
            nota: modal.nota.nota,
          });
        } else {
          newMap.delete(`${idCumplido}`);
        }
        return newMap;
      });
      setModal({ type: null, open: false });
      cargarCumplidos();
    } catch (error) {
      console.error('Error:', error);
      setErrorDialog({ open: true, message: 'Error al guardar la nota' });
    }
  }, [modal.nota, date, cargarCumplidos, cumplidos]);

  const handleDescargarExcelGlobal = async () => {
    setExcelDialogOpen(false);
    const fechaInicio = `${excelDesdeAnio}-${excelDesdeMes.padStart(2,'0')}-${excelDesdeDia.padStart(2,'0')}`;
    const fechaFin = `${excelHastaAnio}-${excelHastaMes.padStart(2,'0')}-${excelHastaDia.padStart(2,'0')}`;
    if (fechaInicio > fechaFin) {
      setErrorDialog({ open: true, message: 'La fecha inicial no puede ser mayor que la final' });
      return;
    }
    try {
      const resExcelGlobal = await fetch('/api/cumplidos/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negocioId,
          tipo: 'global',
          fechaInicio,
          fechaFin,
          nombreNegocio: negocioNombre
        })
      });
      if (!resExcelGlobal.ok) {
        if (resExcelGlobal.status === 404) {
          const data = await resExcelGlobal.json();
          setErrorDialog({ open: true, message: data.error || 'No hay datos para el rango de fechas seleccionado.' });
        } else {
          setErrorDialog({ open: true, message: 'Error al descargar Excel' });
        }
        return;
      }
      const blob = await resExcelGlobal.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${negocioNombre.replace(/\s+/g, '_')}_${fechaInicio}_a_${fechaFin}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorDialog({ open: true, message: 'Error al descargar Excel' });
    }
  };

  const handleDescargarExcelDia = async () => {
    const fechaDia = `${date.anio}-${date.mes.padStart(2,'0')}-${date.dia.padStart(2,'0')}`;
    try {
      const resExcelDia = await fetch('/api/cumplidos/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negocioId,
          tipo: 'dia',
          fechaDia,
          nombreNegocio: negocioNombre
        })
      });
      if (!resExcelDia.ok) {
        if (resExcelDia.status === 404) {
          const data = await resExcelDia.json();
          setErrorDialog({ open: true, message: data.error || 'No hay datos para el día seleccionado.' });
        } else {
          setErrorDialog({ open: true, message: 'Error al descargar Excel' });
        }
        return;
      }
      const blob = await resExcelDia.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${negocioNombre.replace(/\s+/g, '_')}_${fechaDia}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorDialog({ open: true, message: 'Error al descargar Excel' });
    }
  };

  const handleSaveAll = useCallback(async () => {
    if (pendingChanges.size === 0) return;
    const allChanges = Array.from(pendingChanges.values());
    const batchSize = 10;
    for (let i = 0; i < allChanges.length; i += batchSize) {
      const batch = allChanges.slice(i, i + batchSize);
      await saveBatch(batch);
    }
    await cargarCumplidos();
  }, [pendingChanges, saveBatch, cargarCumplidos]);

  // Cargar tipos de turno dinámicamente
  useEffect(() => {
    const fetchTiposTurno = async () => {
      try {
        const res = await fetch('/api/cumplidos/tipos-turno');
        const data = await res.json();
        if (Array.isArray(data)) setTiposTurno(data);
        else setTiposTurno([]);
      } catch (e) {
        setTiposTurno([]);
      }
    };
    fetchTiposTurno();
  }, []);

  useEffect(() => {
    cargarPuestos();
    cargarUnidadesNegocio();
  }, [negocioId, cargarPuestos, cargarUnidadesNegocio]);

  useEffect(() => {
    if (date.mes && date.dia) {
      cargarCumplidos();
    }
  }, [date, cargarCumplidos]);

  const fechaSeleccionada = new Date(
    parseInt(date.anio),
    parseInt(date.mes) - 1,
    parseInt(date.dia)
  );

  const puestosFiltrados = puestos.filter((puesto) => {
    // ¿Hay algún cumplido para este puesto en la fecha seleccionada?
    const tieneCumplido = cumplidos[puesto.id_puesto] && Object.keys(cumplidos[puesto.id_puesto]).length > 0;

    // Verifica la fecha inicial
    const fechaInicial = puesto.fecha_inicial ? new Date(puesto.fecha_inicial) : null;
    const fechaValida = !fechaInicial || fechaSeleccionada >= fechaInicial;

    // Si tiene cumplido, mostrarlo siempre. Si no, solo si está activo y la fecha es válida.
    return (tieneCumplido || (puesto.activo && fechaValida));
  });

  // Luego usa puestosFiltrados en vez de puestos para ordenar y renderizar:
  const puestosOrdenados = [...puestosFiltrados].sort((a, b) => {
    // Extrae el primer grupo de letras y el primer número
    const regex = /^([^\d]*?)(\d+)/;
    const matchA = a.nombre_puesto.match(regex);
    const matchB = b.nombre_puesto.match(regex);

    if (matchA && matchB) {
      const prefixA = matchA[1].trim().toUpperCase();
      const prefixB = matchB[1].trim().toUpperCase();
      if (prefixA !== prefixB) {
        return prefixA.localeCompare(prefixB, 'es', { numeric: true });
      }
      const numA = parseInt(matchA[2], 10);
      const numB = parseInt(matchB[2], 10);
      return numA - numB;
    }
    // Si no hay número, ordena alfabéticamente todo el nombre
    return a.nombre_puesto.localeCompare(b.nombre_puesto, 'es', { numeric: true });
  });

  const handleColumnContextMenu = useCallback(
    (e: React.MouseEvent, idTipoTurno: number) => {
      e.preventDefault();
      
      // Asignar NO APLICA a todos los puestos de esta columna (turno)
      const nuevosCambios = new Map(pendingChanges);
      
      puestosOrdenados.forEach((puesto) => {
        const cambiosExistentes = nuevosCambios.get(puesto.id_puesto) || { idPuesto: puesto.id_puesto };
        nuevosCambios.set(puesto.id_puesto, {
          ...cambiosExistentes,
          [idTipoTurno]: "NO APLICA"
        });
        
        // Actualizar también el texto de búsqueda
        setColaboradorSearch(prev => ({
          ...prev,
          [`${puesto.id_puesto}-${idTipoTurno}`]: "NO APLICA"
        }));
      });
      
      setPendingChanges(nuevosCambios);
      toast.success(`Se asignó "NO APLICA" a todos los puestos del turno ${tiposTurno.find(t => t.id_tipo_turno === idTipoTurno)?.nombre_tipo_turno}`);
    },
    [pendingChanges, puestosOrdenados, tiposTurno]
  );

  return (
    <Card className="w-full">
      <CardHeader className="sticky top-0 bg-white z-10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-center">REPORTE DIARIO {negocioNombre}</CardTitle>
          <div className="flex gap-2">
            <DropdownMenu open={excelMenuOpen} onOpenChange={setExcelMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={pendingChanges.size !== 0}>Descargar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setExcelDialogOpen(true); setExcelMenuOpen(false); }}>
                  Descargar Global
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDescargarExcelDia}>
                  Descargar Día Actual
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              onClick={handleSaveAll}
              disabled={pendingChanges.size === 0}
              className="ml-2"
            >
              Guardar
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex flex-col gap-2 w-48">
            <Label className="mb-1">Año</Label>
            <Select value={date.anio} onValueChange={handleCambioAnio}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un año" />
              </SelectTrigger>
              <SelectContent>
                {anios.map((a) => (
                  <SelectItem key={`anio-${a.value}`} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="mb-1">Mes</Label>
            <Select value={date.mes} onValueChange={handleCambioMes}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un mes" />
              </SelectTrigger>
              <SelectContent>
                {meses.map((m) => (
                  <SelectItem key={`mes-${m.value}`} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="mb-1">Día</Label>
            <Select value={date.dia} onValueChange={handleCambioDia}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un día" />
              </SelectTrigger>
              <SelectContent>
                {dias.map((d) => (
                  <SelectItem key={`dia-${d.value}`} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => setModal({ type: 'config', open: true, config: { modo: 'agregar' } })}
            >
              Configurar Puestos
            </Button>
          </div>
          <div className="flex-1 overflow-auto max-h-[calc(100vh-250px)]">
            {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="flex gap-2">
                      <Skeleton className="h-12 w-[200px]" />
                      <Skeleton className="h-12 w-[200px]" />
                      <Skeleton className="h-12 w-[300px]" />
                      <Skeleton className="h-12 w-[200px]" />
                      <Skeleton className="h-12 w-[300px]" />
                    </div>
                  ))}
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[200px]">Unidad de Negocio</TableHead>
                    <TableHead className="w-[150px]">Puesto</TableHead>
                    {tiposTurno.map(turno => (
                      <TableHead 
                        key={turno.id_tipo_turno} 
                        className="w-[300px] cursor-context-menu hover:bg-gray-100 transition-colors"
                        onContextMenu={(e) => handleColumnContextMenu(e, turno.id_tipo_turno)}
                        title="Click derecho para asignar 'NO APLICA' a toda la columna"
                      >
                        Colaborador {turno.nombre_tipo_turno}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {puestosOrdenados.reduce((acc: { nombre_unidad: string; puestos: Puesto[] }[], puesto) => {
                    const unidadIndex = acc.findIndex((item) => item.nombre_unidad === puesto.nombre_unidad);
                    if (unidadIndex === -1) {
                      acc.push({
                        nombre_unidad: puesto.nombre_unidad,
                        puestos: [puesto],
                      });
                    } else {
                      acc[unidadIndex].puestos.push(puesto);
                    }
                    return acc;
                  }, []).map((unidad, unidadIndex) => (
                    <React.Fragment key={`unidad-${unidad.nombre_unidad}-${unidadIndex}`}>
                      {unidad.puestos.map((puesto: Puesto, puestoIndex: number) => {
                        const cambios = (pendingChanges.get(puesto.id_puesto) || {}) as PendingChange;
                        const isSaving = saving.has(puesto.id_puesto);
                        return (
                          <TableRow 
                            key={`puesto-${puesto.id_puesto}-${puestoIndex}`}
                            className={puestoIndex === unidad.puestos.length - 1 ? 'border-b-4 border-gray-300' : ''}
                          >
                            {puestoIndex === 0 && (
                              <TableCell rowSpan={unidad.puestos.length} className="w-[200px]">
                                {unidad.nombre_unidad}
                              </TableCell>
                            )}
                            <TableCell className="w-[150px]">{puesto.nombre_puesto}</TableCell>
                            {tiposTurno.map(turno => {
                              const cumplido = cumplidos[puesto.id_puesto]?.[turno.id_tipo_turno];
                              const nota = cumplido?.id_cumplido ? notas.get(`${cumplido.id_cumplido}`) : null;
                              return (
                                <TableCell key={turno.id_tipo_turno} className="w-[300px]">
                                  <div className="relative" onContextMenu={e => handleContextMenu(e, puesto.id_puesto, turno.id_tipo_turno)}>
                                    <Input
                                      type="text"
                                      className={`w-[250px] border rounded px-2 py-3 min-h-[48px] max-h-[200px] resize-none overflow-y-auto whitespace-normal break-words ${nota ? 'bg-red-100' : ''} ${isSaving ? 'opacity-50' : ''}`}
                                      value={colaboradorSearch[`${puesto.id_puesto}-${turno.id_tipo_turno}`] ?? (cambios[turno.id_tipo_turno] !== undefined ? cambios[turno.id_tipo_turno] : (cumplido?.nombre_colaborador || ''))}
                                      onChange={e => {
                                        handleColaboradorChange(puesto.id_puesto, turno.id_tipo_turno, e.target.value);
                                      }}
                                      disabled={isSaving}
                                      autoComplete="off"
                                      placeholder="Nombre del colaborador..."
                                      ref={el => { inputRefs.current[`${puesto.id_puesto}-${turno.id_tipo_turno}`] = el; }}
                                    />
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardHeader>

      <Dialog
        open={modal.type === 'nota' && modal.open}
        onOpenChange={(open) => setModal((prev) => ({ ...prev, open, type: open ? prev.type : null }))}
      >
        <DialogContent aria-describedby="nota-dialog-description">
          <DialogHeader>
            <DialogTitle>Nota para colaborador {modal.nota?.idTipoTurno ? tiposTurno.find(t => t.id_tipo_turno === modal.nota?.idTipoTurno)?.nombre_tipo_turno : ''}</DialogTitle>
          </DialogHeader>
          <div id="nota-dialog-description" className="sr-only">
            Formulario para agregar o editar una nota para el colaborador {modal.nota?.idTipoTurno ? tiposTurno.find(t => t.id_tipo_turno === modal.nota?.idTipoTurno)?.nombre_tipo_turno : ''}
          </div>
          <Textarea
            value={modal.nota?.nota || ''}
            onChange={(e) => setModal((prev) => ({ ...prev, nota: { ...prev.nota!, nota: e.target.value } }))}
            placeholder="Ingrese la nota aquí..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button onClick={guardarNota}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={modal.type === 'config' && modal.open}
        onOpenChange={(open) => {
          if (!open) {
            setModal({ type: null, open: false });
            setNuevoPuesto({ nombre: '', id_unidad: '', fecha_inicial: '' });
          }
        }}
      >
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>{modal.config?.modo === 'agregar' ? 'Agregar Nuevo Puesto' : 'Editar Puesto'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row gap-6 py-4">
            <div className="flex-1 min-w-[250px] max-w-[350px] border-r md:pr-6 pr-0 mb-4 md:mb-0">
                <div className="space-y-2">
                  <Label>Unidad de Negocio</Label>
                  <Select
                    value={nuevoPuesto.id_unidad}
                  onValueChange={(value) => setNuevoPuesto((prev) => ({ ...prev, id_unidad: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesNegocio
                      .filter((unidad) => unidad.id_unidad !== undefined)
                        .map((unidad, index) => (
                        <SelectItem key={`unidad-${unidad.id_unidad || index}`} value={unidad.id_unidad?.toString() || ''}>
                            {unidad.nombre_unidad}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              <div className="space-y-2 mt-4">
                <Label>Nombre del Puesto</Label>
                <Input
                  value={nuevoPuesto.nombre}
                  onChange={(e) => setNuevoPuesto((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ingrese el nombre del puesto"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label>Fecha Inicial</Label>
                <Input
                  type="date"
                  value={nuevoPuesto.fecha_inicial}
                  onChange={(e) => setNuevoPuesto((prev) => ({ ...prev, fecha_inicial: e.target.value }))}
                  placeholder="Seleccione la fecha inicial"
                />
              </div>
              <div className="mt-6">
                {modal.config?.modo === 'agregar' ? (
                  <Button className="w-full" onClick={handleAgregarPuesto}>
                    Agregar
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleEditarPuesto}>
                    Guardar Cambios
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-[250px]">
              <h3 className="font-semibold mb-2">Puestos Existentes</h3>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                {puestos.map((puesto) => (
                  <div key={`config-puesto-${puesto.id_puesto}`} className="flex items-center border rounded p-2">
                    <span className="flex-1 break-words pr-4">{puesto.nombre_puesto}</span>
                    <Switch
                      checked={!!puesto.activo}
                      onCheckedChange={async (checked) => {
                        try {
                          await fetch('/api/configuracion-puestos', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id_puesto: puesto.id_puesto,
                              nombre_puesto: puesto.nombre_puesto,
                              id_unidad: puesto.id_unidad,
                              activo: checked ? 1 : 0,
                            }),
                          });
                          cargarPuestos();
                        } catch (error) {
                          setErrorDialog({ open: true, message: 'Error al actualizar el estado del puesto' });
                        }
                      }}
                      className="mr-4"
                    />
                    <div className="flex-shrink-0 flex gap-2 ml-auto">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(puesto)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setConfirmDelete({ open: true, idPuesto: puesto.id_puesto })}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
          </AlertDialogHeader>
          <div>{errorDialog.message}</div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog({ open: false, message: '' })}>
              Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete.open} onOpenChange={open => setConfirmDelete({ open, idPuesto: confirmDelete.idPuesto })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este puesto?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Esta acción no se puede deshacer.</div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDelete.idPuesto) {
                  await handleEliminarPuesto(confirmDelete.idPuesto);
                  setConfirmDelete({ open: false });
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => setConfirmDelete({ open: false })}
              asChild
            >
              <button>Cancelar</button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={excelDialogOpen} onOpenChange={setExcelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descargar Global</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-2">
              <div className="flex flex-col">
                <Label className="mb-2">Desde Año</Label>
                <Select value={excelDesdeAnio} onValueChange={setExcelDesdeAnio}>
                  <SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger>
                  <SelectContent>
                    {anios.map((a) => (
                      <SelectItem key={`desde-anio-${a.value}`} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <Label className="mb-2">Desde Mes</Label>
                <Select value={excelDesdeMes} onValueChange={setExcelDesdeMes}>
                  <SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger>
                  <SelectContent>
                    {meses.map((m) => (
                      <SelectItem key={`desde-mes-${m.value}`} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <Label className="mb-2">Desde Día</Label>
                <Select value={excelDesdeDia} onValueChange={setExcelDesdeDia}>
                  <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                  <SelectContent>
                    {dias.map((d) => (
                      <SelectItem key={`desde-dia-${d.value}`} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col">
                <Label className="mb-2">Hasta Año</Label>
                <Select value={excelHastaAnio} onValueChange={setExcelHastaAnio}>
                  <SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger>
                  <SelectContent>
                    {anios.map((a) => (
                      <SelectItem key={`hasta-anio-${a.value}`} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <Label className="mb-2">Hasta Mes</Label>
                <Select value={excelHastaMes} onValueChange={setExcelHastaMes}>
                  <SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger>
                  <SelectContent>
                    {meses.map((m) => (
                      <SelectItem key={`hasta-mes-${m.value}`} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <Label className="mb-2">Hasta Día</Label>
                <Select value={excelHastaDia} onValueChange={setExcelHastaDia}>
                  <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                  <SelectContent>
                    {dias.map((d) => (
                      <SelectItem key={`hasta-dia-${d.value}`} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExcelDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDescargarExcelGlobal} className="bg-blue-700 text-white">
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 

export default CumplidoNegocioTable;