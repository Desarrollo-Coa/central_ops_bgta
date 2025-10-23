export const dynamic = "force-dynamic";
import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket } from 'mysql2'

export async function GET() {
  try {
    const query = `
      SELECT 
        id_tipo_reporte,
        nombre_tipo_reporte
      FROM tipos_reporte
      ORDER BY nombre_tipo_reporte ASC
    `
    const [rows] = await pool.query<RowDataPacket[]>(query)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener tipos de reporte:", error)
    return NextResponse.json({ error: "Error al obtener tipos de reporte" }, { status: 500 })
  }
}