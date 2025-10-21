'use client';

import { ModuleCards } from "@/components/settings-cards";
import { Building2, FileText, Settings2, Route } from "lucide-react";

export default function SettingsPage() {
  const settingsModules = [
    {
      title: "Gestionar Negocios",
      description: "Crear y administrar clientes de la organización",
      icon: Building2,
      href: "/settings/negocios",
      color: "text-green-500"
    },
    {
      title: "Gestionar Unidades de Negocio",
      description: "Administrar unidades de negocio asociadas a cada negocio",
      icon: FileText,
      href: "/settings/unidades-negocio",
      color: "text-yellow-500"
    },
    {
      title: "Gestionar Rutas del Sistema",
      description: "Gestionar rutas y permisos del sistema",
      icon: Route,
      href: "/settings/rutas",
      color: "text-red-500"
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Configuración del Sistema</h1>
      <ModuleCards modules={settingsModules} />
    </div>
  );
} 