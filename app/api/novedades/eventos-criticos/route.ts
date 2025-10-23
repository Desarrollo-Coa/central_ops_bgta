import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const zona = searchParams.get('zona')

    if (!zona) {
      return NextResponse.json({ error: "Se requiere el parámetro zona" }, { status: 400 })
    }

    const query = `
      SELECT 
        n.id_novedad,
        n.consecutivo,
        n.fecha_hora_novedad as fecha_novedad,
        TIME_FORMAT(n.fecha_hora_novedad, '%H:%i:%s') as hora_novedad,
        n.descripcion,
        n.gestion,
        te.nombre_tipo_evento as tipo_novedad,
        s.nombre_sede as puesto,
        tn.nombre_tipo_negocio as unidad_negocio,
        z.nombre_zona as zona,
        s.nombre_sede as sede,
        GROUP_CONCAT(i.url_imagen) as archivos
      FROM novedades_cementos_argos n
      JOIN tipos_evento te ON n.id_tipo_evento = te.id_tipo_evento
      JOIN Sedes s ON n.id_sede = s.id_sede
      JOIN Tipos_Negocio tn ON n.id_tipo_negocio = tn.id_tipo_negocio
      JOIN zonas_cementos_argos z ON s.id_zona = z.id_zona
      LEFT JOIN imagenes_novedades_cementos_argos i ON n.id_novedad = i.id_novedad
      WHERE z.nombre_zona = ?
      AND n.evento_critico = true
      GROUP BY n.id_novedad
      ORDER BY n.fecha_hora_novedad DESC
    `

    const [rows] = await pool.query(query, [zona])
    
    // Procesar las URLs de las imágenes
    const eventosProcesados = (rows as any[]).map(evento => ({
      ...evento,
      archivos: evento.archivos ? evento.archivos.split(',').map((url: string) => ({ url_archivo: url })) : []
    }))

    return NextResponse.json(eventosProcesados)
  } catch (error) {
    console.error("Error al obtener eventos críticos:", error)
    return NextResponse.json({ error: "Error al obtener eventos críticos" }, { status: 500 })
  }
} 