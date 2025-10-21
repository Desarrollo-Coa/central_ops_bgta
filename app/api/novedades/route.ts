export const dynamic = "force-dynamic";
import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket, ResultSetHeader } from "mysql2"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Obtener el último consecutivo
    const [lastConsecutiveResult] = await pool.query<RowDataPacket[]>("SELECT MAX(consecutivo) as max_consecutivo FROM novedades")
    const lastConsecutive = lastConsecutiveResult[0]?.max_consecutivo || 0
    const newConsecutive = lastConsecutive + 1

    // Preparar los datos para inserción
    const {
      fecha,
      hora,
      tipo_reporte,
      tipo_evento,
      negocio,
      unidad_negocio,
      puesto,
      gestion,
      descripcion,
      evento_critico,
      imagenes = [],
      id_usuario,
    } = data

    // Formatear fecha y hora
    const fechaHora = `${fecha} ${hora}`

    // Iniciar transacción
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Insertar la novedad
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO novedades (
          id_usuario, 
          consecutivo, 
          fecha_hora_novedad, 
          id_tipo_evento, 
          descripcion, 
          gestion, 
          fecha_hora_registro,
          evento_critico,
          id_puesto
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)` ,
        [
          id_usuario,
          newConsecutive,
          fechaHora,
          tipo_evento,
          descripcion,
          gestion,
          evento_critico || false,
          puesto // puesto debe ser el id_puesto
        ],
      )

      const idNovedad = result.insertId

      // Guardar las imágenes en la tabla imagenes_novedades
      if (imagenes && imagenes.length > 0) {
        await Promise.all(imagenes.map((url: string) => {
          const nombreArchivo = url.split('/').pop() || ''
          return connection.query(
            'INSERT INTO imagenes_novedades (id_novedad, url_imagen, nombre_archivo) VALUES (?, ?, ?)',
            [idNovedad, url, nombreArchivo]
          )
        }))
      }

      await connection.commit()

      return NextResponse.json({
        success: true,
        message: "Novedad registrada correctamente",
        id: idNovedad,
        consecutivo: newConsecutive,
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error al registrar novedad:", error)
    return NextResponse.json({ error: "Error al registrar la novedad" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoReporte = searchParams.get('tipoReporte')
    const tipoEvento = searchParams.get('tipoEvento')
    // Cambiar de tipoNegocio a negocio
    const negocio = searchParams.get('negocio')
    const sede = searchParams.get('sede')
    const fecha = searchParams.get('fecha')
    const consecutivo = searchParams.get('consecutivo')
    const limite = searchParams.get('limite') || '100'

    let query = `
      SELECT n.*, 
        tr.nombre_tipo_reporte, 
        te.nombre_tipo_evento, 
        un.nombre_unidad as nombre_unidad_negocio,
        s.nombre_puesto as nombre_puesto,
        tn.nombre_negocio as nombre_negocio,
        u.nombre as nombre_usuario,
        u.apellido as apellido_usuario,
        GROUP_CONCAT(DISTINCT i.url_imagen) as imagenes,
        EXISTS (SELECT 1 FROM historial_envios he WHERE he.id_novedad = n.id_novedad) AS ha_sido_enviada
      FROM novedades n
      JOIN tipos_evento te ON n.id_tipo_evento = te.id_tipo_evento
      JOIN tipos_reporte tr ON te.id_tipo_reporte = tr.id_tipo_reporte
      JOIN puestos s ON n.id_puesto = s.id_puesto
      JOIN unidades_negocio un ON s.id_unidad = un.id_unidad
      JOIN negocios tn ON un.id_negocio = tn.id_negocio
      JOIN users u ON n.id_usuario = u.id
      LEFT JOIN imagenes_novedades i ON n.id_novedad = i.id_novedad
      WHERE 1=1
    `

    const params: any[] = []

    if (tipoReporte && tipoReporte !== 'todos') {
      query += ' AND tr.id_tipo_reporte = ?'
      params.push(tipoReporte)
    }

    if (tipoEvento && tipoEvento !== 'todos') {
      query += ' AND te.id_tipo_evento = ?'
      params.push(tipoEvento)
    }

    // Cambiar filtro de tipoNegocio a negocio
    if (negocio && negocio !== 'todos') {
      query += ' AND tn.id_negocio = ?'
      params.push(negocio)
    }

    if (sede && sede !== 'todos') {
      query += ' AND s.id_puesto = ?'
      params.push(sede)
    }

    if (fecha) {
      query += ' AND DATE(n.fecha_hora_novedad) = ?'
      params.push(fecha)
    }

    if (consecutivo) {
      query += ' AND n.consecutivo = ?'
      params.push(consecutivo)
    }

    query += ' GROUP BY n.id_novedad, tr.nombre_tipo_reporte, te.nombre_tipo_evento, un.nombre_unidad, s.nombre_puesto, tn.nombre_negocio, u.nombre, u.apellido'
    query += ' ORDER BY n.consecutivo DESC'
    query += ' LIMIT ?'
    params.push(parseInt(limite))

    const [rows] = await pool.query(query, params)
    
    // Convertir ha_sido_enviada a booleano explícitamente
    const novedadesProcesadas = (rows as any[]).map(novedad => ({
      ...novedad,
      ha_sido_enviada: Boolean(novedad.ha_sido_enviada)
    }))

    return NextResponse.json(novedadesProcesadas)
  } catch (error) {
    console.error("Error al obtener novedades:", error)
    return NextResponse.json({ error: "Error al obtener novedades" }, { status: 500 })
  }
}
