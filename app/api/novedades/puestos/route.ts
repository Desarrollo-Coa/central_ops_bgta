export const dynamic = "force-dynamic";
import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket } from 'mysql2'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id_unidad = searchParams.get('id_unidad')
    const id_negocio = searchParams.get('id_negocio')
    
    let query: string
    let params: any[]
    
    if (id_unidad) {
      // Filtrar por unidad específica
      query = "SELECT id_puesto, nombre_puesto, id_unidad FROM puestos WHERE id_unidad = ? ORDER BY nombre_puesto ASC"
      params = [id_unidad]
    } else if (id_negocio) {
      // Filtrar por negocio (todos los puestos del negocio)
      query = `
        SELECT p.id_puesto, p.nombre_puesto, p.id_unidad 
        FROM puestos p
        JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
        WHERE un.id_negocio = ?
        ORDER BY p.nombre_puesto ASC
      `
      params = [id_negocio]
    } else {
      return NextResponse.json([], { status: 200 })
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener puestos:", error)
    return NextResponse.json({ error: "Error al obtener puestos" }, { status: 500 })
  }
} 