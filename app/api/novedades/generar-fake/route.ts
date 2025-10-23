import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { mes, año } = await req.json();
    
    if (!mes || !año) {
      return NextResponse.json({ error: 'Mes y año son requeridos' }, { status: 400 });
    }

    // Generar fechas del mes
    const diasEnMes = new Date(año, mes, 0).getDate();
    const fechas: string[] = [];
    for (let dia = 1; dia <= diasEnMes; dia++) {
      fechas.push(`${año}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`);
    }

    // Validar si ya existen novedades fake para este mes
    const [existentes] = await pool.query(
      `SELECT COUNT(*) as count FROM novedades 
       WHERE YEAR(fecha_hora_novedad) = ? AND MONTH(fecha_hora_novedad) = ?
       AND descripcion LIKE '%NOVEDAD DE PRUEBA%'`,
      [año, mes]
    );
    
    const countExistentes = (existentes as any[])[0].count;
    if (countExistentes > 0) {
      return NextResponse.json({ 
        error: `Ya existen ${countExistentes} novedades de prueba para ${mes}/${año}`,
        existe: true 
      }, { status: 400 });
    }

    // Obtener datos reales
    const [puestosRows] = await pool.query("SELECT id_puesto FROM puestos WHERE activo = 1");
    const [tiposRows] = await pool.query("SELECT id_tipo_evento FROM tipos_evento WHERE activo = 1");
    const [usuariosRows] = await pool.query("SELECT id FROM users WHERE activo = 1");

    const puestos = puestosRows as any[];
    const tipos = tiposRows as any[];
    const usuarios = usuariosRows as any[];

    if (puestos.length === 0 || tipos.length === 0 || usuarios.length === 0) {
      return NextResponse.json({ error: 'No hay datos suficientes para generar novedades' }, { status: 400 });
    }

    // Obtener el último consecutivo de prueba (que empiece con 100)
    const [ultimoConsecutivoPrueba] = await pool.query(
      "SELECT MAX(consecutivo) as max FROM novedades WHERE consecutivo >= 100000"
    );
    let consecutivo = ((ultimoConsecutivoPrueba as any[])[0].max || 99999) + 1;

    let total = 0;

    // Generar novedades por tipo de evento (7-15 por tipo)
    for (const tipo of tipos) {
      const cantidadPorTipo = Math.floor(Math.random() * 9) + 7; // 7-15
      
      for (let i = 0; i < cantidadPorTipo; i++) {
        const fecha = fechas[Math.floor(Math.random() * fechas.length)];
        const id_puesto = puestos[Math.floor(Math.random() * puestos.length)].id_puesto;
        const id_usuario = usuarios[Math.floor(Math.random() * usuarios.length)].id;
        
        // Distribución horaria más realista (más actividad en horario laboral)
        const hora = generarHoraRealista();
        
        const descripcion = generarDescripcionRealista(tipo.id_tipo_evento);
        const gestion = generarGestionRealista();
        const evento_critico = Math.random() < 0.15 ? 1 : 0; // 15% críticos

        const [result] = await pool.query(
          `INSERT INTO novedades (id_usuario, id_puesto, consecutivo, fecha_hora_novedad, id_tipo_evento, descripcion, gestion, evento_critico)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id_usuario, id_puesto, consecutivo++, `${fecha} ${hora}`, tipo.id_tipo_evento, descripcion, gestion, evento_critico]
        );
        
        const idNovedad = (result as any).insertId;
        
        // Agregar imágenes de prueba (100% de probabilidad de tener imágenes)
        if (true) {
          const imagenesPrueba = [
            'https://central-operaciones-bgta.sfo3.cdn.digitaloceanspaces.com/imagen-prueba.jpg',
            'https://central-operaciones-bgta.sfo3.cdn.digitaloceanspaces.com/image-prueba2.jpg',
            'https://central-operaciones-bgta.sfo3.cdn.digitaloceanspaces.com/image-prueba3.jpg'
          ];
          
          // Seleccionar 1-3 imágenes aleatorias
          const cantidadImagenes = Math.floor(Math.random() * 3) + 1;
          const imagenesSeleccionadas = imagenesPrueba
            .sort(() => Math.random() - 0.5)
            .slice(0, cantidadImagenes);
          
          for (const imagenUrl of imagenesSeleccionadas) {
            const nombreArchivo = imagenUrl.split('/').pop() || 'imagen-prueba.jpg';
            await pool.query(
              `INSERT INTO imagenes_novedades (id_novedad, url_imagen, nombre_archivo)
               VALUES (?, ?, ?)`,
              [idNovedad, imagenUrl, nombreArchivo]
            );
          }
        }
        
        total++;
      }
    }

    return NextResponse.json({ 
      message: `¡Se generaron ${total} novedades de prueba para ${mes}/${año}!`,
      total,
      mes,
      año
    });

  } catch (error) {
    console.error('Error generando novedades fake:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Función para generar horas más realistas (más actividad en horario laboral)
function generarHoraRealista(): string {
  const hora = Math.random() < 0.7 
    ? Math.floor(Math.random() * 12) + 6  // 70% entre 6:00-17:59
    : Math.floor(Math.random() * 12) + 18; // 30% entre 18:00-5:59
  
  const horaFormateada = hora >= 24 ? hora - 24 : hora;
  const minutos = Math.floor(Math.random() * 60);
  
  return `${String(horaFormateada).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:00`;
}

// Función para generar descripciones más realistas
function generarDescripcionRealista(idTipoEvento: number): string {
  const descripciones = {
    1: ['Agresión verbal reportada', 'Conflicto con visitante', 'Situación de tensión'],
    2: ['Daño en infraestructura', 'Problema estructural detectado', 'Falla en instalaciones'],
    3: ['Elemento sin asegurar', 'Puerta sin cerrar', 'Acceso no controlado'],
    4: ['Falla eléctrica reportada', 'Corte de energía', 'Problema en instalación eléctrica'],
    5: ['Retraso en entrega', 'Problema logístico', 'Falta de suministros'],
    6: ['Necesidad de poda', 'Área verde descuidada', 'Mantenimiento requerido'],
    7: ['Persona externa sospechosa', 'Acceso no autorizado', 'Intruso detectado'],
    8: ['Falla en sistema interno', 'Problema técnico', 'Error en equipos'],
    9: ['Cámara sin señal', 'Falla en CCTV', 'Sistema de seguridad'],
    10: ['Intento de hurto', 'Robo reportado', 'Pérdida de pertenencias'],
    11: ['Incumplimiento detectado', 'Procedimiento incorrecto', 'Falta de protocolo'],
    12: ['Accidente menor', 'Incidente laboral', 'Lesión reportada'],
    13: ['Situación evitada', 'Prevención exitosa', 'Riesgo controlado'],
    14: ['Otra novedad', 'Situación especial', 'Evento no categorizado']
  };
  
  const opciones = descripciones[idTipoEvento as keyof typeof descripciones] || ['Novedad de prueba'];
  return `NOVEDAD DE PRUEBA - ${opciones[Math.floor(Math.random() * opciones.length)]}`;
}

// Función para generar gestiones más realistas
function generarGestionRealista(): string {
  const gestiones = [
    'Se activó protocolo de seguridad correspondiente',
    'Se contactó al personal especializado',
    'Se implementaron medidas correctivas',
    'Se documentó el incidente para seguimiento',
    'Se coordinó con el área responsable',
    'Se aplicaron procedimientos estándar',
    'Se notificó a supervisión',
    'Se resolvió la situación satisfactoriamente'
  ];
  
  return gestiones[Math.floor(Math.random() * gestiones.length)];
} 