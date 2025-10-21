import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Shield, UserCheck, Clock } from "lucide-react";

interface ActiveUser {
  id: number;
  nombre: string;
  rol: string;
  ultima_actividad: string;
}

interface ActiveUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users?: ActiveUser[];
}

export function ActiveUsersModal({ isOpen, onClose, users: initialUsers }: ActiveUsersModalProps) {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/stats/active-users", {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Error al obtener usuarios activos");
      const data = await response.json();
      if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        setUsers(data); 
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error al obtener usuarios activos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActiveUsers();
      const interval = setInterval(fetchActiveUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const getRoleIcon = (rol: string) => {
    switch (rol.toLowerCase()) {
      case "administrador":
        return <Shield className="h-4 w-4 text-red-500" />;
      case "coordinador":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-green-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch (error) {
      return "Fecha no válida";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios Activos ({users.length})
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-4">Cargando usuarios activos...</div>
          ) : users.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getRoleIcon(user.rol)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{user.nombre}</p>
                      <p className="text-sm text-gray-500 truncate">{user.rol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                    <Clock className="h-4 w-4" />
                    <span className="whitespace-nowrap">{formatDate(user.ultima_actividad)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No hay usuarios activos en este momento
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 