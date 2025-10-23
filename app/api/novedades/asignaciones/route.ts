import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { RowDataPacket } from 'mysql2'

// GET - Obtener todas las asignaciones
export async function GET() {
  try {
    const query = `
      SELECT 
        a.id_asignacion as id,
        a.id_destinatario,
        d.nombre as nombre_destinatario,
        d.email as email_destinatario,
        a.id_tipo_evento,
        te.nombre_tipo_evento as nombre_tipo_evento,
        a.id_puesto,
        p.nombre_puesto,
        a.activo
      FROM asignaciones_destinatarios a
      INNER JOIN destinatarios d ON a.id_destinatario = d.id_destinatario
      INNER JOIN tipos_evento te ON a.id_tipo_evento = te.id_tipo_evento
      INNER JOIN puestos p ON a.id_puesto = p.id_puesto
      WHERE a.activo = true
      ORDER BY d.nombre ASC
    `

    const [rows] = await pool.query<RowDataPacket[]>(query)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error al obtener asignaciones:", error)
    return NextResponse.json({ error: "Error al obtener asignaciones" }, { status: 500 })
  }
}

// POST - Crear nueva asignación
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const query = `
      INSERT INTO asignaciones_destinatarios 
      (id_destinatario, id_tipo_evento, id_puesto)
      VALUES (?, ?, ?)
    `

    const [result] = await pool.query(query, [
      data.id_destinatario,
      data.id_tipo_evento,
      data.id_puesto
    ])

    return NextResponse.json({ 
      message: "Asignación creada exitosamente",
      id: (result as any).insertId 
    })
  } catch (error) {
    console.error("Error al crear asignación:", error)
    return NextResponse.json({ error: "Error al crear asignación" }, { status: 500 })
  }
} 