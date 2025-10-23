'use client'

import { useState, useEffect } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MetricasCardProps {
  titulo: string
  valor: number
  icono?: React.ReactNode
  color?: string
  formato?: (valor: number) => string
}

export function MetricasCard({ titulo, valor, icono, color = "#1A4A96", formato }: MetricasCardProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const valorSeguro = isNaN(valor) ? 0 : valor

  const data = [
    {
      name: titulo,
      value: valorSeguro,
      fill: color
    }
  ]

  if (!isMounted) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {titulo}
          </CardTitle>
          {icono}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formato ? formato(valorSeguro) : valorSeguro}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {titulo}
        </CardTitle>
        {icono}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {formato ? formato(valorSeguro) : valorSeguro}
          </div>
          <div className="h-[120px] w-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="45%"
                outerRadius="100%"
                data={data}
                startAngle={0}
                endAngle={360}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 