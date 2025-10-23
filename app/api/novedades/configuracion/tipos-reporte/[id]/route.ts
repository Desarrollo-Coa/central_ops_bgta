import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idTipoReporte = parseInt(id)
    const data = await request.json()
    const { nombre_tipo_reporte } = data

    await pool.query(
      'UPDATE tipos_reporte SET nombre_tipo_reporte = ? WHERE id_tipo_reporte = ?',
      [nombre_tipo_reporte, idTipoReporte]
    )

    return NextResponse.json({ 
      success: true, 
      message: "Tipo de reporte actualizado exitosamente" 
    })
  } catch (error) {
    console.error("Error al actualizar tipo de reporte:", error)
    return NextResponse.json({ error: "Error al actualizar tipo de reporte" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idTipoReporte = parseInt(id)

    await pool.query(
      'DELETE FROM tipos_reporte WHERE id_tipo_reporte = ?',
      [idTipoReporte]
    )

    return NextResponse.json({ 
      success: true, 
      message: "Tipo de reporte eliminado exitosamente" 
    })
  } catch (error) {
    console.error("Error al eliminar tipo de reporte:", error)
    return NextResponse.json({ error: "Error al eliminar tipo de reporte" }, { status: 500 })
  }
} 