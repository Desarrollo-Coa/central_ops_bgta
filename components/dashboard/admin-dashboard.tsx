import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Shield, TrendingUp } from "lucide-react"

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    activePercentage: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats/active-users", { credentials: "include" });
        const data = await res.json();
        console.log("Respuesta de /api/stats/active-users:", data);
        setStats({
          totalUsers: data.totalUsers ?? 0,
          activeUsers: data.activeUsers ?? 0,
          activePercentage: data.activePercentage ?? 0,
          loading: false,
        });
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      title: "Usuarios registrados",
      value: stats.loading ? "..." : stats.totalUsers,
      description: "Usuarios registrados en el sistema",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Usuarios activos (24h)",
      value: stats.loading ? "..." : stats.activeUsers,
      description: "Usuarios activos en las últimas 24 horas",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "% de actividad",
      value: stats.loading ? "..." : `${stats.activePercentage}%`,
      description: "Porcentaje de usuarios activos",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Documentos",
      value: "156",
      description: "Documentos gestionados",
      icon: FileText,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">Gestiona usuarios, reportes y configuraciones del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Gestiona el sistema de manera eficiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <a
                href="/dashboard/users"
                className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium">Gestionar Usuarios</span>
              </a>
              <a
                href="/dashboard/reports"
                className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FileText className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium">Ver Reportes</span>
              </a>
              <a
                href="/dashboard/settings"
                className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Shield className="h-5 w-5 text-purple-600 mr-3" />
                <span className="font-medium">Configuración</span>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo usuario registrado</p>
                  <p className="text-xs text-gray-500">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Documento subido</p>
                  <p className="text-xs text-gray-500">Hace 4 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Reporte SST generado</p>
                  <p className="text-xs text-gray-500">Hace 1 día</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
