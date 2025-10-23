import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id_negocio = searchParams.get('id_negocio')

    if (!id_negocio) {
      return NextResponse.json({ error: "Se requiere el parámetro id_negocio" }, { status: 400 })
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
        p.nombre_puesto as puesto,
        un.nombre_unidad as unidad_negocio,
        ne.nombre_negocio as negocio,
        p.nombre_puesto as sede,
        GROUP_CONCAT(i.url_imagen) as archivos
      FROM novedades n
      JOIN tipos_evento te ON n.id_tipo_evento = te.id_tipo_evento
      JOIN puestos p ON n.id_puesto = p.id_puesto
      JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      JOIN negocios ne ON un.id_negocio = ne.id_negocio
      LEFT JOIN imagenes_novedades i ON n.id_novedad = i.id_novedad
      WHERE ne.id_negocio = ?
      GROUP BY n.id_novedad
      ORDER BY n.fecha_hora_novedad DESC
    `

    const [rows] = await pool.query(query, [id_negocio])
    
    // Procesar las URLs de las imágenes
    const eventosProcesados = (rows as any[]).map(evento => ({
      ...evento,
      archivos: evento.archivos ? evento.archivos.split(',').map((url: string) => ({ url_archivo: url })) : []
    }))

    return NextResponse.json(eventosProcesados)
  } catch (error) {
    console.error("Error al obtener eventos:", error)
    return NextResponse.json({ error: "Error al obtener eventos" }, { status: 500 })
  }
} 