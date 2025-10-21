import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const negocioId = searchParams.get('negocioId');

    if (!negocioId) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro negocioId' },
        { status: 400 }
      );
    }

    const [puestos] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id_puesto,
        p.nombre_puesto,
        p.fecha_inicial,
        p.activo,
        u.id_unidad,
        u.nombre_unidad
       FROM puestos p
       JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
       WHERE u.id_negocio = ?
       ORDER BY u.nombre_unidad, p.nombre_puesto`,
      [parseInt(negocioId)]
    );

    return NextResponse.json(puestos);
  } catch (error) {
    console.error('Error al obtener puestos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los puestos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre_puesto, id_unidad, fecha_inicial } = body;

    if (!nombre_puesto || !id_unidad || !fecha_inicial) {
      return NextResponse.json(
        { error: 'Se requieren nombre_puesto, id_unidad y fecha_inicial' },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      'INSERT INTO puestos (nombre_puesto, id_unidad, fecha_inicial) VALUES (?, ?, ?)',
      [nombre_puesto, id_unidad, fecha_inicial]
    );

    return NextResponse.json({ 
      success: true, 
      id_puesto: (result as any).insertId 
    });
  } catch (error) {
    console.error('Error al crear puesto:', error);
    return NextResponse.json(
      { error: 'Error al crear el puesto' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_puesto, nombre_puesto, id_unidad, fecha_inicial, activo } = body;

    if (!id_puesto) {
      return NextResponse.json(
        { error: 'Se requiere id_puesto' },
        { status: 400 }
      );
    }

    const updateFields = [];
    const values = [];

    if (nombre_puesto !== undefined) {
      updateFields.push('nombre_puesto = ?');
      values.push(nombre_puesto);
    }
    if (id_unidad !== undefined) {
      updateFields.push('id_unidad = ?');
      values.push(id_unidad);
    }
    if (fecha_inicial !== undefined) {
      updateFields.push('fecha_inicial = ?');
      values.push(fecha_inicial);
    }
    if (activo !== undefined) {
      updateFields.push('activo = ?');
      values.push(activo);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    values.push(id_puesto);

    await pool.query(
      `UPDATE puestos SET ${updateFields.join(', ')} WHERE id_puesto = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar puesto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el puesto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idPuesto = searchParams.get('idPuesto');

    if (!idPuesto) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro idPuesto' },
        { status: 400 }
      );
    }

    // Verificar si hay cumplidos asociados
    const [cumplidos] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM cumplidos WHERE id_puesto = ?',
      [parseInt(idPuesto)]
    );

    if (cumplidos[0].count > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el puesto porque tiene registros asociados' },
        { status: 400 }
      );
    }

    await pool.query(
      'DELETE FROM puestos WHERE id_puesto = ?',
      [parseInt(idPuesto)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar puesto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el puesto' },
      { status: 500 }
    );
  }
}
