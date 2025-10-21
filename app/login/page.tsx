"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { SolicitudCuentaModal } from "@/components/solicitud-cuenta-modal";
import { toast, Toaster } from "sonner";

const images = [
  { src: "/img/FORTOX.png", alt: "FORTOX" },
  { src: "/img/LOGO-LOGIN.jpg", alt: "Logo Login" },
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Iniciando proceso de login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Usuario no encontrado') {
          toast.error('Usuario no encontrado', {
            description: 'Verifica tu usuario o correo electrónico.',
          });
        } else if (data.error === 'Contraseña incorrecta') {
          toast.error('Contraseña incorrecta', {
            description: 'Intenta de nuevo o restablece tu contraseña.',
          });
        } else {
          toast.error('Error al iniciar sesión', {
            description: 'Ocurrió un problema en el servidor.',
          });
        }
        return;
      }

      toast.success('¡Bienvenido!', {
        description: `Has iniciado sesión como ${data.user.email || data.user.username}`,
      });
 

      // Redirigir según el rol del usuario
      try {
        if (data.user.role === 'Administrador') {
          console.log('Intentando redirigir a admin a /');
          await router.push("/");
        } else {
          console.log('Intentando redirigir a usuario a /users/dashboard');
          await router.push("/users/dashboard");
        }
      } catch (error) {
        console.error('Error en la redirección:', error);
      }

    } catch (error) {
      toast.error('Error de conexión', {
        description: 'No se pudo conectar al servidor. Intenta de nuevo.',
      });
      console.error('Error en login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      <div className="relative hidden lg:flex flex-col items-center justify-center bg-[#B5CCBE] text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={images[currentImageIndex].src}
            alt={images[currentImageIndex].alt}
            fill
            style={{ objectFit: "cover" }}
            className="transition-opacity duration-1000"
            priority
          />
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        </div>
        
        <div className="relative z-10 max-w-md mx-auto text-center space-y-6 p-8">
          <h2 className="text-2xl font-bold">
            {process.env.NEXT_PUBLIC_DASHBOARD_TITLE || "TABLERO DE CONTROL"}
          </h2>
          <p className="text-lg text-white/90">
            Sistema de gestión y control de operaciones
          </p>
          <div className="flex justify-center gap-2 pt-4">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex ? "bg-white scale-125" : "bg-white/40"
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-script mb-6">Iniciar Sesión</h1>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm text-gray-500" htmlFor="identifier">
                Usuario o Correo
              </label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full p-2 border rounded"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500" htmlFor="password">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
                disabled={loading}
              />
              <div className="text-right">
                <Link href="#" className="text-sm text-gray-500 hover:text-gray-700">
                  ¿Olvidaste la contraseña?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gray-600 hover:bg-gray-700 text-white"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">o</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              ¿Eres Nuevo? <SolicitudCuentaModal />
            </p>
          </form>

          <Toaster richColors position="top-right" expand={false} />
        </div>
      </div>
    </div>
  );
}