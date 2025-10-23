'use client';

import { useState, useEffect } from 'react'; 
import { GraficoCard } from '@/components/novedades/GraficoCard';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from 'recharts';
import Skeleton from '@/components/ui/skeleton';
import { BarChart as BarChartIcon, Flame as HeatmapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PALETA = [
  '#9966CC',
  '#00AFA3',
  '#1A4A96',
  '#FF6B6B',
  '#4CAF50',
  '#FFA726',
  '#7E57C2',
  '#26A69A',
  '#EF5350',
  '#66BB6A',
  '#FFEE58',
  '#5C6BC0',
];

interface Evento {
  id_novedad: number;
  consecutivo: string;
  fecha_novedad: string;
  hora_novedad: string;
  descripcion: string;
  gestion: string | null;
  tipo_novedad: string;
  nivel_criticidad: string;
  puesto: string;
  unidad_negocio: string;
  sede: string;
  archivos: { url_archivo: string }[];
  zona?: string;
}

type UnidadNegocio = 'TODOS' | string;

interface EstadisticasGeneralesProps {
  id_negocio: number;
  id_unidad?: number;
  id_puesto?: number;
}

function DistribucionHorariaNovedades({
  eventos,
  onBarClick,
  onCellClick,
}: {
  eventos: Evento[];
  onBarClick: (hora: string, tipo?: string) => void;
  onCellClick: (hora: string, tipo: string) => void;
}) {
  const [tipoGrafico, setTipoGrafico] = useState<'bar' | 'heatmap' | 'tendencia'>('tendencia');
  const horas = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const tipos = Array.from(new Set(eventos.map((e) => e.tipo_novedad)));

  const dataBar = horas.map((hora) => {
    const obj: any = { hora };
    tipos.forEach((tipo) => {
      obj[tipo] = eventos.filter(
        (e) => e.hora_novedad?.slice(0, 2) === hora && e.tipo_novedad === tipo
      ).length;
    });
    return obj;
  });

  const dataHeatmap = tipos.map((tipo) => {
    const row: any = { tipo };
    horas.forEach((hora) => {
      row[hora] = eventos.filter(
        (e) => e.hora_novedad?.slice(0, 2) === hora && e.tipo_novedad === tipo
      ).length;
    });
    return row;
  });

  const colorTipo = (tipo: string) => PALETA[tipos.indexOf(tipo) % PALETA.length];

  return (
    <div className="col-span-7 w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold">Distribución Horaria de Novedades</h3>
        <div className="flex gap-2">
          <button
            className={`p-2 rounded-full border transition ${
              tipoGrafico === 'bar'
                ? 'bg-violet-100 border-violet-400 text-violet-700 shadow'
                : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-violet-50'
            }`}
            onClick={() => setTipoGrafico('bar')}
            title="Ver gráfico de barras apiladas"
          >
            <BarChartIcon className="w-5 h-5" />
          </button>
          <button
            className={`p-2 rounded-full border transition ${
              tipoGrafico === 'heatmap'
                ? 'bg-violet-100 border-violet-400 text-violet-700 shadow'
                : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-violet-50'
            }`}
            onClick={() => setTipoGrafico('heatmap')}
            title="Ver heatmap horas vs tipo"
          >
            <HeatmapIcon className="w-5 h-5" />
          </button>
          <button
            className={`p-2 rounded-full border transition ${
              tipoGrafico === 'tendencia'
                ? 'bg-violet-100 border-violet-400 text-violet-700 shadow'
                : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-violet-50'
            }`}
            onClick={() => setTipoGrafico('tendencia')}
            title="Ver tendencia horaria"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
            </svg>
          </button>
        </div>
      </div>
      {tipoGrafico === 'bar' && (
        <div className="flex flex-wrap gap-3 mb-2">
          {tipos.map((tipo) => (
            <div key={tipo} className="flex items-center gap-1">
              <span
                className="inline-block w-4 h-4 rounded"
                style={{ background: colorTipo(tipo) }}
              ></span>
              <span className="text-xs text-gray-700 font-medium">{tipo}</span>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence mode="wait">
        {tipoGrafico === 'bar' && (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={dataBar} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" label={{ value: 'Hora', position: 'insideBottom', offset: -2 }} />
                <YAxis
                  allowDecimals={false}
                  label={{ value: 'Novedades', angle: -90, position: 'insideLeft' }}
                />
                <RechartsTooltip formatter={(value: number, name: string) => [`${value} novedades`, name]} />
                <RechartsLegend />
                {tipos.map((tipo, i) => (
                  <Bar
                    key={tipo}
                    dataKey={tipo}
                    stackId="a"
                    fill={colorTipo(tipo)}
                    onClick={(_, index) => onBarClick(horas[index], tipo)}
                    cursor="pointer"
                  >
                    <LabelList
                      dataKey={tipo}
                      position="inside"
                      formatter={(value: React.ReactNode) => (typeof value === 'number' && value > 0 ? value : '')}
                      style={{ fill: '#fff', fontWeight: 'bold', fontSize: 11, textShadow: '0 1px 2px #0006' }}
                    />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
        {tipoGrafico === 'heatmap' && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full border text-xs">
                <thead>
                  <tr>
                    <th className="border p-1 bg-gray-50">Tipo</th>
                    {horas.map((h) => (
                      <th key={h} className="border p-1 bg-gray-50">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataHeatmap.map((row: any, i: number) => (
                    <tr key={row.tipo}>
                      <td className="border p-1 font-bold" style={{ color: colorTipo(row.tipo) }}>
                        {row.tipo}
                      </td>
                      {horas.map((h) => {
                        const val = row[h];
                        const max = Math.max(...dataHeatmap.map((r: any) => r[h]));
                        const bg = val > 0 ? `rgba(56, 189, 248, ${0.2 + 0.8 * (val / (max || 1))})` : 'white';
                        return (
                          <td
                            key={h}
                            className="border p-1 text-center cursor-pointer"
                            style={{ background: bg }}
                            title={`${val} novedades`}
                            onClick={() => val > 0 && onCellClick(h, row.tipo)}
                          >
                            {val > 0 ? val : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {tipoGrafico === 'tendencia' && (
          <motion.div
            key="tendencia"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            <ResponsiveContainer width="100%" height={340}>
              <LineChart
                data={horas.map((hora) => ({
                  hora,
                  total: eventos.filter((e) => e.hora_novedad?.slice(0, 2) === hora).length,
                }))}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" label={{ value: 'Hora', position: 'insideBottom', offset: -2 }} />
                <YAxis
                  allowDecimals={false}
                  label={{ value: 'Novedades', angle: -90, position: 'insideLeft' }}
                  domain={[0, (dataMax: number) => (dataMax || 0) + 10]}
                />
                <RechartsTooltip formatter={(value: number) => [`${value} novedades`, 'Total']} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#00ffc3"
                  strokeWidth={2}
                  dot={{ r: 5, stroke: '#00ffc3', strokeWidth: 2, fill: 'white' }}
                  activeDot={{ r: 7, stroke: '#00ffc3', strokeWidth: 2, fill: 'white' }}
                  isAnimationActive={true}
                  onClick={(data, index) => {
                    if (typeof index === 'number') onBarClick(horas[index]);
                  }}
                  cursor="pointer"
                >
                  <LabelList
                    dataKey="total"
                    content={({ x, y, value }: any) => {
                      if (typeof y !== 'number' || !value) return null;
                      const numValue = Number(value);
                      if (!numValue || isNaN(numValue)) return null;
                      return (
                        <text
                          x={x}
                          y={y - 14}
                          textAnchor="middle"
                          fontWeight="bold"
                          fontSize={12}
                          fill="#222"
                          style={{ textShadow: '0 1px 2px #fff' }}
                        >
                          {numValue}
                        </text>
                      );
                    }}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function filtrarUnicosPorId(arr: Evento[]): Evento[] {
  const vistos = new Set<number>();
  return arr.filter((e) => {
    if (vistos.has(e.id_novedad)) return false;
    vistos.add(e.id_novedad);
    return true;
  });
}

// Layout exclusivo para Cementos
interface EstadisticasLayoutCementosProps {
  titulo: string;
  descripcion: string;
  filtros: React.ReactNode;
  metricas: React.ReactNode;
  graficos: React.ReactNode;
}

function EstadisticasLayoutCementos({
  titulo,
  descripcion,
  filtros,
  metricas,
  graficos,
}: EstadisticasLayoutCementosProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-0 py-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0 px-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{titulo}</h1>
            <p className="mt-2 text-sm text-gray-600">{descripcion}</p>
          </div>
        </div>
        {/* Filters and Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8 px-6">
          {/* Filters Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow md:col-span-2">
            {filtros}
          </div>
          {/* Metrics Cards */}
          {metricas}
        </div>
        {/* Charts Section */}
        <div className="space-y-8 px-6">
          {/* Primera fila: Dos columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {graficos}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EstadisticasGenerales({ id_negocio, id_unidad, id_puesto }: EstadisticasGeneralesProps) {


  console.log('EstadisticasGenerales recibió:', { id_negocio, id_unidad, id_puesto });

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<number | undefined>(id_unidad);
  const [puestoSeleccionado, setPuestoSeleccionado] = useState<number | undefined>(id_puesto);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loadingZona, setLoadingZona] = useState(false);
   const [modalData, setModalData] = useState<{ show: boolean; title: string; data: Evento[] }>({
    show: false,
    title: '',
    data: [],
  });
  const [añoMeses, setAñoMeses] = useState<number>(new Date().getFullYear());
  const [novedadesPorMesAño, setNovedadesPorMesAño] = useState<number[]>(Array(12).fill(0));

  useEffect(() => {
    const hoy = new Date();
    const hastaDefault = hoy.toISOString().split('T')[0];
    const hace7dias = new Date(hoy);
    hace7dias.setDate(hoy.getDate() - 7 + 1); // Incluye el día actual
    const desdeDefault = hace7dias.toISOString().split('T')[0];
    setDesde(desdeDefault);
    setHasta(hastaDefault);
  }, []);

  // Limpiar arrays cuando cambie el negocio
  useEffect(() => {
    setUnidades([]);
    setPuestos([]);
    setUnidadSeleccionada(undefined);
    setPuestoSeleccionado(undefined);
  }, [id_negocio]);

  // Limpiar puesto cuando cambie la unidad (si el puesto no pertenece a la nueva unidad)
  useEffect(() => {
    if (unidadSeleccionada && puestoSeleccionado) {
      const puestoActual = puestos.find(p => p.id_puesto === puestoSeleccionado);
      if (puestoActual && puestoActual.id_unidad !== unidadSeleccionada) {
        setPuestoSeleccionado(undefined);
      }
    }
  }, [unidadSeleccionada, puestos, puestoSeleccionado]);

  // Cargar unidades de negocio
  useEffect(() => {
    if (!id_negocio) return;
    const fetchUnidades = async () => {
      console.log('Cargando unidades para negocio:', id_negocio);
      try {
        const res = await fetch(`/api/novedades/unidades-negocio?id_negocio=${id_negocio}`);
        console.log('Respuesta unidades:', res.status);
        const data = await res.json();
        console.log('Datos unidades recibidos:', data);
        setUnidades(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error cargando unidades:', error);
        setUnidades([]);
      }
    };
    
    fetchUnidades();
  }, [id_negocio]);

  // Cargar puestos
  useEffect(() => {
    if (!id_negocio) {
      setPuestos([]);
      return;
    }
    
    const fetchPuestos = async () => {
      console.log('Cargando puestos para negocio:', id_negocio, 'unidad:', unidadSeleccionada);
      
      // Si no hay unidad seleccionada, cargar todos los puestos del negocio
      // Si hay unidad seleccionada, cargar solo los puestos de esa unidad
      const url = unidadSeleccionada 
        ? `/api/novedades/puestos?id_unidad=${unidadSeleccionada}`
        : `/api/novedades/puestos?id_negocio=${id_negocio}`;
      
      try {
        const res = await fetch(url);
        console.log('Respuesta puestos:', res.status);
        const data = await res.json();
        console.log('Datos puestos recibidos:', data);
        setPuestos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error cargando puestos:', error);
        setPuestos([]);
      }
    };
    
    fetchPuestos();
  }, [id_negocio, unidadSeleccionada]);

  // Función para manejar cambio de puesto
  const handlePuestoChange = (puestoId: string) => {
    const puestoIdNum = puestoId === '' ? undefined : Number(puestoId);
    setPuestoSeleccionado(puestoIdNum);
    
    // Si se selecciona un puesto, encontrar y seleccionar su unidad correspondiente
    if (puestoIdNum) {
      const puestoSeleccionado = puestos.find(p => p.id_puesto === puestoIdNum);
      if (puestoSeleccionado && puestoSeleccionado.id_unidad) {
        setUnidadSeleccionada(puestoSeleccionado.id_unidad);
      }
    }
  };

  // Cargar estadísticas
  useEffect(() => {
    if (!id_negocio || !desde || !hasta) return;
    setLoadingZona(true);
    const params = new URLSearchParams({
      id_negocio: id_negocio.toString(),
      desde,
      hasta,
    });
    if (unidadSeleccionada) params.append('id_unidad', unidadSeleccionada.toString());
    if (puestoSeleccionado) params.append('id_puesto', puestoSeleccionado.toString());
    const fetchEstadisticas = async () => {
      try {
        const res = await fetch(`/api/novedades/estadisticas-generales?${params.toString()}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        setData(null);
      } finally {
        setLoadingZona(false);
      }
    };
    
    fetchEstadisticas();
  }, [id_negocio, unidadSeleccionada, puestoSeleccionado, desde, hasta]);

  // Cargar datos por mes para el año seleccionado
  useEffect(() => {
    if (!id_negocio || !añoMeses) return;
    
    const desdeAño = `${añoMeses}-01-01`;
    const hastaAño = `${añoMeses}-12-31`;
    
    const params = new URLSearchParams({
      id_negocio: id_negocio.toString(),
      desde: desdeAño,
      hasta: hastaAño,
    });
    if (unidadSeleccionada) params.append('id_unidad', unidadSeleccionada.toString());
    if (puestoSeleccionado) params.append('id_puesto', puestoSeleccionado.toString());
    
    const fetchEstadisticasPorMes = async () => {
      try {
        const res = await fetch(`/api/novedades/estadisticas-generales?${params.toString()}`);
        const json = await res.json();
        const datosPorMes = json.porMes || [];
        const nuevoArray = Array(12).fill(0);
        
        datosPorMes.forEach((item: any) => {
          const mes = item.mes - 1; // Los meses van de 1-12, pero el array es 0-11
          nuevoArray[mes] = item.cantidad;
        });
        
        setNovedadesPorMesAño(nuevoArray);
      } catch (error) {
        console.error('Error cargando estadísticas por mes:', error);
        setNovedadesPorMesAño(Array(12).fill(0));
      }
    };
    
    fetchEstadisticasPorMes();
  }, [id_negocio, unidadSeleccionada, puestoSeleccionado, añoMeses]);

  const formatearFecha = (fecha: string): string => {
    if (!fecha) return '';
    if (fecha.includes('T')) {
      const [fechaPart] = fecha.split('T');
      const [year, month, day] = fechaPart.split('-');
      return `${day}/${month}/${year}`;
    }
    if (fecha.includes('-')) {
      const [year, month, day] = fecha.split('-');
      return `${day}/${month}/${year}`;
    }
    return fecha;
  };
 
  const eventos: Evento[] = data?.eventos || [];
  const totalEventos = data?.totales?.total || 0;
  const diasFiltrados = data?.totales?.dias || 0; 

  // Filtrar eventos por unidad y puesto seleccionados
  const eventosFiltrados: Evento[] = eventos.filter((e: any) => {
    // Extraer solo la parte de la fecha (YYYY-MM-DD) del evento
    const fechaEvento = e.fecha_novedad.split('T')[0];
    // Comparar solo la fecha, ignorando la hora
    const cumpleFiltroFecha = (!desde || fechaEvento >= desde) && (!hasta || fechaEvento <= hasta);

    // Si no hay filtros de unidad/puesto, usar todos los eventos
    if (!unidadSeleccionada && !puestoSeleccionado) {
      return cumpleFiltroFecha;
    }

    // Si hay filtro de unidad, verificar que el evento pertenezca a esa unidad
    if (unidadSeleccionada) {
      const unidadEvento = unidades.find(u => u.id_unidad_negocio === unidadSeleccionada);
      if (!unidadEvento || e.unidad_negocio !== unidadEvento.nombre_unidad_negocio) {
        return false;
      }
    }

    // Si hay filtro de puesto, verificar que el evento pertenezca a ese puesto
    if (puestoSeleccionado) {
      const puestoEvento = puestos.find(p => p.id_puesto === puestoSeleccionado);
      if (!puestoEvento || e.puesto !== puestoEvento.nombre_puesto) {
        return false;
      }
    }

    return cumpleFiltroFecha;
  });
   
  const tiposNovedad = Array.from(new Set(eventosFiltrados.map((e) => e.tipo_novedad)));
  const eventosPorTipo = tiposNovedad.map((tipo) =>
    eventosFiltrados.filter((e) => e.tipo_novedad === tipo).length
  ); 

  const closeModal = () => {
    setModalData((prev) => ({ ...prev, show: false }));
  };
 

  const fechas = [...new Set(eventos.map((e) => e.fecha_novedad))].sort() as string[];
  const horas = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const eventosPorHora = horas.map((h) =>
    eventos.filter((e) => e.hora_novedad?.slice(0, 2) === h).length
  );
  const promedioEventosPorHora = eventos.length / 24;
  const horasPico = horas.filter((_, i) => eventosPorHora[i] > promedioEventosPorHora);

  const porPuesto = data?.porPuesto || [];

  const currentYear = new Date().getFullYear();
  const añosDisponibles = Array.from({ length: currentYear + 2 - 2023 }, (_, i) => 2023 + i);

  const tiposNegocioParaGrafico =
    !unidadSeleccionada
      ? [...new Set(eventosFiltrados.map((e) => e.unidad_negocio?.trim()))]
      : [Array.isArray(unidades) ? unidades.find(u => u.id_unidad_negocio === unidadSeleccionada)?.nombre_unidad_negocio?.trim() : ''];

  const dataPorNegocio = tiposNegocioParaGrafico.map((tipo) => ({
    nombre_unidad: tipo,
    cantidad: eventosFiltrados.filter((e) => e.unidad_negocio?.toUpperCase().trim() === tipo).length,
  }));
 

  return (
    <div className="h-[90dvh] overflow-y-auto">
      <EstadisticasLayoutCementos
        titulo="Estadísticas Generales"
        descripcion="Visualización y análisis de novedades por período"
        filtros={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-2">
              {/* Fila 1 */}
              <div className="md:col-span-1">
                <label htmlFor="unidadNegocio" className="block text-xs font-medium text-gray-700 mb-1">
                  Unidad de Negocio
                </label>
                <select
                  id="unidadNegocio"
                  value={unidadSeleccionada ?? ''}
                  onChange={(e) => setUnidadSeleccionada(e.target.value === '' ? undefined : Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                  <option value="">Todas las unidades ({unidades.length} disponibles)</option>
                  {unidades
                    .filter((unidad: any) => unidad.id_unidad_negocio !== undefined && unidad.id_unidad_negocio !== null)
                    .map((unidad: any) => (
                      <option key={`unidad-${unidad.id_unidad_negocio}`} value={unidad.id_unidad_negocio}>{unidad.nombre_unidad_negocio}</option>
                    ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label htmlFor="puesto" className="block text-xs font-medium text-gray-700 mb-1">
                  Puesto
                </label>
                <select
                  id="puesto"
                  value={puestoSeleccionado ?? ''}
                  onChange={(e) => handlePuestoChange(e.target.value)}
                  className="w-full px-2 py-1 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                  <option value="">Todos los puestos ({puestos.length} disponibles)</option>
                  {puestos.map((p: any) => (
                    <option key={`puesto-${p.id_puesto}`} value={p.id_puesto}>{p.nombre_puesto}</option>
                  ))}
                </select>
              </div>
              {/* Fila 2 */}
              <div className="md:col-span-1">
                <label htmlFor="desde" className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha Inicio
                </label>
                <input
                  id="desde"
                  type="date"
                  className="w-full px-2 py-1 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="hasta" className="block text-xs font-medium text-gray-700 mb-1">
                  Fecha Fin
                </label>
                <input
                  id="hasta"
                  type="date"
                  className="w-full px-2 py-1 text-sm rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                />
              </div>
            </div>
        }
        metricas={
          loadingZona ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col justify-between h-[220px]"
                >
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <div className="flex-1 flex items-center justify-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            totalEventos > 0 && (
              <>
                <motion.div
                  key="total"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow h-[220px]"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-500">Total Novedades</h3>
                    <span className="p-1 bg-blue-100 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path
                          fillRule="evenodd"
                          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="relative h-24 mt-2 flex items-center justify-center">
                    <RadialBarChart
                      width={120}
                      height={120}
                      data={[{ value: Math.round(totalEventos), fill: PALETA[0] }]}
                      startAngle={0}
                      endAngle={360}
                      innerRadius={45}
                      outerRadius={60}
                    >
                      <PolarGrid gridType="circle" radialLines={false} stroke="none" />
                      <RadialBar dataKey="value" background cornerRadius={10} />
                      <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                          content={(props: any) => {
                            const { cx, cy } = props.viewBox as { cx: number; cy: number };
                            return (
                              <text
                                x={cx}
                                y={cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-lg font-bold text-gray-900"
                              >
                                {Math.round(totalEventos)}
                              </text>
                            );
                          }}
                        />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </div>
                </motion.div>
                <motion.div
                  key="dias"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow h-[220px]"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-500">Días Analizados</h3>
                    <span className="p-1 bg-green-100 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-green-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="relative h-24 mt-2 flex items-center justify-center">
                    <RadialBarChart
                      width={120}
                      height={120}
                      data={[{ value: diasFiltrados, fill: PALETA[1] }]}
                      startAngle={0}
                      endAngle={360}
                      innerRadius={35}
                      outerRadius={50}
                    >
                      <PolarGrid gridType="circle" radialLines={false} stroke="none" />
                      <RadialBar dataKey="value" background cornerRadius={10} />
                      <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                          content={(props: any) => {
                            const { cx, cy } = props.viewBox as { cx: number; cy: number };
                            return (
                              <text
                                x={cx}
                                y={cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-lg font-bold text-gray-900"
                              >
                                {diasFiltrados}
                              </text>
                            );
                          }}
                        />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </div>
                </motion.div>
                <motion.div
                  key="puestosTop"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow h-[220px] md:col-span-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-500">Mayor Novedades</h3>
                    <span className="p-1 bg-orange-100 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-orange-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-1 flex flex-col gap-1">
                    {porPuesto
                      .sort((a: any, b: any) => b.cantidad - a.cantidad)
                      .slice(0, 3)
                      .map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full">
                            {item.puesto}
                          </span>
                          <span className="text-gray-500">{item.cantidad} novedades</span>
                        </div>
                      ))}
                  </div>
                </motion.div>
                <motion.div
                  key="horasPico"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow h-[220px]"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-500">Horas Pico</h3>
                    <span className="p-1 bg-blue-100 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-1 flex flex-col gap-1">
                    {horasPico
                      .map((hora) => {
                        const horaNum = parseInt(hora.split(':')[0]);
                        const count = eventos.filter(
                          (e) => e.hora_novedad?.slice(0, 2) === horaNum.toString().padStart(2, '0')
                        ).length;
                        return { hora, count };
                      })
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 3)
                      .map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
                            {item.hora}
                          </span>
                          <span className="text-gray-500">{item.count} novedades</span>
                        </div>
                      ))}
                  </div>
                </motion.div>
              </>
            )
          )
        }
        graficos={
          loadingZona ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-[340px] flex flex-col"
                >
                  <Skeleton className="h-5 w-1/3 mb-4" />
                  <div className="flex-1 flex items-end gap-2">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <Skeleton key={j} className="w-4 h-[60%] md:h-[80%] rounded" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-full mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {[
                <GraficoCard
                  key="novedadesPorTipo"
                  titulo="Novedades por Tipo de Negocio"
                  descripcion="Comparativo de novedades entre los diferentes tipos de negocio"
                  datos={{
                    labels: dataPorNegocio.map((u) => u.nombre_unidad),
                    datasets: [
                      {
                        label: 'Novedades',
                        data: dataPorNegocio.map((u) => u.cantidad),
                        backgroundColor: PALETA[0],
                        borderRadius: 4,
                      },
                    ],
                  }}
                  opciones={{
                    onClick: (_: unknown, elements: { index: number }[]) => {
                      if (elements.length === 0) return;
                      const index = elements[0].index;
                      const unidad = dataPorNegocio[index]?.nombre_unidad;
                      const filtered = eventosFiltrados.filter(
                        (e) => e.unidad_negocio?.toUpperCase().trim() === unidad
                      );
                      setModalData({
                        show: true,
                        title: `Eventos en ${unidad}`,
                        data: filtered,
                      });
                    },
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                      y: {
                        beginAtZero: true,
                        suggestedMax:
                          dataPorNegocio.length > 0
                            ? Math.max(...dataPorNegocio.map((u) => u.cantidad || 0)) * 1.3
                            : 10,
                      },
                    },
                  }}
                />,
                <GraficoCard
                  key="novedadesPorTipo"
                  titulo="Novedades por Tipo de Evento"
                  descripcion="Distribución de novedades según su tipo"
                  datos={{
                    labels: tiposNovedad,
                    datasets: [
                      {
                        label: 'Novedades',
                        data: eventosPorTipo,
                        backgroundColor: PALETA[0],
                        borderRadius: 4,
                      },
                    ],
                  }}
                  opciones={{
                    onClick: (_: unknown, elements: { index: number }[]) => {
                      if (elements.length === 0) return;
                      const tipo = tiposNovedad[elements[0].index]?.toUpperCase().trim();
                      const filtered = eventosFiltrados.filter(
                        (e) => e.tipo_novedad?.toUpperCase().trim() === tipo
                      );
                      setModalData({
                        show: true,
                        title: `Eventos de tipo ${tipo}`,
                        data: filtered,
                      });
                    },
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 90,
                          minRotation: 90,
                        },
                      },
                      y: {
                        beginAtZero: true,
                        suggestedMax: eventosPorTipo.length > 0 ? Math.max(...eventosPorTipo) * 1.3 : 10,
                      },
                    },
                  }}
                />,
                <GraficoCard
                  key="novedadesPorMes"
                  titulo="Novedades por Mes"
                  descripcion={`Cantidad de novedades registradas en cada mes del año ${añoMeses}`}
                  filtros={
                    <div className="flex items-center gap-2 mb-2">
                      <label htmlFor="añoMeses" className="text-sm font-medium">
                        Año:
                      </label>
                      <select
                        id="añoMeses"
                        value={añoMeses}
                        onChange={(e) => setAñoMeses(Number(e.target.value))}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        {añosDisponibles.map((año) => (
                          <option key={año} value={año}>
                            {año}
                          </option>
                        ))}
                      </select>
                    </div>
                  }
                  datos={{
                    labels: [
                      'Enero',
                      'Febrero',
                      'Marzo',
                      'Abril',
                      'Mayo',
                      'Junio',
                      'Julio',
                      'Agosto',
                      'Septiembre',
                      'Octubre',
                      'Noviembre',
                      'Diciembre',
                    ],
                    datasets: [
                      {
                        label: 'Novedades',
                        data: novedadesPorMesAño,
                        backgroundColor: '#1A4A96',
                        borderRadius: 4,
                      },
                    ],
                  }}
                  opciones={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        suggestedMax:
                          novedadesPorMesAño.length > 0 ? Math.max(...novedadesPorMesAño) * 1.3 : 10,
                      },
                    },
                    onClick: async (_: unknown, elements: { index: number }[]) => {
                      if (elements.length === 0) return;
                      const mesIndex = elements[0].index;
                      const año = añoMeses;
                      // Fetch directo a la API para obtener los eventos del mes/año/sede/negocio seleccionados
                      const mesStr = (mesIndex + 1).toString().padStart(2, '0');
                      const desde = `${año}-${mesStr}-01`;
                      const hasta = `${año}-${mesStr}-${new Date(año, mesIndex + 1, 0).getDate()}`;
                      const params = new URLSearchParams({ id_negocio: id_negocio.toString(), desde, hasta });
                      if (unidadSeleccionada) params.append('id_unidad', unidadSeleccionada.toString());
                      if (puestoSeleccionado) params.append('id_puesto', puestoSeleccionado.toString());
                      try {
                        const res = await fetch(`/api/novedades/estadisticas-generales?${params.toString()}`);
                        if (!res.ok) throw new Error('Error al cargar eventos');
                        const json = await res.json();
                        const eventosMes = json.eventos || [];
                        setModalData({
                          show: true,
                          title: `Novedades de ${[
                            'Enero',
                            'Febrero',
                            'Marzo',
                            'Abril',
                            'Mayo',
                            'Junio',
                            'Julio',
                            'Agosto',
                            'Septiembre',
                            'Octubre',
                            'Noviembre',
                            'Diciembre',
                          ][mesIndex]} ${año}`,
                          data: eventosMes,
                        });
                      } catch (error) {
                        setModalData({
                          show: true,
                          title: `Novedades de ${[
                            'Enero',
                            'Febrero',
                            'Marzo',
                            'Abril',
                            'Mayo',
                            'Junio',
                            'Julio',
                            'Agosto',
                            'Septiembre',
                            'Octubre',
                            'Noviembre',
                            'Diciembre',
                          ][mesIndex]} ${año}`,
                          data: [],
                        });
                      }
                    },
                  }}
                />,
                <GraficoCard
                  key="novedadesPorPuesto"
                  titulo="Novedades por Puesto"
                  descripcion="Comparativo de novedades por puesto en la zona y periodo seleccionados"
                  datos={{
                    labels: porPuesto
                      .map((s: any) => s.puesto)
                      .filter((nombrePuesto: string) =>
                        eventosFiltrados.some(
                          (e) => e.puesto?.toUpperCase().trim() === nombrePuesto?.toUpperCase().trim()
                        )
                      ),
                    datasets: [
                      {
                        label: 'Novedades',
                        data: porPuesto
                          .filter((s: any) =>
                            eventosFiltrados.some(
                              (e) => e.puesto?.toUpperCase().trim() === s.puesto?.toUpperCase().trim()
                            )
                          )
                          .map((s: any) => s.cantidad),
                        backgroundColor: porPuesto
                          .filter((s: any) =>
                            eventosFiltrados.some(
                              (e) => e.puesto?.toUpperCase().trim() === s.puesto?.toUpperCase().trim()
                            )
                          )
                          .map((_: any, index: number) => PALETA[index % PALETA.length]),
                        borderRadius: 4,
                      },
                    ],
                  }}
                  opciones={{
                    onClick: (_: unknown, elements: { index: number }[]) => {
                      if (elements.length === 0) return;
                      const index = elements[0].index;
                      const puestosFiltrados = porPuesto
                        .map((s: any) => s.puesto)
                        .filter((nombrePuesto: string) =>
                          eventosFiltrados.some(
                            (e) => e.puesto?.toUpperCase().trim() === nombrePuesto?.toUpperCase().trim()
                          )
                        );
                      const puestoSeleccionado = puestosFiltrados[index]?.toUpperCase().trim();
                      const filtered = filtrarUnicosPorId(
                        eventosFiltrados.filter((e) => e.puesto?.toUpperCase().trim() === puestoSeleccionado)
                      );
                      setModalData({
                        show: true,
                        title: `Eventos en ${puestoSeleccionado}`,
                        data: filtered,
                      });
                    },
                    scales: {
                      x: {
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                      y: {
                        beginAtZero: true,
                        suggestedMax:
                          porPuesto.length > 0 ? Math.max(...porPuesto.map((s: any) => s.cantidad || 0)) * 1.3 : 10,
                      },
                    },
                  }}
                />
              ].map((grafico, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 + idx * 0.1 }}
                >
                  {grafico}
                </motion.div>
              ))}
            </>
          )
        }
      />

      {loadingZona ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-[340px] mt-4 flex flex-col">
          <Skeleton className="h-5 w-1/3 mb-4" />
          <div className="flex-1 flex items-end gap-2">
            {Array.from({ length: 12 }).map((_, j) => (
              <Skeleton key={j} className="w-4 h-[60%] md:h-[80%] rounded" />
            ))}
          </div>
          <Skeleton className="h-4 w-full mt-4" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <DistribucionHorariaNovedades
            eventos={eventosFiltrados}
            onBarClick={(hora, tipo) => {
              const eventosHora = eventosFiltrados.filter((e) =>
                e.hora_novedad?.slice(0, 2) === hora && (!tipo || e.tipo_novedad === tipo)
              );
              setModalData({
                show: true,
                title: tipo ? `Novedades de tipo ${tipo} a las ${hora}:00` : `Novedades a las ${hora}:00`,
                data: eventosHora,
              });
            }}
            onCellClick={(hora, tipo) => {
              const eventosCelda = eventosFiltrados.filter(
                (e) => e.hora_novedad?.slice(0, 2) === hora && e.tipo_novedad === tipo
              );
              setModalData({
                show: true,
                title: `Novedades de tipo ${tipo} a las ${hora}:00`,
                data: eventosCelda,
              });
            }}
          />
        </motion.div>
      )}

      <Dialog open={modalData.show} onOpenChange={closeModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalData.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            {modalData.data.length === 0 ? (
              <p className="text-gray-500 text-center">No hay eventos para mostrar</p>
            ) : (
              modalData.data.map((evento, idx) => (
                <div
                  key={`${evento.id_novedad}-${idx}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <h2 className="text-2xl font-bold mb-6">
                    {(evento.puesto || '??')} - {evento.tipo_novedad}
                  </h2>
                  {evento.archivos && evento.archivos.length > 0 && (
                    <div className="mb-6">
                      <div className="flex gap-4 overflow-x-auto pb-4">
                        {evento.archivos.map((archivo, index) => (
                          <img
                            key={index}
                            src={archivo.url_archivo}
                            alt={`Evidencia ${index + 1}`}
                            className="h-[300px] w-auto object-cover rounded-lg"
                            onError={() => console.error(`Error cargando imagen: ${archivo.url_archivo}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                    <div className="flex gap-8 text-sm text-gray-600">
                      <p>Fecha: {formatearFecha(evento.fecha_novedad)}</p>
                      <p>Hora: {evento.hora_novedad || 'N/A'}</p>
                      <p>Consecutivo: {evento.consecutivo}</p>
                    </div>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 text-base leading-relaxed">
                        <strong>Novedad:</strong> {evento.descripcion || 'Sin descripción'}
                      </p>
                      {evento.gestion && (
                        <p className="text-gray-700 text-base leading-relaxed mt-4">
                          <strong>Gestión:</strong> {evento.gestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}