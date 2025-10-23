import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params
    const id = params.id

    const query = `
      SELECT 
        id_tipo_evento,
        nombre_tipo_evento,
        id_tipo_reporte
      FROM tipos_evento
      WHERE id_tipo_reporte = ?
      ORDER BY nombre_tipo_evento ASC
    `

    const [rows] = await pool.query(query, [id])
    return NextResponse.json(rows)
  } catch (error: any) {
    console.error("Error al obtener tipos de evento:", error)
    return NextResponse.json({ error: "Error al obtener los tipos de evento" }, { status: 500 })
  }
} 