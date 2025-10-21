import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET: Listar todas las unidades de negocio (con filtro opcional por id_negocio)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idNegocio = searchParams.get('id_negocio');
    let query = 'SELECT id_unidad, nombre_unidad, id_negocio FROM unidades_negocio';
    let params: any[] = [];
    if (idNegocio) {
      query += ' WHERE id_negocio = ?';
      params.push(idNegocio);
    }
    query += ' ORDER BY nombre_unidad';
    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al obtener unidades de negocio:', error);
    return NextResponse.json({ error: 'Error al obtener unidades de negocio' }, { status: 500 });
  }
}

// POST: Crear nueva unidad de negocio
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre_unidad, id_negocio } = body;
    if (!nombre_unidad || !id_negocio) {
      return NextResponse.json({ error: 'Nombre de la unidad y negocio son requeridos' }, { status: 400 });
    }
    const [result] = await pool.query(
      'INSERT INTO unidades_negocio (nombre_unidad, id_negocio) VALUES (?, ?)',
      [nombre_unidad, id_negocio]
    );
    return NextResponse.json({ id: (result as any).insertId, nombre_unidad, id_negocio });
  } catch (error) {
    console.error('Error al crear la unidad de negocio:', error);
    return NextResponse.json({ error: 'Error al crear la unidad de negocio' }, { status: 500 });
  }
}

// PUT: Editar unidad de negocio
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id_unidad, nombre_unidad } = body;
    if (!id_unidad || !nombre_unidad) {
      return NextResponse.json({ error: 'ID y nombre de la unidad son requeridos' }, { status: 400 });
    }
    await pool.query(
      'UPDATE unidades_negocio SET nombre_unidad = ? WHERE id_unidad = ?',
      [nombre_unidad, id_unidad]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar la unidad de negocio:', error);
    return NextResponse.json({ error: 'Error al actualizar la unidad de negocio' }, { status: 500 });
  }
}

// DELETE: Eliminar unidad de negocio (solo si no tiene puestos asociados)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idUnidad = searchParams.get('idUnidad');
    if (!idUnidad) {
      return NextResponse.json({ error: 'ID de la unidad es requerido' }, { status: 400 });
    }
    // Verificar si tiene puestos asociados
    const [puestos] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM puestos WHERE id_unidad = ?',
      [idUnidad]
    );
    if (puestos[0].count > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la unidad porque tiene puestos asociados' },
        { status: 400 }
      );
    }
    await pool.query('DELETE FROM unidades_negocio WHERE id_unidad = ?', [idUnidad]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar la unidad de negocio:', error);
    return NextResponse.json({ error: 'Error al eliminar la unidad de negocio' }, { status: 500 });
  }
} 