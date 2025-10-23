import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket } from 'mysql2'

// GET - Obtener todos los destinatarios
export async function GET() {
  try {
    const query = `
      SELECT 
        id_destinatario as id,
        nombre,
        email,
        activo
      FROM destinatarios
      WHERE activo = true
      ORDER BY nombre ASC
    `

    const [rows] = await pool.query<RowDataPacket[]>(query)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener destinatarios:", error)
    return NextResponse.json({ error: "Error al obtener destinatarios" }, { status: 500 })
  }
}

// POST - Crear nuevo destinatario
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const query = `
      INSERT INTO destinatarios 
      (nombre, email)
      VALUES (?, ?)
    `

    const [result] = await pool.query(query, [
      data.nombre,
      data.email
    ])

    return NextResponse.json({ 
      message: "Destinatario creado exitosamente",
      id: (result as any).insertId 
    })
  } catch (error) {
    console.error("Error al crear destinatario:", error)
    return NextResponse.json({ error: "Error al crear destinatario" }, { status: 500 })
  }
} 