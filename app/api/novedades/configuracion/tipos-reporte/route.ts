import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket } from 'mysql2'

export async function GET() {
  try {
    const query = `
      SELECT 
        id_tipo_reporte as id,
        nombre_tipo_reporte as nombre
      FROM tipos_reporte
      ORDER BY id_tipo_reporte ASC
    `

    const [rows] = await pool.query<RowDataPacket[]>(query)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener tipos de reporte:", error)
    return NextResponse.json({ error: "Error al obtener tipos de reporte" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { nombre_tipo_reporte } = data

    const [result] = await pool.query(
      'INSERT INTO tipos_reporte (nombre_tipo_reporte) VALUES (?)',
      [nombre_tipo_reporte]
    )

    return NextResponse.json({ 
      success: true, 
      message: "Tipo de reporte creado exitosamente",
      id: (result as any).insertId 
    })
  } catch (error) {
    console.error("Error al crear tipo de reporte:", error)
    return NextResponse.json({ error: "Error al crear tipo de reporte" }, { status: 500 })
  }
} 