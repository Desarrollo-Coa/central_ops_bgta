export const dynamic = "force-dynamic";
import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoReporteId = searchParams.get("tipoReporteId")

    let query = "SELECT * FROM tipos_evento"
    const params: any[] = []

    // Si se proporciona un tipo de reporte, filtrar los eventos relacionados
    if (tipoReporteId) {
      query += " WHERE id_tipo_reporte = ?"
      params.push(tipoReporteId)
    }

    query += " ORDER BY nombre_tipo_evento"

    const [rows] = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener tipos de evento:", error)
    return NextResponse.json({ error: "Error al obtener tipos de evento" }, { status: 500 })
  }
}
