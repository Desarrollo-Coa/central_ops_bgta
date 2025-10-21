'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from "lucide-react"
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Label,
  LabelList
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57']

export default function Estadisticas() {

  const [datosPorAnio, setDatosPorAnio] = useState([])
  const [datosPorTipo, setDatosPorTipo] = useState([])
  const [datosPorPuesto, setDatosPorPuesto] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [anioRes, tipoRes, puestoRes] = await Promise.all([
          fetch('/api/novedades/estadisticas?unidadNegocio=todas&filtroTemporal=anual'),
          fetch('/api/novedades/estadisticas?unidadNegocio=todas&filtroTemporal=tipo'),
          fetch('/api/novedades/estadisticas?unidadNegocio=todas&filtroTemporal=puesto')
        ])
        
        const [anioData, tipoData, puestoData] = await Promise.all([
          anioRes.json(),
          tipoRes.json(),
          puestoRes.json()
        ])

        setDatosPorAnio(anioData)
        setDatosPorTipo(tipoData)
        setDatosPorPuesto(puestoData)
      } catch (error) {
        console.error('Error al obtener datos:', error)
        toast.error("No se pudieron cargar las estadísticas")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const totalNovedades = datosPorAnio.reduce((acc: number, curr: any) => acc + curr.cantidad, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Gráfico de Área - Novedades por Año */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Novedades</CardTitle>
          <CardDescription>Comparativo anual de novedades registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosPorAnio}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="cantidad" 
                  name="Novedades"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 font-medium leading-none">
                Total de novedades: {totalNovedades}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Gráfico Circular - Novedades por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Tipo</CardTitle>
          <CardDescription>Novedades según tipo de evento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosPorTipo}
                  dataKey="cantidad"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {datosPorTipo.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Top 10 Puestos */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Top 10 Puestos con más Novedades</CardTitle>
          <CardDescription>Puestos que requieren mayor atención</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosPorPuesto}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="cantidad" 
                  name="Novedades"
                  fill="#8884d8"
                >
                  <LabelList 
                    dataKey="cantidad" 
                    position="top"
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 