import { ReactNode } from 'react';

interface EstadisticasLayoutProps {
  titulo: string;
  descripcion: string;
  filtros: ReactNode;
  metricas: ReactNode;
  graficos: ReactNode;
}

export function EstadisticasLayout({
  titulo,
  descripcion,
  filtros,
  metricas,
  graficos
}: EstadisticasLayoutProps) {
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
          {/* Filters Card ocupa dos columnas en desktop */}
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