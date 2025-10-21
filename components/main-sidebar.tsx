'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Settings, LayoutDashboard, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react"; 

interface AuthUser {
  id: string;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  role: string;
}

export default function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) {
      setIsSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          setCurrentUser(data);
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrentUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch (error) {}
  };

  // Menú para móvil
  const MobileMenu = () => (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r animate-in slide-in-from-left flex flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <span className="text-xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            Dashboard
              </span>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col justify-between py-4">
          <nav className="flex flex-col gap-2 px-4">
            <Link href="/" className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-blue-50 transition-all",
              pathname === "/" && "bg-blue-100 text-blue-700 font-semibold"
            )} onClick={() => setIsMobileMenuOpen(false)}>
              <LayoutDashboard className="h-5 w-5" />
                Dashboard
                  </Link>
            <Link href="/usuarios" className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-blue-50 transition-all",
              pathname === "/usuarios" && "bg-blue-100 text-blue-700 font-semibold"
            )} onClick={() => setIsMobileMenuOpen(false)}>
              <Users className="h-5 w-5" />
                        Usuarios
                      </Link>
            <Link href="/settings" className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-blue-50 transition-all",
              pathname === "/settings" && "bg-blue-100 text-blue-700 font-semibold"
            )} onClick={() => setIsMobileMenuOpen(false)}>
              <Settings className="h-5 w-5" />
                        Ajustes
                      </Link>
          </nav>
          <div className="px-4 pb-2">
            <Button onClick={handleLogout} className="w-full flex items-center gap-2" variant="outline">
              <LogOut className="h-5 w-5 text-red-500" />
              <span className="text-red-600 font-semibold">Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Menú de escritorio
  const DesktopMenu = () => (
    <aside className={cn(
      "hidden md:flex flex-col bg-white border-r transition-all duration-300 h-screen shadow-sm",
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-16 items-center justify-between border-b px-4">
        <span className={cn(
          "text-xl font-bold tracking-tight flex items-center gap-2 transition-all",
          isSidebarCollapsed && "justify-center w-full"
        )}>
          <LayoutDashboard className="h-6 w-6 text-blue-600" />
          {!isSidebarCollapsed && "Dashboard"}
                </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="h-8 w-8"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex-1 flex flex-col justify-between py-4">
        <nav className="flex flex-col gap-2 px-4">
          <Link href="/" className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-blue-50 transition-all",
            pathname === "/" && "bg-blue-100 text-blue-700 font-semibold",
            isSidebarCollapsed && "justify-center px-0"
          )}>
            <LayoutDashboard className="h-5 w-5" />
            {!isSidebarCollapsed && "Dashboard"}
                </Link>
          <Link href="/usuarios" className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-blue-50 transition-all",
            pathname === "/usuarios" && "bg-blue-100 text-blue-700 font-semibold",
            isSidebarCollapsed && "justify-center px-0"
          )}>
            <Users className="h-5 w-5" />
            {!isSidebarCollapsed && "Usuarios"}
                      </Link>
          <Link href="/settings" className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-blue-50 transition-all",
            pathname === "/settings" && "bg-blue-100 text-blue-700 font-semibold",
            isSidebarCollapsed && "justify-center px-0"
          )}>
            <Settings className="h-5 w-5" />
            {!isSidebarCollapsed && "Ajustes"}
                      </Link>
        </nav>
        <div className="px-4 pb-2">
          <Button onClick={handleLogout} className={cn(
            "w-full flex items-center gap-2",
            isSidebarCollapsed && "justify-center px-0"
          )} variant="outline">
            <LogOut className="h-5 w-5 text-red-500" />
            {!isSidebarCollapsed && <span className="text-red-600 font-semibold">Cerrar sesión</span>}
          </Button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      {isMobileMenuOpen && <MobileMenu />}
      <DesktopMenu />
    </>
  );
}
