"use client";

import MainSidebar from '@/components/main-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bell, Eye, Map, X, Plus, BarChart, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Skeleton from "@/components/ui/skeleton";
import { ActiveUsersModal } from "@/components/active-users-modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AccountRequest {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  cargo: string;
  comentario: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  fecha_solicitud: string;
  approved_by?: string;
}

interface User {
  id: string;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  role_name: string;
}

interface Module {
  id: string;
  nombre: string;
  descripcion: string;
  ruta: string;
  imagen_url?: string;
  icono?: string;
  activo: boolean;
  acepta_subrutas: boolean;
}

interface UserStats {
  activeUsers: number;
  totalUsers: number;
  activePercentage: number;
}

interface ActiveUser {
  id: number;
  nombre: string;
  rol: string;
  ultima_actividad: string;
}

export default function CustomersPage() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("Baru");
  const [requestFilter, setRequestFilter] = useState<
    "pendiente" | "aprobado" | "rechazado" | "todos"
  >("todos");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentUserPassword, setCurrentUserPassword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userPassword, setUserPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    activeUsers: 0,
    totalUsers: 0,
    activePercentage: 0,
  });
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isActiveUsersModalOpen, setIsActiveUsersModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    module: Module | null;
  } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({
    nombre: '',
    descripcion: '',
    ruta: '',
    imagen_url: '',
    icono: '',
    activo: true,
    acepta_subrutas: false,
  });
  const [roles, setRoles] = useState<string[]>([]);

  const fetchAvailableModules = useCallback(async () => {
    try {
      const response = await fetch('/api/modules', { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new TypeError("La respuesta no es JSON!");
      setAvailableModules(data);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      toast.error('Error al cargar los módulos');
      setAvailableModules([]);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/solicitudes", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(`API error: ${data.error}`);
      if (!Array.isArray(data)) throw new TypeError("La respuesta no es un arreglo!");
      setRequests(data);
    } catch (error) {
      console.error("Error en fetchRequests:", error);
      setError("Ocurrió un error al cargar las solicitudes");
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(`API error: ${data.error}`);
      if (!Array.isArray(data)) throw new TypeError("La respuesta no es un arreglo!");
      setUsers(data);
    } catch (error) {
      console.error("Error en fetchUsers:", error);
      setUsers([]);
      toast.error('Error al cargar los usuarios');
    }
  }, []);

  const fetchUserStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats/users', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(`API error: ${data.error}`);
      setUserStats(data);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      toast.error('Error al cargar estadísticas');
    }
  }, []);

  const fetchActiveUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/stats/active-users', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(`API error: ${data.error}`);
      setActiveUsers(data);
    } catch (error) {
      console.error('Error al obtener usuarios activos:', error);
      toast.error('Error al cargar usuarios activos');
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/roles', { credentials: 'include' });
      if (!response.ok) throw new Error('Error al cargar roles');
      const data = await response.json();
      setRoles(data.map((r: any) => r.nombre));
    } catch (error) {
      console.error('Error al cargar roles:', error);
      setRoles([]);
      toast.error('Error al cargar roles');
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchRequests(),
      fetchUsers(),
      fetchUserStats(),
      fetchActiveUsers(),
      fetchAvailableModules(),
      fetchRoles(),
    ]).catch(() => toast.error('Error al cargar datos iniciales'));

    const interval = setInterval(() => {
      fetchUserStats();
      fetchActiveUsers();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchRequests, fetchUsers, fetchUserStats, fetchActiveUsers, fetchAvailableModules, fetchRoles]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu && !(event.target as HTMLElement).closest('.context-menu')) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [contextMenu]);

  const handleApprove = useCallback(async (requestId: string) => {
    try {
      const response = await fetch("/api/solicitudes", {
        method: "PATCH",
        body: JSON.stringify({ id: requestId, role: selectedRole }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al aprobar: ${errorData.error}`);
      }
      await Promise.all([fetchRequests(), fetchUsers()]);
      toast.success('Solicitud aprobada exitosamente');
    } catch (error) {
      console.error("Error en handleApprove:", error);
      toast.error('Error al aprobar la solicitud');
    }
  }, [selectedRole, fetchRequests, fetchUsers]);

  const handleReject = useCallback(async (requestId: string) => {
    try {
      const response = await fetch("/api/solicitudes", {
        method: "DELETE",
        body: JSON.stringify({ id: requestId }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al rechazar: ${errorData.error}`);
      }
      await fetchRequests();
      toast.success('Solicitud rechazada exitosamente');
    } catch (error) {
      console.error("Error en handleReject:", error);
      toast.error('Error al rechazar la solicitud');
    }
  }, [fetchRequests]);

  const handleViewPassword = useCallback(async () => {
    if (!selectedUserId || !currentUserPassword) {
      setUserPassword("Por favor, completa todos los campos");
      return;
    }
    try {
      const response = await fetch("/api/users/password", {
        method: "POST",
        body: JSON.stringify({ userId: selectedUserId, currentUserPassword }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No autorizado o contraseña incorrecta");
      }
      setUserPassword(data.password);
      toast.success('Contraseña obtenida exitosamente');
    } catch (error) {
      console.error("Error en handleViewPassword:", error);
      setUserPassword("Error al obtener la contraseña");
      toast.error('Error al obtener la contraseña');
    }
  }, [selectedUserId, currentUserPassword]);

  const openPasswordModal = useCallback((requestId: string) => {
    const approvedRequest = requests.find((req) => req.id === requestId);
    const user = users.find((u) => u.email === approvedRequest?.email);
    if (user) {
      setSelectedUserId(user.id);
      setCurrentUserPassword("");
      setUserPassword(null);
      setIsPasswordModalOpen(true);
    } else {
      console.error("No se encontró un usuario para la solicitud:", requestId);
      toast.error('No se encontró el usuario para esta solicitud');
    }
  }, [requests, users]);

  const handleManageRoutes = useCallback(async (requestId: string) => {
    try {
      const approvedRequest = requests.find((req) => req.id === requestId);
      const user = users.find((u) => u.email === approvedRequest?.email);
      
      if (!user) {
        throw new Error('No se encontró el usuario');
      }
      
      setSelectedUserId(user.id);
      const response = await fetch(`/api/modules/user/${user.id}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Error al cargar los módulos');
      }
      const data = await response.json();
      setAvailableModules(data.availableModules);
      setSelectedModules(data.assignedModules);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      toast.error('Error al cargar los módulos');
    }
  }, [requests, users]);

  const handleModuleToggle = useCallback((moduleId: string, checked: boolean) => {
    setSelectedModules(prev =>
      checked ? [...prev, moduleId] : prev.filter(id => id !== moduleId)
    );
  }, []);

  const handleSaveRoutes = useCallback(async () => {
    if (!selectedUserId) return;
    try {
      const response = await fetch(`/api/modules/user/${selectedUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedModules }),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Error al actualizar las rutas');
      }
      toast.success('Rutas actualizadas exitosamente');
      setSelectedUserId(null);
      setSelectedModules([]);
    } catch (error) {
      console.error('Error al guardar rutas:', error);
      toast.error('Error al guardar los cambios');
    }
  }, [selectedUserId, selectedModules]);

  const handleContextMenu = useCallback((e: React.MouseEvent, module: Module | null) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.available-panel')) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, module });
  }, []);

  const handleCreateModule = useCallback(() => {
    setModuleForm({
      nombre: '',
      descripcion: '',
      ruta: '',
      imagen_url: '',
      icono: '',
      activo: true,
      acepta_subrutas: false,
    });
    setIsCreateModalOpen(true);
    setIsEditModalOpen(false);
    setContextMenu(null);
  }, []);

  const handleEditModule = useCallback((module: Module) => {
    setSelectedModule(module);
    setModuleForm({
      nombre: module.nombre,
      descripcion: module.descripcion,
      ruta: module.ruta,
      imagen_url: module.imagen_url || '',
      icono: module.icono || '',
      activo: module.activo,
      acepta_subrutas: module.acepta_subrutas,
    });
    setIsEditModalOpen(true);
    setIsCreateModalOpen(false);
    setContextMenu(null);
  }, []);

  const handleDeleteModule = useCallback(async (module: Module) => {
    try {
      const response = await fetch(`/api/modules/${module.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Error al eliminar la ruta');
      }
      await fetchAvailableModules();
      toast.success('Ruta eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar la ruta:', error);
      toast.error('Error al eliminar la ruta');
    }
    setContextMenu(null);
  }, [fetchAvailableModules]);

  const handleSubmitModule = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedModule ? `/api/modules/${selectedModule.id}` : '/api/modules';
      const response = await fetch(url, {
        method: selectedModule ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleForm),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchAvailableModules();
      toast.success(selectedModule ? 'Ruta actualizada exitosamente' : 'Ruta creada exitosamente');
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedModule(null);
    } catch (error) {
      console.error('Error al procesar la ruta:', error);
      toast.error('Error al procesar la ruta');
    }
  }, [selectedModule, moduleForm, fetchAvailableModules]);

  const filteredRequests = useMemo(() => 
    requestFilter === "todos" ? requests : requests.filter(r => r.estado === requestFilter),
    [requests, requestFilter]
  );

  const pendingCount = useMemo(() => 
    requests.filter(r => r.estado === "pendiente").length,
    [requests]
  );

  const handleNotificationClick = useCallback(() => {
    setRequestFilter("pendiente");
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsActiveUsersModalOpen(true)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-2xl font-bold">{userStats.activeUsers}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios registrados</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-2xl font-bold">{userStats.totalUsers}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold text-gray-800">Usuarios</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleNotificationClick}
                >
                  <Bell className="h-4 w-4" />
                  Solicitudes de creación de usuario
                </Button>
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </div>
              <Select
                value={requestFilter}
                onValueChange={(value) =>
                  setRequestFilter(value as "pendiente" | "aprobado" | "rechazado" | "todos")
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filtro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="aprobado">Aprobadas</SelectItem>
                  <SelectItem value="rechazado">Rechazadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Lista de Solicitudes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cargo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comentario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...Array(5)].map((_, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-40" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="px-6 py-4">
                            <Skeleton className="h-4 w-48" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-6 w-20" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <Skeleton className="h-8 w-24" />
                              <Skeleton className="h-8 w-24" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : error ? (
                <p className="text-center text-red-500">{error}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cargo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comentario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                            No hay solicitudes para mostrar
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((request) => {
                          const user = users.find((u) => u.email === request.email);
                          return (
                          <tr key={request.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{`${request.nombre} ${request.apellido}`}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{user ? user.username : '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{request.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{request.cargo}</td>
                            <td className="px-6 py-4">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="block max-w-[150px] truncate">
                                      {request.comentario?.length > 20
                                        ? `${request.comentario.substring(0, 20)}...`
                                        : request.comentario}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{request.comentario}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  request.estado === "aprobado"
                                    ? "bg-green-100 text-green-800"
                                    : request.estado === "rechazado"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {request.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                              {request.estado === "pendiente" ? (
                                <>
                                  <Select
                                    value={selectedRole}
                                    onValueChange={setSelectedRole}
                                  >
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue placeholder="Rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                          {role}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    onClick={() => handleApprove(request.id)}
                                    variant="default"
                                    size="sm"
                                  >
                                    Aprobar
                                  </Button>
                                  <Button
                                    onClick={() => handleReject(request.id)}
                                    variant="destructive"
                                    size="sm"
                                  >
                                    Rechazar
                                  </Button>
                                </>
                              ) : request.estado === "aprobado" ? (
                                <>
                                  <Dialog
                                    open={isPasswordModalOpen}
                                    onOpenChange={setIsPasswordModalOpen}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openPasswordModal(request.id)}
                                      >
                                        <Eye className="h-4 w-4 mr-2" /> Ver contraseña
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                      <DialogHeader>
                                        <DialogTitle>Verificar identidad</DialogTitle>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <Input
                                          type="password"
                                          placeholder="Ingresa tu contraseña"
                                          value={currentUserPassword}
                                          onChange={(e) => setCurrentUserPassword(e.target.value)}
                                        />
                                        <Button onClick={handleViewPassword}>
                                          Verificar
                                        </Button>
                                        {userPassword && (
                                          <p className="text-sm text-gray-600">
                                            Contraseña: <span className="font-mono">{userPassword}</span>
                                          </p>
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleManageRoutes(request.id)}
                                      >
                                        <Map className="h-4 w-4 mr-2" /> Gestionar Rutas
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-[90vw] max-w-[95vw] md:max-w-[90vw] lg:max-w-[925px] h-auto max-h-[90vh] overflow-hidden z-[150]">
                                      <DialogHeader>
                                        <DialogTitle>Gestionar Rutas</DialogTitle>
                                      </DialogHeader>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 py-4 overflow-y-auto max-h-[70vh]">
                                        <div className="space-y-4 md:space-y-6">
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-2 md:mb-4">Información del Usuario</h3>
                                            <p className="text-sm text-gray-600">
                                              {`${request.nombre} ${request.apellido}`}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                              {request.email}
                                            </p>
                                          </div>
                                          <div>
                                            <h3 className="text-lg font-semibold mb-2 md:mb-4">Rutas Asignadas</h3>
                                            <div className="space-y-2 max-h-[250px] md:max-h-[400px] overflow-y-auto">
                                              {selectedModules.map((moduleId) => {
                                                const module = availableModules.find(m => m.id === moduleId);
                                                return module ? (
                                                  <div key={module.id} className="flex items-center justify-between bg-white p-2 md:p-3 rounded-lg border">
                                                    <div className="pr-2 overflow-hidden">
                                                      <p className="font-medium text-sm md:text-base truncate">{module.nombre}</p>
                                                      <p className="text-xs md:text-sm text-gray-500 truncate">{module.ruta}</p>
                                                    </div>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                                      onClick={() => handleModuleToggle(module.id, false)}
                                                    >
                                                      <X className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                ) : null;
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="available-panel" onContextMenu={(e) => handleContextMenu(e, null)}>
                                          <h3 className="text-lg font-semibold mb-2 md:mb-4">Rutas Disponibles</h3>
                                          <div className="space-y-2 max-h-[250px] md:max-h-[500px] overflow-y-auto">
                                            {availableModules
                                              .filter(module => !selectedModules.includes(module.id))
                                              .map((module) => (
                                                <div
                                                  key={module.id}
                                                  className="flex items-center justify-between bg-white p-2 md:p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                                                  onContextMenu={(e) => handleContextMenu(e, module)}
                                                >
                                                  <div className="pr-2 overflow-hidden">
                                                    <p className="font-medium text-sm md:text-base truncate">{module.nombre}</p>
                                                    <p className="text-xs md:text-sm text-gray-500 truncate">{module.ruta}</p>
                                                  </div>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-green-500 hover:text-green-700 hover:bg-green-50 shrink-0"
                                                    onClick={() => handleModuleToggle(module.id, true)}
                                                  >
                                                    <Plus className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex justify-end mt-2 md:mt-4">
                                        <Button onClick={handleSaveRoutes}>
                                          Guardar Cambios
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              ) : null}
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <ActiveUsersModal 
            isOpen={isActiveUsersModalOpen}
            onClose={() => setIsActiveUsersModalOpen(false)}
            users={activeUsers}
          />

          {contextMenu && (
            <div
              className="fixed z-[300] bg-white border rounded-lg shadow-lg py-1 min-w-[200px] context-menu"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <div className="px-2 py-1.5 text-sm font-medium text-gray-900">
                Opciones de Ruta
              </div>
              <div className="h-px bg-gray-200 my-1" />
              <button
                className="w-full px-2 py-1.5 text-sm text-left hover:bg-gray-100 flex items-center"
                onClick={handleCreateModule}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear nueva ruta
              </button>
              {contextMenu.module && (
                <>
                  <button
                    className="w-full px-2 py-1.5 text-sm text-left hover:bg-gray-100 flex items-center"
                    onClick={() => handleEditModule(contextMenu.module!)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar ruta
                  </button>
                  <button
                    className="w-full px-2 py-1.5 text-sm text-left hover:bg-gray-100 flex items-center text-red-500"
                    onClick={() => handleDeleteModule(contextMenu.module!)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar ruta
                  </button>
                </>
              )}
            </div>
          )}

          <Dialog 
            open={isCreateModalOpen || isEditModalOpen} 
            onOpenChange={(open) => {
              if (!open) {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedModule(null);
                setModuleForm({
                  nombre: '',
                  descripcion: '',
                  ruta: '',
                  imagen_url: '',
                  icono: '',
                  activo: true,
                  acepta_subrutas: false,
                });
              }
            }}
          >
            <DialogContent className="sm:max-w-[425px] z-[200]">
              <DialogHeader>
                <DialogTitle>{selectedModule ? 'Editar Ruta' : 'Crear Nueva Ruta'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitModule} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={moduleForm.nombre}
                    onChange={(e) => setModuleForm({ ...moduleForm, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={moduleForm.descripcion}
                    onChange={(e) => setModuleForm({ ...moduleForm, descripcion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruta">Ruta</Label>
                  <Input
                    id="ruta"
                    value={moduleForm.ruta}
                    onChange={(e) => setModuleForm({ ...moduleForm, ruta: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imagen_url">URL de Imagen</Label>
                  <Input
                    id="imagen_url"
                    value={moduleForm.imagen_url}
                    onChange={(e) => setModuleForm({ ...moduleForm, imagen_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icono">Icono</Label>
                  <Input
                    id="icono"
                    value={moduleForm.icono}
                    onChange={(e) => setModuleForm({ ...moduleForm, icono: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="activo"
                    checked={moduleForm.activo}
                    onCheckedChange={(checked) => 
                      setModuleForm({ ...moduleForm, activo: checked as boolean })
                    }
                  />
                  <Label htmlFor="activo">Activo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acepta_subrutas"
                    checked={moduleForm.acepta_subrutas}
                    onCheckedChange={(checked) => 
                      setModuleForm({ ...moduleForm, acepta_subrutas: checked as boolean })
                    }
                  />
                  <Label htmlFor="acepta_subrutas">Acepta Subrutas</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {selectedModule ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}