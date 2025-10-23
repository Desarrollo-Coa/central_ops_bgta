'use client'

import { useEffect, useRef } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface EstadisticasNovedadesProps {
  tipoNovedad: string
  data: {
    mes: string
    cantidad: number
  }[]
}

export default function EstadisticasNovedades({ tipoNovedad, data }: EstadisticasNovedadesProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)

  const chartData = {
    labels: data.map(item => item.mes),
    datasets: [
      {
        label: 'Cantidad de Novedades',
        data: data.map(item => item.cantidad),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Estadísticas de ${tipoNovedad} - ${new Date().getFullYear()}`
      }
    }
  }

  return (
    <div className="w-full h-64">
      <Bar data={chartData} options={options} />
    </div>
  )
} 