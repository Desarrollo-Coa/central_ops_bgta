import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT 
        te.id_tipo_evento as id,
        te.nombre_tipo_evento as nombre,
        te.id_tipo_reporte
      FROM tipos_evento te
      ORDER BY id_tipo_evento ASC`
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener tipos de evento:", error)
    return NextResponse.json(
      { error: "Error al obtener tipos de evento" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { nombre_tipo_evento, id_tipo_reporte } = data

    const [result] = await pool.query(
      "INSERT INTO tipos_evento (nombre_tipo_evento, id_tipo_reporte) VALUES (?, ?)",
      [nombre_tipo_evento, id_tipo_reporte]
    )

    return NextResponse.json({
      success: true,
      message: "Tipo de evento creado exitosamente",
      id: (result as any).insertId,
    })
  } catch (error) {
    console.error("Error al crear tipo de evento:", error)
    return NextResponse.json(
      { error: "Error al crear tipo de evento" },
      { status: 500 }
    )
  }
} 