'use client';

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/skeleton";

interface AuthUser {
  id: string;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  role: string;
}

interface Modulo {
  id: number;
  nombre: string;
  descripcion: string;
  ruta: string;
  imagen_url: string;
  icono: string;
}

export function UserHeader() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modulosAsignados, setModulosAsignados] = useState<Modulo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener datos del usuario
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUser(userData);
        }

        // Obtener módulos asignados
        const modulosResponse = await fetch('/api/modules/user/assigned');
        if (modulosResponse.ok) {
          const modulosData = await modulosResponse.json();
          setModulosAsignados(modulosData);
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      
      // Buscar en módulos asignados
      const moduloEncontrado = modulosAsignados.find(modulo => 
        modulo.nombre.toLowerCase().includes(normalizedSearch) ||
        modulo.descripcion?.toLowerCase().includes(normalizedSearch)
      );

      if (moduloEncontrado) {
        router.push(moduloEncontrado.ruta);
        setSearchTerm('');
      }
    }
  };

  return (
    <header className="bg-white shadow-sm py-2 sm:py-4 px-3 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
            </div>
          ) : (
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-none">
              {currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : ''}
            </h2>
          )}
        </div>
        <div className="relative flex-1 sm:max-w-md">
          <Search
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Buscar en mis módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="w-full pl-8 pr-4 py-1 text-sm sm:text-base rounded-full bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 transition duration-200"
          />
          {isFocused && searchTerm && (
            <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[40vh] sm:max-h-60 overflow-y-auto z-50">
              {modulosAsignados
                .filter(modulo => 
                  modulo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  modulo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(modulo => (
                  <div
                    key={modulo.id}
                    className="px-3 sm:px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      router.push(modulo.ruta);
                      setSearchTerm('');
                      setIsFocused(false);
                    }}
                  >
                    <div className="font-medium text-sm sm:text-base line-clamp-1">{modulo.nombre}</div>
                    {modulo.descripcion && (
                      <div className="text-xs sm:text-sm text-gray-500 line-clamp-2">{modulo.descripcion}</div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 