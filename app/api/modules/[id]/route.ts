import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    return (payload.role as string)?.toLowerCase() === 'administrador';
  } catch (error) {
    return false;
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { nombre, descripcion, ruta, imagen_url, icono, activo, acepta_subrutas } = body;

    const [result] = await pool.query(
      'UPDATE modulos SET nombre = ?, descripcion = ?, ruta = ?, imagen_url = ?, icono = ?, activo = ?, acepta_subrutas = ? WHERE id = ?',
      [nombre, descripcion, ruta, imagen_url, icono, activo, acepta_subrutas, id]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Módulo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id, ...body });
  } catch (error) {
    console.error('Error al actualizar módulo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar módulo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    const [result] = await pool.query(
      'DELETE FROM modulos WHERE id = ?',
      [id]
    ) as [ResultSetHeader, any];

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Módulo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar módulo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar módulo' },
      { status: 500 }
    );
  }
} 