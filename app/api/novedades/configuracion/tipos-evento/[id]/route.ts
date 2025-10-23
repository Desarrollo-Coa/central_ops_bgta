import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idTipoEvento = parseInt(id)
    const data = await request.json()
    const { nombre_tipo_evento, id_tipo_reporte } = data

    await pool.query(
      "UPDATE tipos_evento SET nombre_tipo_evento = ?, id_tipo_reporte = ? WHERE id_tipo_evento = ?",
      [nombre_tipo_evento, id_tipo_reporte, idTipoEvento]
    )

    return NextResponse.json({
      success: true,
      message: "Tipo de evento actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar tipo de evento:", error)
    return NextResponse.json(
      { error: "Error al actualizar tipo de evento" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const idTipoEvento = parseInt(id)

    await pool.query(
      "DELETE FROM tipos_evento WHERE id_tipo_evento = ?",
      [idTipoEvento]
    )

    return NextResponse.json({
      success: true,
      message: "Tipo de evento eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar tipo de evento:", error)
    return NextResponse.json(
      { error: "Error al eliminar tipo de evento" },
      { status: 500 }
    )
  }
} 