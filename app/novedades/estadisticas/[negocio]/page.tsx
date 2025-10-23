'use client'
import React from "react";
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar, Line } from 'react-chartjs-2'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Fragment } from "react";
import EstadisticasGeneralesPage from '@/components/novedades/EstadisticasGenerales';
import { useRef } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  PointElement,
  LineElement
)

interface Evento {
  id_novedad: number
  consecutivo: string
  fecha_novedad: string
  hora_novedad: string
  descripcion: string
  gestion: string
  tipo_novedad: string
  nivel_criticidad: string
  puesto: string
  unidad_negocio: string
  archivos: { url_archivo: string }[]
}

interface Negocio {
  id_negocio: number
  nombre_negocio: string
}

interface Puesto {
  id_puesto: number
  nombre_puesto: string
  id_unidad?: number
}

interface EventosPorAño {
  2024: number[]
  2025: number[]
}

interface EventosPorMes {
  [key: string]: EventosPorAño
}

interface EventosPorPuesto {
  puesto: string
  2024: number
  2025: number
  ids: {
    2024: number[]
    2025: number[]
  }
}

const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


export default function EstadisticasPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams() // <-- AÑADIDO: obtener parámetros de la URL
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<{ id: number, nombre: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventosPuesto, setEventosPuesto] = useState<Evento[]>([])
  const [eventosPorMes, setEventosPorMes] = useState<EventosPorMes>({})
  const [eventosPorPuesto, setEventosPorPuesto] = useState<EventosPorPuesto[]>([])
  const [eventosDetalle, setEventosDetalle] = useState<{ [key: string]: { cantidad: number, ids: number[] } }>({})
  const [mesSeleccionado, setMesSeleccionado] = useState<{ mes: string, año: number } | null>(null)
  const [puestoSeleccionado, setPuestoSeleccionado] = useState<{ puesto: string, año: number } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [eventosSeleccionados, setEventosSeleccionados] = useState<Evento[]>([])
  const [vistaActual, setVistaActual] = useState<'generales' | 'comparativa' | 'puestos'>('generales')

  const [eventosPorPuestoDetalle, setEventosPorPuestoDetalle] = useState<{ [key: string]: { cantidad: number, ids: number[] } }>({})
  const [resumenSedes, setResumenSedes] = useState<any[]>([])
  const [tipoGraficoComparativa, setTipoGraficoComparativa] = useState<'comparativa' | 'tendencia'>('comparativa');
  const [tipoGraficoSedes, setTipoGraficoSedes] = useState<'comparativa' | 'tendencia'>('tendencia');
  const scrollTabsRef = useRef<HTMLDivElement>(null);

  // Estados para los años a comparar
  const currentYear = new Date().getFullYear()
  const [año1, setAño1] = useState<number>(currentYear)
  const [año2, setAño2] = useState<number>(currentYear - 1)

  // 1. Agrega nuevos estados:
  const [unidades, setUnidades] = useState<{ id_unidad_negocio: number, nombre_unidad_negocio: string }[]>([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<{ id: number, nombre: string } | null>(null);

  // NUEVO: Estados para los datos de reportes-puesto
  const [porPuesto, setPorPuesto] = useState<any[]>([]);
  const [porMes, setPorMes] = useState<any[]>([]);
  const [porTipo, setPorTipo] = useState<any[]>([]);
  const [totales, setTotales] = useState<any[]>([]);

  // Obtener años únicos de los eventos
  const añosDisponibles = Array.from(new Set(eventos.map(e => {
    if (!e.fecha_novedad) return undefined;
    return Number(e.fecha_novedad.split('T')[0].split('-')[0])
  }).filter((a): a is number => typeof a === 'number'))).sort((a, b) => b - a)

  // Datos para los gráficos generales
  const resumenPorNegocio: { [negocio: string]: { año1: number, año2: number } } = {}
  eventos.forEach(evento => {
    if (!evento.fecha_novedad) return;
    const año = Number(evento.fecha_novedad.split('T')[0].split('-')[0])
    if (!resumenPorNegocio[evento.unidad_negocio]) {
      resumenPorNegocio[evento.unidad_negocio] = { año1: 0, año2: 0 }
    }
    if (año === año1) resumenPorNegocio[evento.unidad_negocio].año1++
    if (año === año2) resumenPorNegocio[evento.unidad_negocio].año2++
  })

  const resumenPorTipo: { [tipo: string]: { año1: number, año2: number } } = {}
  eventos.forEach(evento => {
    if (!evento.fecha_novedad) return;
    const año = Number(evento.fecha_novedad.split('T')[0].split('-')[0])
    if (!resumenPorTipo[evento.tipo_novedad]) {
      resumenPorTipo[evento.tipo_novedad] = { año1: 0, año2: 0 }
    }
    if (año === año1) resumenPorTipo[evento.tipo_novedad].año1++
    if (año === año2) resumenPorTipo[evento.tipo_novedad].año2++
  })
  const dataTipo = {
    labels: Object.keys(resumenPorTipo),
    datasets: [
      {
        label: `Año ${año1}`,
        data: Object.values(resumenPorTipo).map(t => t.año1),
        backgroundColor: 'purple'
      },
      {
        label: `Año ${año2}`,
        data: Object.values(resumenPorTipo).map(t => t.año2),
        backgroundColor: 'gray'
      }
    ]
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchNegocios = async () => {
      try {
        const response = await fetch('/api/negocios')
        if (!response.ok) throw new Error('Error al cargar negocios')
        const data = await response.json()
        // --- NUEVO: Filtrar negocios por IDs de la URL ---
        let negociosFiltrados = data;
        const idsNegocio: number[] = params.negocio
          ? String(params.negocio).split('-').map((id: string) => Number(id)).filter((id: number) => !isNaN(id))
          : [];
        if (idsNegocio.length > 0) {
          negociosFiltrados = data.filter((n: any) => idsNegocio.includes(n.id_negocio));
        }
        setNegocios(negociosFiltrados)
        if (negociosFiltrados.length > 0) {
          setNegocioSeleccionado({ id: negociosFiltrados[0].id_negocio, nombre: negociosFiltrados[0].nombre_negocio })
        }
      } catch (error) {
        // Error al cargar negocios
        toast.error("No se pudieron cargar los negocios")
      }
    }
    fetchNegocios()
  }, [params.negocio])

  // 2. Cuando cambia negocioSeleccionado, carga las unidades de negocio:
  useEffect(() => {
    if (!negocioSeleccionado) return;
    const fetchUnidades = async () => {
      try {
        const response = await fetch(`/api/novedades/unidades-negocio?id_negocio=${negocioSeleccionado.id}`);
        if (!response.ok) throw new Error('Error al cargar unidades de negocio');
        const data = await response.json();
        setUnidades(data);
        if (data.length > 0) {
          setUnidadSeleccionada({ id: data[0].id_unidad_negocio, nombre: data[0].nombre_unidad_negocio });
        } else {
          setUnidadSeleccionada(null);
        }
      } catch (error) {
        setUnidades([]);
        setUnidadSeleccionada(null);
      }
    };
    fetchUnidades();
  }, [negocioSeleccionado]);

  // 3. Cuando cambia negocioSeleccionado, carga todos los puestos de todas las unidades del negocio:
  useEffect(() => {
    if (!negocioSeleccionado) return;
    const fetchAllPuestos = async () => {
      try {
        // 1. Traer todas las unidades del negocio
        const unidadesRes = await fetch(`/api/novedades/unidades-negocio?id_negocio=${negocioSeleccionado.id}`);
        if (!unidadesRes.ok) throw new Error('Error al cargar unidades de negocio');
        const unidadesData = await unidadesRes.json();
        // 2. Traer todos los puestos de todas las unidades
        let allPuestos: Puesto[] = [];
        for (const unidad of unidadesData) {
          const puestosRes = await fetch(`/api/novedades/puestos?id_unidad=${unidad.id_unidad_negocio}`);
          if (!puestosRes.ok) continue;
          const puestosData = await puestosRes.json();
          allPuestos = allPuestos.concat(puestosData);
        }
        setPuestos(allPuestos);
        if (allPuestos.length > 0) {
          setPuestoSeleccionado({ puesto: allPuestos[0].nombre_puesto, año: currentYear });
        } else {
          setPuestoSeleccionado(null);
        }
      } catch (error) {
        setPuestos([]);
        setPuestoSeleccionado(null);
      }
    };
    fetchAllPuestos();
  }, [negocioSeleccionado]);

  // Modifica cargarEventos para requerir los tres valores:
  const cargarEventos = async () => {
    if (!negocioSeleccionado) return;
    setLoading(true);
    try {
      // Cargar datos de reportes-puesto
      const res = await fetch(`/api/novedades/reportes-puesto?id_negocio=${negocioSeleccionado.id}`);
      if (!res.ok) throw new Error('Error al cargar reportes por puesto');
      const data = await res.json();
      setPorPuesto(data.porPuesto || []);
      setPorMes(data.porMes || []);
      setPorTipo(data.porTipo || []);
      setTotales(data.totales || []);
      setResumenSedes(data.porPuesto || []);

      // Asumiendo que el endpoint devuelve los eventos detallados en data.eventos
      if (data.eventos) {
        setEventos(data.eventos);
        procesarEventos(data.eventos, data.eventos); // Procesar eventos para actualizar eventosPorMes
      } else {
        // Alternativa: Fetch eventos desde otro endpoint
        const eventosRes = await fetch(`/api/novedades/eventos?id_negocio=${negocioSeleccionado.id}`);
        if (!eventosRes.ok) throw new Error('Error al cargar eventos');
        const eventosData = await eventosRes.json();
        setEventos(eventosData);
        procesarEventos(eventosData, eventosData);
      }
    } catch (error) {
      toast.error("No se pudieron cargar los reportes por puesto o eventos")
      setPorPuesto([]);
      setPorMes([]);
      setPorTipo([]);
      setTotales([]);
      setResumenSedes([]);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };


  const procesarEventos = (eventos: Evento[], eventosPuesto: Evento[]) => {
    console.log('Eventos recibidos:', eventos); // Debugging

    const conteos: EventosPorMes = {};
    negocios.forEach(negocio => {
      conteos[negocio.nombre_negocio] = {
        2024: Array(12).fill(0),
        2025: Array(12).fill(0)
      };
    });

    const conteosPorPuesto: { [key: string]: EventosPorPuesto } = {};

    // Procesar eventos para la vista comparativa
    eventos.forEach(evento => {
      if (!evento.fecha_novedad) {
        console.warn('Evento sin fecha_novedad:', evento); // Debugging
        return;
      }

      const [año, mes, dia] = evento.fecha_novedad.split('T')[0].split('-').map(Number);
      if (!año || !mes || !dia) {
        console.warn('Fecha inválida en evento:', evento); // Debugging
        return;
      }

      if (año === 2024 || año === 2025) {
        const negocio = evento.unidad_negocio;
        const mesIndex = mes - 1;
        if (conteos[negocio]) {
          conteos[negocio][año][mesIndex]++;
        }
      }
    });

    // Procesar eventos por puesto
    eventosPuesto.forEach(evento => {
      if (!evento.fecha_novedad) {
        console.warn('Evento puesto sin fecha_novedad:', evento); // Debugging
        return;
      }

      const [año, mes, dia] = evento.fecha_novedad.split('T')[0].split('-').map(Number);
      if (!año || !mes || !dia) {
        console.warn('Fecha inválida en evento puesto:', evento); // Debugging
        return;
      }

      if (año === 2024 || año === 2025) {
        const negocio = evento.unidad_negocio;
        if (negocio === negocioSeleccionado?.nombre) {
          if (!conteosPorPuesto[evento.puesto]) {
            conteosPorPuesto[evento.puesto] = {
              puesto: evento.puesto,
              2024: 0,
              2025: 0,
              ids: {
                2024: [],
                2025: []
              }
            };
          }
          conteosPorPuesto[evento.puesto][año]++;
          conteosPorPuesto[evento.puesto].ids[año].push(evento.id_novedad);
        }
      }
    });

    console.log('Conteos por mes:', conteos); // Debugging
    console.log('Conteos por puesto:', conteosPorPuesto); // Debugging
    setEventosPorMes(conteos);
    setEventosPorPuesto(Object.values(conteosPorPuesto));
  };

  // Ahora solo actualiza el estado mesSeleccionado
  const mostrarDetallesEventos = (mes: string, año: number) => {
    setMesSeleccionado({ mes, año });
  };

  // Nuevo useEffect para cargar los detalles solo cuando cambia mesSeleccionado
  useEffect(() => {
    const fetchDetalles = async () => {
      if (!mesSeleccionado || !negocioSeleccionado?.id) {
      setEventosDetalle({});
        setEventosSeleccionados([]);
      return;
    }
      // Calcular primer y último día del mes
      const mesIndex = meses.indexOf(mesSeleccionado.mes) + 1;
      const desde = `${mesSeleccionado.año}-${mesIndex.toString().padStart(2, '0')}-01`;
      const ultimoDia = new Date(mesSeleccionado.año, mesIndex, 0).getDate();
      const hasta = `${mesSeleccionado.año}-${mesIndex.toString().padStart(2, '0')}-${ultimoDia}`;
      try {
        const res = await fetch(`/api/novedades/estadisticas-generales?id_negocio=${negocioSeleccionado.id}&desde=${desde}&hasta=${hasta}`);
        if (!res.ok) throw new Error('Error al obtener eventos detallados');
        const data = await res.json();
        // Agrupar eventos por tipo para los cards
    const conteoEventos: { [key: string]: { cantidad: number, ids: number[] } } = {};
        (data.eventos || []).forEach((evento: any) => {
      const key = `${evento.tipo_novedad}`;
      if (!conteoEventos[key]) {
        conteoEventos[key] = { cantidad: 0, ids: [] };
      }
      conteoEventos[key].cantidad++;
      conteoEventos[key].ids.push(evento.id_novedad);
    });
    setEventosDetalle(conteoEventos);
        setEventosSeleccionados(data.eventos || []);
      } catch (error) {
        setEventosDetalle({});
        setEventosSeleccionados([]);
      }
  };
    fetchDetalles();
  }, [mesSeleccionado, negocioSeleccionado]);
 

  const mostrarEventosPorPuesto = (puesto: string, año: number) => {
    if (año === 2024 && eventosPorPuesto.find(p => p.puesto === puesto)?.[2024] === 0) return
    if (año === 2025 && eventosPorPuesto.find(p => p.puesto === puesto)?.[2025] === 0) return

    setPuestoSeleccionado({ puesto, año })

    // Filtrar eventos por puesto y año
    const eventosDelPuesto = eventos.filter(evento => {
      if (!evento.fecha_novedad) return false;
      const [eventoAño] = evento.fecha_novedad.split('T')[0].split('-').map(Number)
      return evento.puesto === puesto && eventoAño === año
    })

    // Agrupar eventos por tipo
    const conteoEventos: { [key: string]: { cantidad: number, ids: number[] } } = {}
    eventosDelPuesto.forEach(evento => {
      const key = `${evento.tipo_novedad}`
      if (!conteoEventos[key]) {
        conteoEventos[key] = { cantidad: 0, ids: [] }
      }
      conteoEventos[key].cantidad++
      conteoEventos[key].ids.push(evento.id_novedad)
    })

    setEventosPorPuestoDetalle(conteoEventos)
    setEventosSeleccionados(eventosDelPuesto)
  }

  useEffect(() => {
    if (mesSeleccionado) {
      mostrarDetallesEventos(mesSeleccionado.mes, mesSeleccionado.año)
    } else {
      setEventosDetalle({})
    }
  }, [negocioSeleccionado])

  // Modifica el useEffect para cargar eventos solo si hay negocio seleccionado:
  useEffect(() => {
    if (negocioSeleccionado) {
      cargarEventos();
    }
  }, [negocioSeleccionado]);

  // --- DATOS PARA TABLAS Y GRÁFICOS ---
  // Para la tabla de comparativa de eventos por mes
  const chartData = {
    labels: meses,
    datasets: [
      {
        label: 'Eventos 2024',
        data: meses.map((_, i) => {
          const found = porMes.find((m: any) => m.anio === 2024 && m.mes === i + 1);
          return found ? found.cantidad : 0;
        }),
        backgroundColor: 'darkblue',
        borderColor: 'darkblue',
        borderWidth: 1
      },
      {
        label: 'Eventos 2025',
        data: meses.map((_, i) => {
          const found = porMes.find((m: any) => m.anio === 2025 && m.mes === i + 1);
          return found ? found.cantidad : 0;
        }),
        backgroundColor: 'lightgreen',
        borderColor: 'lightgreen',
        borderWidth: 1
      }
    ]
  }

  // Para la tabla de eventos por puestos
  const puestosLabels = puestos.map(p => p.nombre_puesto);
  // Si no hay puestos cargados, usar los del backend
  const puestosFromBackend = Array.from(new Set((porPuesto || []).map((p: any) => p.puesto)));
  const puestosLabelsFinal = puestosLabels.length > 0 ? puestosLabels : puestosFromBackend;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Eventos',
          font: {
            size: 10
          }
        },
        ticks: {
          font: {
            size: 9
          }
        },
        suggestedMax: function (context: any) {
          const max = context.chart.data.datasets.reduce((max: number, dataset: any) => {
            return Math.max(max, Math.max(...dataset.data));
          }, 0);
          return Math.ceil(max * 1.2);
        }
      },
      x: {
        title: {
          display: true,
          text: vistaActual === 'puestos' ? 'Puestos' : 'Meses',
          font: {
            size: 10
          }
        },
        ticks: {
          font: {
            size: 9
          },
          minRotation: 45,
          maxRotation: 45,
          align: 'center' as const
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.raw}`
          }
        },
        titleFont: {
          size: 11
        },
        bodyFont: {
          size: 10
        }
      },
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 15,
          padding: 10,
          font: {
            size: 10
          }
        }
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'top' as const,
        formatter: (value: number) => value || '',
        font: {
          weight: 'bold' as const,
          size: 8
        },
        color: '#333',
        display: (context: any) => context.dataset.data[context.dataIndex] > 0,
        padding: {
          top: 4
        }
      }
    }
  }

  const mostrarEventosSeleccionados = (tipo: string) => {
    if (!mesSeleccionado || !eventosDetalle[tipo]) return

    const eventosDelTipo = eventos.filter(evento =>
      eventosDetalle[tipo].ids.includes(evento.id_novedad)
    )

    setEventosSeleccionados(eventosDelTipo)
    setShowModal(true)
  }

  // 1. Obtener lista de puestos para el eje X (ya definido como puestosLabelsFinal)

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = scrollTabsRef.current;
    if (!el) return;
    const scrollAmount = 200;
    if (dir === 'left') {
      el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // --- Buscador de negocios ---
  const [busquedaNegocio, setBusquedaNegocio] = useState('');
  const [sugerenciasNegocio, setSugerenciasNegocio] = useState<Negocio[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  // refs para cada tab de negocio
  const negocioTabRefs = useRef<{ [id: number]: HTMLSpanElement | null }>({});

  useEffect(() => {
    if (busquedaNegocio.trim() === '') {
      setSugerenciasNegocio([]);
      setMostrarSugerencias(false);
      return;
    }
    const sugerencias = negocios.filter(n =>
      n.nombre_negocio.toLowerCase().includes(busquedaNegocio.toLowerCase())
    );
    setSugerenciasNegocio(sugerencias);
    setMostrarSugerencias(sugerencias.length > 0);
  }, [busquedaNegocio, negocios]);

  const seleccionarNegocioBusqueda = (negocio: Negocio) => {
    setNegocioSeleccionado({ id: negocio.id_negocio, nombre: negocio.nombre_negocio });
    setBusquedaNegocio('');
    setMostrarSugerencias(false);
    // Centrar el tab seleccionado si existe
    setTimeout(() => {
      const tabEl = negocioTabRefs.current[negocio.id_negocio];
      if (tabEl) {
        tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 100);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto h-screen">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Menú lateral - En móvil se convierte en un menú superior */}
        <aside className="w-full lg:w-64 bg-white rounded-lg shadow p-4 mt-4 lg:mt-8">
          <h2 className="text-lg font-bold mb-4">Vistas</h2>
          <div className="flex lg:flex-col gap-2 lg:space-y-2">
            <button
              className={`flex-1 lg:w-full text-center lg:text-left px-4 py-2 rounded ${vistaActual === 'generales' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              onClick={() => setVistaActual('generales')}
            >
              Estadísticas Generales
            </button>
            <button
              className={`flex-1 lg:w-full text-center lg:text-left px-4 py-2 rounded ${vistaActual === 'comparativa' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              onClick={() => setVistaActual('comparativa')}
            >
              Comparativa de Eventos
            </button>
            <button
              className={`flex-1 lg:w-full text-center lg:text-left px-4 py-2 rounded ${vistaActual === 'puestos' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              onClick={() => setVistaActual('puestos')}
            >
              Eventos por Puestos
            </button>
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 h-full pt-4 lg:pt-8">
          {/* Cabecera con tabs de negocios y datos seleccionados en una sola línea, scroll horizontal y flechas */}
          <div className="header mb-4 flex items-center justify-between">
            <div className="flex items-center w-full">
              {/* Buscador de negocios */}
              <div className="relative mr-2 min-w-[180px] max-w-[260px]">
                <input
                  type="text"
                  className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Buscar negocio..."
                  value={busquedaNegocio}
                  onChange={e => setBusquedaNegocio(e.target.value)}
                  onFocus={() => setMostrarSugerencias(sugerenciasNegocio.length > 0)}
                  onBlur={() => setTimeout(() => setMostrarSugerencias(false), 120)}
                />
                {mostrarSugerencias && (
                  <ul className="absolute z-10 bg-white border border-gray-200 rounded shadow w-full mt-1 max-h-48 overflow-y-auto">
                    {sugerenciasNegocio.map(n => (
                      <li
                        key={n.id_negocio}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-sm"
                        onMouseDown={() => seleccionarNegocioBusqueda(n)}
                      >
                        {n.nombre_negocio}
                      </li>
                    ))}
                    {sugerenciasNegocio.length === 0 && (
                      <li className="px-3 py-2 text-gray-400 text-sm">Sin resultados</li>
                    )}
                  </ul>
                )}
              </div>
              <button
                className="px-2 py-1 text-xl font-bold text-gray-500 hover:text-blue-600 focus:outline-none"
                onClick={() => scrollTabs('left')}
                aria-label="Desplazar negocios a la izquierda"
                type="button"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div
                ref={scrollTabsRef}
                className="tabs flex flex-nowrap items-center gap-0 overflow-x-auto px-2 max-w-[70dvh] scrollbar-hide"
                style={{ scrollBehavior: 'smooth', minWidth: 0 }}
              >
                {negocios.map((negocio, index) => (
                  <Fragment key={negocio.id_negocio}>
                    <span
                      ref={el => { negocioTabRefs.current[negocio.id_negocio] = el; }}
                      className={`cursor-pointer px-2 lg:px-4 font-bold whitespace-nowrap ${negocioSeleccionado?.id === negocio.id_negocio ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
                      onClick={() => setNegocioSeleccionado({ id: negocio.id_negocio, nombre: negocio.nombre_negocio })}
                    >
                      {negocio.nombre_negocio}
                    </span>
                    {index < negocios.length - 1 && (
                      <span className="mx-1 text-gray-400" key={`sep-${negocio.id_negocio}`}>|</span>
                    )}
                  </Fragment>
                ))}
              </div>
              <button
                className="px-2 py-1 text-xl font-bold text-gray-500 hover:text-blue-600 focus:outline-none"
                onClick={() => scrollTabs('right')}
                aria-label="Desplazar negocios a la derecha"
                type="button"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="flex items-center gap-4 ml-4">
              {/* Eliminado: Unidad y Puesto seleccionados */}
            </div>
          </div>
          <hr />
          {vistaActual === 'generales' && negocioSeleccionado?.id && (
            <EstadisticasGeneralesPage
              id_negocio={negocioSeleccionado.id}
              id_unidad={unidadSeleccionada?.id}
              id_puesto={puestoSeleccionado?.puesto ? puestos.find(p => p.nombre_puesto === puestoSeleccionado.puesto)?.id_puesto : undefined}
            />
          )}
          {vistaActual === 'comparativa' && (
            <Card className="p-4 lg:p-6 mt-4 h-[calc(100%-6rem)]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">Comparativa Eventos</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTipoGraficoComparativa('tendencia')}
                    className={`p-2 rounded-lg ${tipoGraficoComparativa === 'tendencia' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    title="Análisis de Tendencia"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" /></svg>
                  </button>
                  <button
                    onClick={() => setTipoGraficoComparativa('comparativa')}
                    className={`p-2 rounded-lg ${tipoGraficoComparativa === 'comparativa' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    title="Vista Comparativa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="12" width="4" height="8" /><rect x="9" y="8" width="4" height="12" /><rect x="15" y="4" width="4" height="16" /></svg>
                  </button>
                </div>
              </div>
              <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8 lg:gap-4 h-[calc(100%-3rem)] overflow-y-auto">
                <div className="max-h-[300px] lg:max-h-full">
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="flex gap-2">
                          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                          <div className="h-8 w-14 bg-gray-200 animate-pulse rounded"></div>
                          <div className="h-8 w-14 bg-gray-200 animate-pulse rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="border border-black text-sm w-full">
                      <thead className="sticky top-0">
                        <tr>
                          <th className="bg-[rgb(28,28,28)] text-white p-1 border border-black text-xs w-16">Mes</th>
                          <th className="bg-[rgb(28,28,28)] text-white p-1 border border-black text-xs w-14">2024</th>
                          <th className="bg-[rgb(28,28,28)] text-white p-1 border border-black text-xs w-14">2025</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meses.map((mes, index) => (
                          <tr key={mes}>
                            <td className="border border-black p-1 text-center text-xs">{mes}</td>
                            <td
                              className={`border border-black p-1 text-center cursor-pointer hover:bg-gray-100 text-xs ${mesSeleccionado?.mes === mes && mesSeleccionado?.año === 2024 ? 'bg-blue-100' : ''}`}
                              onClick={() => mostrarDetallesEventos(mes, 2024)}
                            >
                              {porMes.find(m => m.anio === 2024 && m.mes === index + 1)?.cantidad || 0}
                            </td>
                            <td
                              className={`border border-black p-1 text-center cursor-pointer hover:bg-gray-100 text-xs ${mesSeleccionado?.mes === mes && mesSeleccionado?.año === 2025 ? 'bg-blue-100' : ''}`}
                              onClick={() => mostrarDetallesEventos(mes, 2025)}
                            >
                              {porMes.find(m => m.anio === 2025 && m.mes === index + 1)?.cantidad || 0}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td className="border border-black p-1 text-center font-bold text-xs">Total</td>
                          <td className="border border-black p-1 text-center font-bold text-xs">
                            {porMes.filter(m => m.anio === 2024).reduce((sum, m) => sum + m.cantidad, 0)}
                          </td>

                          <td className="border border-black p-1 text-center font-bold text-xs">
                            {porMes.filter(m => m.anio === 2025).reduce((sum, m) => sum + m.cantidad, 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="lg:col-span-3 h-[300px] mt-8 lg:mt-0">
                  {loading ? (
                    <div className="h-full bg-gray-200 animate-pulse rounded"></div>
                  ) : tipoGraficoComparativa === 'comparativa' ? (
                    <Bar data={chartData} options={chartOptions} />
                  ) : (
                    <Line
                      data={{
                        labels: meses,
                        datasets: [
                          {
                            label: 'Eventos 2024',
                            data: porMes.filter(m => m.anio === 2024).map(m => m.cantidad),
                            borderColor: 'darkblue',
                            backgroundColor: 'darkblue',
                            tension: 0.1,
                            fill: false
                          },
                          {
                            label: 'Eventos 2025',
                            data: porMes.filter(m => m.anio === 2025).map(m => m.cantidad),
                            borderColor: 'lightgreen',
                            backgroundColor: 'lightgreen',
                            tension: 0.1,
                            fill: false
                          }
                        ]
                      }}
                      options={chartOptions}
                    />
                  )}
                </div>

                <div className="content-list border border-gray-200 rounded-lg p-3 lg:col-span-4 h-[300px] lg:h-[200px] sticky top-4">
                  <h3 className="text-lg font-bold mb-2">
                    Detalles de Eventos
                    {mesSeleccionado && (
                      <span className="text-sm font-normal ml-2 text-gray-600">
                        ({mesSeleccionado.mes} {mesSeleccionado.año} - {negocioSeleccionado?.nombre})
                      </span>
                    )}
                  </h3>
                  <div className="h-[calc(100%-3rem)] overflow-y-auto">
                    {loading ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded"></div>
                        ))}
                      </div>
                    ) : Object.keys(eventosDetalle).length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Object.entries(eventosDetalle).map(([tipo, data]) => (
                          <Card key={tipo} className="cursor-pointer hover:bg-gray-100" onClick={() => mostrarEventosSeleccionados(tipo)}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">{tipo}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{data.cantidad}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        {mesSeleccionado
                          ? "No hay eventos para el período seleccionado"
                          : "Seleccione un mes para ver detalles de eventos"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
          {vistaActual === 'puestos' && (
            <Card className="p-4 lg:p-6 mt-4 h-[calc(100%-6rem)]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">Eventos por Puestos</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTipoGraficoSedes('tendencia')}
                    className={`p-2 rounded-lg ${tipoGraficoSedes === 'tendencia' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    title="Análisis de Tendencia"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" /></svg>
                  </button>
                  <button
                    onClick={() => setTipoGraficoSedes('comparativa')}
                    className={`p-2 rounded-lg ${tipoGraficoSedes === 'comparativa' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    title="Vista Comparativa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="12" width="4" height="8" /><rect x="9" y="8" width="4" height="12" /><rect x="15" y="4" width="4" height="16" /></svg>
                  </button>
                </div>
              </div>
              <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8 lg:gap-4 h-[calc(100%-3rem)] overflow-y-auto">
                <div>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex gap-2">
                          <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                          <div className="h-8 w-14 bg-gray-200 animate-pulse rounded"></div>
                          <div className="h-8 w-14 bg-gray-200 animate-pulse rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="border border-black text-sm w-full">
                      <thead className="sticky top-0">
                        <tr>
                          <th className="bg-[rgb(28,28,28)] text-white p-1 border border-black text-xs">Puesto</th>
                          <th className="bg-[rgb(28,28,28)] text-white p-1 border border-black text-xs w-14">2024</th>
                          <th className="bg-[rgb(28,28,28)] text-white p-1 border border-black text-xs w-14">2025</th>
                        </tr>
                      </thead>
                      <tbody>
                        {puestos.map((puesto) => {
                          // Buscar los totales por puesto y año en resumenSedes
                          const total2024 = porPuesto.find(r => r.puesto === puesto.nombre_puesto && r.anio === 2024)?.cantidad || 0
                          const total2025 = porPuesto.find(r => r.puesto === puesto.nombre_puesto && r.anio === 2025)?.cantidad || 0
                          return (
                            <tr key={puesto.id_puesto}>
                              <td className="border border-black p-1 text-xs">{puesto.nombre_puesto}</td>
                              <td
                                className={`border border-black p-1 text-center cursor-pointer hover:bg-gray-100 text-xs ${puestoSeleccionado?.puesto === puesto.nombre_puesto && puestoSeleccionado?.año === 2024 ? 'bg-blue-100' : ''}`}
                                onClick={() => { mostrarEventosPorPuesto(puesto.nombre_puesto, 2024); setShowModal(true); }}
                              >
                                {total2024}
                              </td>
                              <td
                                className={`border border-black p-1 text-center cursor-pointer hover:bg-gray-100 text-xs ${puestoSeleccionado?.puesto === puesto.nombre_puesto && puestoSeleccionado?.año === 2025 ? 'bg-blue-100' : ''}`}
                                onClick={() => { mostrarEventosPorPuesto(puesto.nombre_puesto, 2025); setShowModal(true); }}
                              >
                                {total2025}
                              </td>
                            </tr>
                          )
                        })}
                        <tr>
                          <td className="border border-black p-1 text-center font-bold text-xs">Total</td>
                          <td className="border border-black p-1 text-center font-bold text-xs">
                            {porPuesto.filter(r => r.anio === 2024).reduce((sum, r) => sum + r.cantidad, 0)}
                          </td>
                          <td className="border border-black p-1 text-center font-bold text-xs">
                            {porPuesto.filter(r => r.anio === 2025).reduce((sum, r) => sum + r.cantidad, 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="lg:col-span-3 h-full mt-8 lg:mt-0">
                  <div className="content-list border border-gray-200 rounded-lg p-3 h-[500px] lg:h-[400px] sticky top-4">
                    <h3 className="text-lg font-bold mb-2">Tendencia de Eventos</h3>
                    <div className="h-[calc(100%-3rem)]">
                      {loading ? (
                        <div className="h-full bg-gray-200 animate-pulse rounded"></div>
                      ) : tipoGraficoSedes === 'tendencia' ? (
                        <Line
                          data={{
                            labels: puestosLabelsFinal,
                            datasets: [
                              {
                                label: 'Eventos 2024',
                                data: puestosLabelsFinal.map(puesto => porPuesto.find(r => r.puesto === puesto && r.anio === 2024)?.cantidad || 0),
                                borderColor: 'darkblue',
                                backgroundColor: 'darkblue',
                                tension: 0.1,
                                fill: false
                              },
                              {
                                label: 'Eventos 2025',
                                data: puestosLabelsFinal.map(puesto => porPuesto.find(r => r.puesto === puesto && r.anio === 2025)?.cantidad || 0),
                                borderColor: 'lightgreen',
                                backgroundColor: 'lightgreen',
                                tension: 0.1,
                                fill: false
                              }
                            ]
                          }}
                          options={chartOptions}
                        />
                      ) : (
                        <Bar
                          data={{
                            labels: puestosLabelsFinal,
                            datasets: [
                              {
                                label: 'Eventos 2024',
                                data: puestosLabelsFinal.map(puesto => porPuesto.find(r => r.puesto === puesto && r.anio === 2024)?.cantidad || 0),
                                backgroundColor: 'darkblue',
                                borderColor: 'darkblue',
                                borderWidth: 1,
                              },
                              {
                                label: 'Eventos 2025',
                                data: puestosLabelsFinal.map(puesto => porPuesto.find(r => r.puesto === puesto && r.anio === 2025)?.cantidad || 0),
                                backgroundColor: 'lightgreen',
                                borderColor: 'lightgreen',
                                borderWidth: 1,
                              }
                            ]
                          }}
                          options={chartOptions}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {vistaActual === 'comparativa'
                ? `Eventos - ${mesSeleccionado?.mes} ${mesSeleccionado?.año}`
                : `Eventos del Puesto - ${puestoSeleccionado?.puesto} (${puestoSeleccionado?.año})`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8">
            {eventosSeleccionados.map((evento) => (
              <Card key={evento.id_novedad} className="overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6">
                    {(evento.puesto || '??')} - {evento.tipo_novedad}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">Consecutivo: {evento.consecutivo}</p>

                  {evento.archivos && evento.archivos.length > 0 && (
                    <div className="mb-6">
                      <div className="flex gap-4 overflow-x-auto pb-4">
                        {evento.archivos.map((archivo) => (
                          <img
                            key={archivo.url_archivo}
                            src={archivo.url_archivo}
                            alt="Evidencia"
                            className="h-[300px] w-auto object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                    <div className="flex gap-8 text-sm text-gray-600">
                      <p>
                        Fecha: {evento.fecha_novedad.split('T')[0].split('-').reverse().join('/')}
                      </p>
                      <p>
                        Hora: {evento.hora_novedad}
                      </p>
                    </div>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 text-base leading-relaxed">
                        {evento.descripcion}
                      </p>
                      {evento.gestion && (
                        <p className="text-gray-700 text-base leading-relaxed mt-4">
                          {evento.gestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 