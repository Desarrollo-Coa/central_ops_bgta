import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params
    
    const [result] = await pool.query(`
      SELECT DISTINCT d.email, d.nombre
      FROM destinatarios d
      INNER JOIN asignaciones_destinatarios a ON d.id_destinatario = a.id_destinatario
      INNER JOIN novedades n ON n.id_puesto = a.id_puesto AND n.id_tipo_evento = a.id_tipo_evento
      WHERE n.id_novedad = ?
      AND d.activo = true
      AND a.activo = true
    `, [params.id])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error al obtener destinatarios asignados:', error)
    return NextResponse.json(
      { error: 'Error al obtener destinatarios asignados' },
      { status: 500 }
    )
  }
}