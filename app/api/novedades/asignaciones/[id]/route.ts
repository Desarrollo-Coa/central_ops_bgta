import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }
    const [result]: any = await pool.query(
      "DELETE FROM asignaciones_destinatarios WHERE id_asignacion = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Asignación no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ message: "Asignación eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar asignación:", error);
    return NextResponse.json({ error: "Error al eliminar asignación" }, { status: 500 });
  }
} 