import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const data = await request.json();
    const { nombre, email } = data;
    const id = params.id;

    const query = `
      UPDATE destinatarios 
      SET nombre = ?, email = ?
      WHERE id_destinatario = ?
    `;

    await pool.query(query, [nombre, email, id]);

    return NextResponse.json({ message: "Destinatario actualizado correctamente" });
  } catch (error: any) {
    console.error("Error al actualizar destinatario:", error);
    return NextResponse.json(
      { error: "Error al actualizar el destinatario" },
      { status: 500 }
    );
  }
}

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
      "DELETE FROM destinatarios WHERE id_destinatario = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Destinatario no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: "Destinatario eliminado correctamente" });
  } catch (error: any) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || (error.message && error.message.includes('a foreign key constraint fails'))) {
      return NextResponse.json({ error: "No se puede eliminar el destinatario porque tiene asignaciones activas." }, { status: 409 });
    }
    console.error("Error al eliminar destinatario:", error);
    return NextResponse.json({ error: "Error al eliminar destinatario" }, { status: 500 });
  }
} 