'use client'

import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

interface GraficoCardProps {
  titulo: string;
  descripcion: string;
  datos: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderRadius?: number;
    }[];
  };
  opciones?: any;
  altura?: string;
  filtros?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
}

export function GraficoCard({ 
  titulo, 
  descripcion, 
  datos, 
  opciones = {}, 
  altura = "h-[400px]",
  filtros,
  footer,
  loading = false
}: GraficoCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{titulo}</CardTitle>
            <CardDescription>{descripcion}</CardDescription>
          </div>
          {filtros && (
            <div className="flex gap-4">
              {filtros}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={altura}>
          {loading ? (
            <div className="w-full h-full flex items-center justify-center animate-pulse">
              <div className="h-64 w-full bg-gray-100 rounded" />
            </div>
          ) : (
            <Bar
              data={datos}
              options={{
                plugins: { 
                  legend: { display: false }, 
                  datalabels: { 
                    anchor: 'end', 
                    align: 'end', 
                    color: '#1e293b', 
                    font: { weight: 'bold', size: 16 } 
                  }
                },
                responsive: true,
                maintainAspectRatio: false,
                ...opciones
              }}
            />
          )}
        </div>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
} 