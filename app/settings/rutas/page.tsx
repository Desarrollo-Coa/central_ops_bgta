"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  FileText,
  BarChart,
  Phone,
  BookOpen,
  Heart,
  Calendar,
  Settings,
  CalendarPlus,
  CalendarCheck,
  Layout,
  Bell,
  PlusCircle,
  BarChart2,
  Users,
  History,
  Send,
  Camera,
  Settings2,
  Building2,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useImageOptimizer, formatFileSize } from '@/lib/imageOptimizer';

interface Module {
  id: number;
  nombre: string;
  descripcion: string;
  ruta: string;
  imagen_url: string;
  icono: string;
  activo: boolean;
  acepta_subrutas: boolean;
}

// Mapa de iconos disponibles
const iconMap = {
  MessageSquare,
  FileText,
  BarChart,
  Phone,
  BookOpen,
  Heart,
  Calendar,
  Settings,
  CalendarPlus,
  CalendarCheck,
  Layout,
  Bell,
  PlusCircle,
  BarChart2,
  Users,
  History,
  Send,
  Camera,
  Settings2,
  Building2
} as const;

type IconName = keyof typeof iconMap;

// Componente para el selector de iconos
const IconSelector = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  return (
    <div className="grid grid-cols-6 gap-2 p-2 border rounded-md max-h-48 overflow-y-auto">
      {Object.entries(iconMap).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={`p-2 rounded-md flex flex-col items-center justify-center hover:bg-gray-100 ${
            value === name ? 'bg-gray-100 border-2 border-blue-500' : ''
          }`}
        >
          <Icon className="h-6 w-6" />
          <span className="text-xs mt-1 truncate w-full text-center">{name}</span>
        </button>
      ))}
    </div>
  );
};

export default function RutasPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({
    nombre: '',
    descripcion: '',
    imagen_url: '',
    icono: '',
    activo: true,
    acepta_subrutas: false,
    ruta: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { optimizeAndPreview } = useImageOptimizer();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/settings/rutas');
      if (!response.ok) throw new Error('Error al cargar módulos');
      const data = await response.json();
      setModules(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error("No se pudieron cargar los módulos");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsOptimizing(true);
      const { optimizedFile, previewUrl } = await optimizeAndPreview(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200
      });
      
      setSelectedFile(optimizedFile);
      setPreviewUrl(previewUrl);
      
      toast.success("La imagen ha sido optimizada correctamente");
    } catch (error) {
      console.error('Error:', error);
      toast.error("No se pudo optimizar la imagen");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCreateModule = async () => {
    try {
      const formData = new FormData();
      formData.append('nombre', moduleForm.nombre);
      formData.append('descripcion', moduleForm.descripcion);
      formData.append('icono', moduleForm.icono);
      formData.append('activo', moduleForm.activo ? '1' : '0');
      formData.append('acepta_subrutas', moduleForm.acepta_subrutas ? '1' : '0');
      formData.append('ruta', moduleForm.ruta);
      
      if (selectedFile) {
        formData.append('imagen', selectedFile);
      }

      const response = await fetch('/api/settings/rutas', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al crear módulo');

      await fetchModules();
      setIsCreateModalOpen(false);
      setModuleForm({
        nombre: '',
        descripcion: '',
        imagen_url: '',
        icono: '',
        activo: true,
        acepta_subrutas: false,
        ruta: ''
      });
      setSelectedFile(null);
      setPreviewUrl('');
      toast.success("Módulo creado correctamente");
    } catch (error) {
      console.error('Error:', error);
      toast.error("No se pudo crear el módulo");
    }
  };

  const handleEditModule = async () => {
    if (!selectedModule) return;

    try {
      const formData = new FormData();
      formData.append('nombre', moduleForm.nombre);
      formData.append('descripcion', moduleForm.descripcion);
      formData.append('icono', moduleForm.icono);
      formData.append('activo', moduleForm.activo ? '1' : '0');
      formData.append('acepta_subrutas', moduleForm.acepta_subrutas ? '1' : '0');
      formData.append('ruta', moduleForm.ruta);
      
      if (selectedFile) {
        formData.append('imagen', selectedFile);
      }

      console.log('Enviando datos de edición:', {
        nombre: moduleForm.nombre,
        descripcion: moduleForm.descripcion,
        icono: moduleForm.icono,
        activo: moduleForm.activo ? '1' : '0',
        acepta_subrutas: moduleForm.acepta_subrutas ? '1' : '0'
      });

      const response = await fetch(`/api/settings/rutas/${selectedModule.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al actualizar módulo');

      await fetchModules();
      setIsEditModalOpen(false);
      setSelectedModule(null);
      setSelectedFile(null);
      setPreviewUrl('');
      toast.success("Módulo actualizado correctamente");
    } catch (error) {
      console.error('Error:', error);
      toast.error("No se pudo actualizar el módulo");
    }
  };

  const handleDeleteModule = async (id: number) => {
    setModuleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!moduleToDelete) return;

    try {
      setIsDeleting(moduleToDelete);
      const response = await fetch(`/api/settings/rutas/${moduleToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar módulo');

      await fetchModules();
      toast.success("Módulo eliminado correctamente");
    } catch (error) {
      console.error('Error:', error);
      toast.error("No se pudo eliminar el módulo");
    } finally {
      setIsDeleteModalOpen(false);
      setModuleToDelete(null);
      setIsDeleting(null);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Rutas del Sistema</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Ruta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Ruta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={moduleForm.nombre}
                  onChange={(e) => setModuleForm({ ...moduleForm, nombre: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ruta">Ruta</Label>
                <Input
                  id="ruta"
                  placeholder="/ruta/ruta"
                  value={moduleForm.ruta}
                  onChange={(e) => setModuleForm({ ...moduleForm, ruta: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={moduleForm.descripcion}
                  onChange={(e) => setModuleForm({ ...moduleForm, descripcion: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="imagen">Imagen</Label>
                <div className="mt-2">
                  <Input
                    id="imagen"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isOptimizing}
                  />
                  {isOptimizing && (
                    <div className="mt-2 text-sm text-gray-500">
                      Optimizando imagen...
                    </div>
                  )}
                  {previewUrl && !isOptimizing && (
                    <div className="mt-2">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="icono">Icono</Label>
                <IconSelector 
                  value={moduleForm.icono} 
                  onChange={(value) => setModuleForm({ ...moduleForm, icono: value })} 
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={moduleForm.activo}
                  onCheckedChange={(checked) => setModuleForm({ ...moduleForm, activo: checked })}
                />
                <Label htmlFor="activo">Activo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="acepta_subrutas"
                  checked={moduleForm.acepta_subrutas}
                  onCheckedChange={(checked) => setModuleForm({ ...moduleForm, acepta_subrutas: checked })}
                />
                <Label htmlFor="acepta_subrutas">Acepta Subrutas</Label>
              </div>
              <Button onClick={handleCreateModule} className="w-full">
                Crear Ruta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {modules.map((module) => (
              <tr key={module.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {module.icono && iconMap[module.icono as IconName] && 
                      React.createElement(iconMap[module.icono as IconName], { className: "h-4 w-4 mr-2" })
                    }
                    <span className="ml-2">{module.nombre}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{module.descripcion}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{module.ruta}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    module.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {module.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <Dialog open={isEditModalOpen && selectedModule?.id === module.id} onOpenChange={setIsEditModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedModule(module);
                            setModuleForm({
                              nombre: module.nombre,
                              descripcion: module.descripcion,
                              imagen_url: module.imagen_url,
                              icono: module.icono,
                              activo: module.activo,
                              acepta_subrutas: module.acepta_subrutas,
                              ruta: module.ruta
                            });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Ruta</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-nombre">Nombre</Label>
                            <Input
                              id="edit-nombre"
                              value={moduleForm.nombre}
                              onChange={(e) => setModuleForm({ ...moduleForm, nombre: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-ruta">Ruta</Label>
                            <Input
                              id="edit-ruta"
                              placeholder="/ruta/ruta"
                              value={moduleForm.ruta}
                              onChange={(e) => setModuleForm({ ...moduleForm, ruta: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-descripcion">Descripción</Label>
                            <Input
                              id="edit-descripcion"
                              value={moduleForm.descripcion}
                              onChange={(e) => setModuleForm({ ...moduleForm, descripcion: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-imagen">Imagen</Label>
                            <div className="mt-2">
                              <Input
                                id="edit-imagen"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml"
                                onChange={handleFileChange}
                                disabled={isOptimizing}
                              />
                              {isOptimizing && (
                                <div className="mt-2 text-sm text-gray-500">
                                  Optimizando imagen...
                                </div>
                              )}
                              {(previewUrl || moduleForm.imagen_url) && !isOptimizing && (
                                <div className="mt-2">
                                  <img 
                                    src={previewUrl || moduleForm.imagen_url} 
                                    alt="Preview" 
                                    className="w-32 h-32 object-cover rounded-md"
                                  />
                                  {selectedFile && (
                                    <div className="mt-1 text-xs text-gray-500">
                                      Nueva imagen: {formatFileSize(selectedFile.size)}
                                    </div>
                                  )}
                                  {!selectedFile && moduleForm.imagen_url && (
                                    <div className="mt-1 text-xs text-gray-500">
                                      Imagen actual
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="edit-icono">Icono</Label>
                            <IconSelector 
                              value={moduleForm.icono} 
                              onChange={(value) => setModuleForm({ ...moduleForm, icono: value })} 
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="edit-activo"
                              checked={moduleForm.activo}
                              onCheckedChange={(checked) => setModuleForm({ ...moduleForm, activo: checked })}
                            />
                            <Label htmlFor="edit-activo">Activo</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="edit-acepta_subrutas"
                              checked={moduleForm.acepta_subrutas}
                              onCheckedChange={(checked) => setModuleForm({ ...moduleForm, acepta_subrutas: checked })}
                            />
                            <Label htmlFor="edit-acepta_subrutas">Acepta Subrutas</Label>
                          </div>
                          <Button onClick={handleEditModule} className="w-full">
                            Guardar Cambios
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteModule(module.id)}
                      disabled={isDeleting === module.id}
                    >
                      {isDeleting === module.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>¿Estás seguro de que deseas eliminar esta ruta?</p>
            <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setModuleToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 