import React, { useEffect, useState } from 'react';
import { GraficoCard } from '@/components/novedades/GraficoCard';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart as BarChartIcon, Flame as HeatmapIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  LineChart,
  Line,
} from 'recharts';

const PALETA = [
  '#9966CC', '#00AFA3', '#1A4A96', '#FF6B6B', '#4CAF50', '#FFA726', '#7E57C2', '#26A69A', '#EF5350', '#66BB6A', '#FFEE58', '#5C6BC0',
];

export default function EstadisticasGeneralesTodos() {
  // ESTADO PARA GENERALES
  const [generalesData, setGeneralesData] = useState<any>(null);
  const [loadingGenerales, setLoadingGenerales] = useState(false);
  // Filtros de fecha para GENERALES (por defecto últimos 7 días)
  const [fechaDesde, setFechaDesde] = useState(() => {
    const hoy = new Date();
    const hace7 = new Date(hoy);
    hace7.setDate(hoy.getDate() - 6);
    return hace7.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [modalNegociosOpen, setModalNegociosOpen] = useState(false);
  const [negociosDeTipo, setNegociosDeTipo] = useState<{ nombre: string, id: number, cantidad: number }[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeneralesData = async () => {
      setLoadingGenerales(true);
      try {
        const res = await fetch(`/api/novedades/estadisticas-generales-todos?desde=${fechaDesde}&hasta=${fechaHasta}`);
        const data = await res.json();
        setGeneralesData(data);
      } catch (error) {
        console.error('Error cargando estadísticas generales:', error);
        setGeneralesData(null);
      } finally {
        setLoadingGenerales(false);
      }
    };
    
    fetchGeneralesData();
  }, [fechaDesde, fechaHasta]);

  const labelsMeses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  // Novedades por Negocio
  const datosPorNegocio = generalesData?.porNegocio || [];
  const graficoPorNegocio = {
    labels: datosPorNegocio.map((n: any) => n.negocio),
    datasets: [{
      label: 'Novedades',
      data: datosPorNegocio.map((n: any) => n.cantidad),
      backgroundColor: PALETA[0],
      borderRadius: 4,
    }],
  };
  // Novedades por Tipo de Evento
  const datosPorTipo = generalesData?.porTipo || [];
  const graficoPorTipo = {
    labels: datosPorTipo.map((t: any) => t.tipo),
    datasets: [{
      label: 'Novedades',
      data: datosPorTipo.map((t: any) => t.cantidad),
      backgroundColor: PALETA[1],
      borderRadius: 4,
    }],
  };
  // Novedades por Mes
  const datosPorMes = generalesData?.porMes || [];
  const graficoPorMes = {
    labels: labelsMeses,
    datasets: [{
      label: 'Novedades',
      data: labelsMeses.map((_, i) => {
        const found = datosPorMes.find((m: any) => m.mes === i + 1);
        return found ? found.cantidad : 0;
      }),
      backgroundColor: PALETA[2],
      borderRadius: 4,
    }],
  };
  // Novedades por Unidad de Negocio
  const datosPorUnidad = generalesData?.porUnidad || [];
  const graficoPorUnidad = {
    labels: datosPorUnidad.map((u: any) => u.unidad),
    datasets: [{
      label: 'Novedades',
      data: datosPorUnidad.map((u: any) => u.cantidad),
      backgroundColor: PALETA[3],
      borderRadius: 4,
    }],
  };
  // Distribución Horaria de Novedades (por tipo)
  const eventosGenerales = generalesData?.eventos || [];
  const horasGenerales = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const tiposGenerales: string[] = Array.from(new Set(eventosGenerales.map((e: any) => e.tipo_novedad)));
  const dataDistribucion = {
    labels: horasGenerales,
    datasets: tiposGenerales.map((tipo: string, idx: number) => ({
      label: tipo,
      data: horasGenerales.map(hora => eventosGenerales.filter((e: any) => e.hora_novedad?.slice(0,2) === hora && e.tipo_novedad === tipo).length),
      backgroundColor: PALETA[idx % PALETA.length],
      stack: 'a',
      borderRadius: 2,
    })),
  };

  // Función para manejar el click en la barra de "Novedades por Tipo de Evento"
  const handleBarTipoClick = (_: any, index: number) => {
    const tipo = graficoPorTipo.labels[index];
    setTipoSeleccionado(tipo);
    // Filtra los eventos de ese tipo
    const eventosTipo = eventosGenerales.filter((e: any) => e.tipo_novedad === tipo);
    // Obtén negocios únicos con su id y cantidad de novedades
    const negociosMap = new Map<string, { nombre: string; id: number; cantidad: number }>();
    eventosTipo.forEach((e: any) => {
      if (e.nombre_negocio && e.id_negocio) {
        if (!negociosMap.has(e.nombre_negocio)) {
          negociosMap.set(e.nombre_negocio, { nombre: e.nombre_negocio, id: e.id_negocio, cantidad: 1 });
        } else {
          negociosMap.get(e.nombre_negocio)!.cantidad++;
        }
      }
    });
    const negociosUnicos = Array.from(negociosMap.values());
    setNegociosDeTipo(negociosUnicos as { nombre: string; id: number; cantidad: number }[]);
    setModalNegociosOpen(true);
  };

  const nombreOperacion = process.env.NEXT_PUBLIC_OPERACION || "";

  return (
    <div className="h-[90dvh] overflow-y-auto bg-gray-50 w-full">
      <div className="w-full px-0 py-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0 px-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estadísticas Generales - {nombreOperacion}</h1>
            <p className="mt-2 text-sm text-gray-600">Visualización y análisis de novedades por período</p>
          </div>
        </div>
        {/* Filtros de fecha dinámicos */}
        <div className="px-6 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
            <label htmlFor="fechaDesde" className="text-sm font-medium">Fecha inicio:</label>
            <input
              id="fechaDesde"
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={fechaDesde}
              max={fechaHasta}
              onChange={e => setFechaDesde(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
            <label htmlFor="fechaHasta" className="text-sm font-medium">Fecha fin:</label>
            <input
              id="fechaHasta"
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={fechaHasta}
              min={fechaDesde}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setFechaHasta(e.target.value)}
            />
          </div>
        </div>
        {/* Charts Section */}
        <div className="space-y-8 px-6">
          {/* Gráficos: uno por fila */}
          <div className="flex flex-col gap-8">
            <GraficoCard
              titulo="Novedades por Negocio"
              descripcion="Cantidad de novedades registradas por cada negocio."
              datos={{
                ...graficoPorNegocio,
                datasets: [{
                  ...graficoPorNegocio.datasets[0],
                  backgroundColor: graficoPorNegocio.labels.map((_: any, i: number) => PALETA[i % PALETA.length]) as any,
                }],
              }}
              loading={loadingGenerales}  
              opciones={{
                scales: {
                  x: {
                    ticks: {
                      minRotation: 90,
                      maxRotation: 90,
                      align: 'center',
                    },
                  },
                  y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(...graficoPorNegocio.datasets[0].data, 1) * 1.3,
                  },
                },
                onClick: (event: any, elements: any[]) => {
                  if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const negocio = datosPorNegocio[index];
                    if (negocio) {
                      const event = new CustomEvent('seleccionarNegocioGeneral', { detail: { id: negocio.id_negocio, nombre: negocio.negocio } });
                      window.dispatchEvent(event);
                    }
                  }
                }
              }}
            />
            <GraficoCard
              titulo="Novedades por Tipo de Evento"
              descripcion="Cantidad de novedades agrupadas por tipo de evento."
              datos={{
                ...graficoPorTipo,
                datasets: [{
                  ...graficoPorTipo.datasets[0],
                  backgroundColor: graficoPorTipo.labels.map((_: any, i: number) => PALETA[i % PALETA.length]) as any,
                }],
              }}
              loading={loadingGenerales}
              opciones={{
                scales: {
                  x: {
                    ticks: {
                      minRotation: 90,
                      maxRotation: 90,
                      align: 'center',
                    },
                  },
                  y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(...graficoPorTipo.datasets[0].data, 1) * 1.3,
                  },
                },
                onClick: (event: any, elements: any[]) => {
                  if (elements && elements.length > 0) {
                    handleBarTipoClick(event, elements[0].index);
                  }
                }
              }}
            />
            <GraficoCard
              titulo="Novedades por Mes"
              descripcion="Cantidad de novedades registradas en cada mes del periodo."
              datos={{
                ...graficoPorMes,
                datasets: [{
                  ...graficoPorMes.datasets[0],
                  backgroundColor: graficoPorMes.labels.map((_: any, i: number) => PALETA[i % PALETA.length]) as any,
                }],
              }}
              loading={loadingGenerales}
              opciones={{
                scales: {
                  x: {
                    ticks: {
                      minRotation: 90,
                      maxRotation: 90,
                      align: 'center',
                    },
                  },
                  y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(...graficoPorMes.datasets[0].data, 1) * 1.3,
                  },
                },
              }}
            />
          </div>
          {/* Segunda fila: Distribución Horaria */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <DistribucionHorariaNovedadesGenerales
              eventos={eventosGenerales}
              onBarClick={(hora, tipo) => {
                const eventosHora = eventosGenerales.filter((e: any) =>
                  e.hora_novedad?.slice(0, 2) === hora && (!tipo || e.tipo_novedad === tipo)
                );
              }}
              onCellClick={(hora, tipo) => {
                const eventosCelda = eventosGenerales.filter(
                  (e: any) => e.hora_novedad?.slice(0, 2) === hora && e.tipo_novedad === tipo
                );
              }}
            />
          </motion.div>
        </div>
      </div>
      {/* MODAL de negocios por tipo de evento */}
      {modalNegociosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              Negocios con novedades de tipo
              <span className="text-blue-700 ml-1">{tipoSeleccionado}</span>
            </h2>
            <ul className="divide-y divide-gray-100 mb-2">
              {negociosDeTipo.map((negocio) => (
                <li key={negocio.id} className="py-2 flex items-center justify-between group">
                  <button
                    className="flex-1 text-left px-4 py-2 rounded-lg hover:bg-blue-50 transition font-medium text-gray-800 group-hover:text-blue-700"
                    onClick={() => {
                      const event = new CustomEvent('seleccionarNegocioGeneral', { detail: { id: negocio.id, nombre: negocio.nombre } });
                      window.dispatchEvent(event);
                      setModalNegociosOpen(false);
                    }}
                  >
                    {negocio.nombre}
                  </button>
                  <span className="ml-4 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shadow-sm">
                    {negocio.cantidad} novedad{negocio.cantidad !== 1 ? 'es' : ''}
                  </span>
                </li>
              ))}
            </ul>
            <button
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold text-gray-700 w-full"
              onClick={() => setModalNegociosOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DistribucionHorariaNovedadesGenerales({ eventos, onBarClick, onCellClick }: { eventos: any[]; onBarClick: (hora: string, tipo?: string) => void; onCellClick: (hora: string, tipo: string) => void; }) {
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