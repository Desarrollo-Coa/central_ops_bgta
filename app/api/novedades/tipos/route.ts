import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket } from 'mysql2'

export async function GET() {
  try {
    const query = `
      SELECT 
        id_tipo_evento as id_tipo_novedad,
        nombre_tipo_evento as nombre_novedad
      FROM tipos_evento
      ORDER BY nombre_tipo_evento ASC
    `

    const [rows] = await pool.query<RowDataPacket[]>(query)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener tipos de novedad:", error)
    return NextResponse.json({ error: "Error al obtener tipos de novedad" }, { status: 500 })
  }
} 