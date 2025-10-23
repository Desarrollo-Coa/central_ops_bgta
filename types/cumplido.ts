// Interfaces estandarizadas para Cumplido
export interface Cumplido {
  id_cumplido: number;
  fecha: string;
  id_puesto: number;
  id_tipo_turno: number;
  nombre_puesto: string;
  nombre_unidad?: string;
  nombre_colaborador?: string;
  colaborador?: string; // Para compatibilidad con código existente
  colaborador_diurno?: string; // Para compatibilidad con código existente
  colaborador_nocturno?: string; // Para compatibilidad con código existente
  calificaciones?: { [key: string]: any };
  notas?: { [key: string]: string } | Nota[];
}

export interface Nota {
  id_nota: number;
  id_cumplido: number;
  nota: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface Puesto {
  id_puesto: number;
  nombre_puesto: string;
  nombre_unidad: string;
  id_unidad: number;
  activo: boolean;
  fecha_inicial?: string;
}

export interface Configuracion {
  id: number;
  fecha_inicial: string;
  cantidad_diurno: number;
  cantidad_nocturno: number;
  id_negocio: number;
}

export interface Negocio {
  id_negocio: number;
  nombre_negocio: string;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface DateState {
  anio: string;
  mes: string;
  dia: string;
}
