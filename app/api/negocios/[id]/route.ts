import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { nombre_negocio } = await request.json();
    if (!nombre_negocio || !id) {
      return NextResponse.json({ error: 'Nombre e ID requeridos' }, { status: 400 });
    }
    const [result] = await pool.query(
      'UPDATE negocios SET nombre_negocio = ?, fecha_actualizacion = NOW() WHERE id_negocio = ?',
      [nombre_negocio, id]
    );
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }
    // Obtener el negocio actualizado
    const [rows] = await pool.query('SELECT * FROM negocios WHERE id_negocio = ?', [id]);
    return NextResponse.json({ negocio: (rows as any)[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar negocio' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    // Intentar eliminar el negocio
    try {
      const [result] = await pool.query('DELETE FROM negocios WHERE id_negocio = ?', [id]);
      if ((result as any).affectedRows === 0) {
        return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    } catch (err: any) {
      // Error por restricción de clave foránea
      if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
        return NextResponse.json({ error: 'No se puede eliminar el negocio porque tiene datos relacionados.' }, { status: 409 });
      }
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar negocio' }, { status: 500 });
  }
} 