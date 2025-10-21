'use client';

import Link from "next/link";
import { useRouter, usePathname } from 'next/navigation';
import { Home, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: 'Inicio',
    icon: Home,
    href: '/users/dashboard',
    color: "text-sky-500"
  },
  {
    label: 'Ajustes',
    icon: Settings,
    href: '/users/settings',
    color: "text-yellow-500"
  },
];

export function UserSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      setTimeout(() => router.push("/login"), 300);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Sidebar para PC
  const DesktopSidebar = (
    <div className="hidden sm:flex h-full w-64 flex-col bg-white border-r">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800">Mi Panel</h2>
      </div>
      <div className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-black hover:bg-gray-100 rounded-lg transition",
                pathname === route.href ? "bg-gray-100 text-black" : "text-gray-500"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={`h-5 w-5 mr-3 ${route.color}`} />
                {route.label}
              </div>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-red-600 hover:bg-red-50 rounded-lg transition text-red-500"
          >
            <div className="flex items-center flex-1">
              <LogOut className="h-5 w-5 mr-3" />
              Cerrar Sesión
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // Barra de navegación inferior para móviles
  const MobileNav = (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex justify-around items-center h-16">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full",
              pathname === route.href ? "text-black" : "text-gray-500"
            )}
          >
            <route.icon className={`h-6 w-6 ${route.color}`} />
            <span className="text-xs mt-1">{route.label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full text-red-500"
        >
          <LogOut className="h-6 w-6" />
          <span className="text-xs mt-1">Salir</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {DesktopSidebar}
      {MobileNav}
    </>
  );
} 