export const dynamic = "force-dynamic";
import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket } from 'mysql2'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id_negocio = searchParams.get('id_negocio')
    if (!id_negocio) {
      return NextResponse.json([], { status: 200 })
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id_unidad as id_unidad_negocio, nombre_unidad as nombre_unidad_negocio FROM unidades_negocio WHERE id_negocio = ? ORDER BY nombre_unidad ASC",
      [id_negocio]
    )
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener unidades de negocio:", error)
    return NextResponse.json({ error: "Error al obtener unidades de negocio" }, { status: 500 })
  }
} 