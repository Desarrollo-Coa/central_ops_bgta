'use client';
import { useState, useEffect } from "react";
import  MainSidebar  from "../components/main-sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Modules } from "@/components/modules";
import { useAuth } from "@/hooks/useAuth";
import Skeleton from "@/components/ui/skeleton";
import { Calendar, MessageSquare } from "lucide-react";

const dashboardTitle = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DASHBOARD_TITLE
  ? process.env.NEXT_PUBLIC_DASHBOARD_TITLE
  : "TABLERO DE CONTROL";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Definir los módulos a mostrar en el dashboard
  const modules = [
    {
      title: "Programación",
      description: "Gestiona y observa el cumplimiento del personal en los distintos servicios.",
      icon: <Calendar className="h-6 w-6 text-muted-foreground" />,
      image: "/img/modulos/programacion/programacion.jpeg",
      link: "/programacion",
    },
    {
      title: "Comunicación",
      description: "Registro de Comunicación",
      icon: <MessageSquare className="h-6 w-6 text-muted-foreground" />,
      image: "/img/modulos/comunicacion/Comunicacion.jpeg",
      link: "/comunicacion",
    }
  ];

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <MainSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
         
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="w-full bg-[#000e3a] py-6 text-center sticky top-0 z-10">
              <Skeleton className="h-8 w-64 mx-auto" />
            </div>
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-[1920px] mx-auto">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i} className="h-[280px]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-6" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-[160px] w-full mb-4" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
       
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="w-full bg-[#000e3a] py-6 text-center sticky top-0 z-10">
            <h1 className="text-3xl font-semibold text-white">{dashboardTitle}</h1>
          </div>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="p-6">
            <Modules modules={modules} />
            
        </div>
        </main>
        </div>
      </div>
    </div>
  );
}