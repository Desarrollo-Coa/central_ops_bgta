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

export async function GET() {
  try {
    const [modules] = await pool.query(
      'SELECT * FROM modulos WHERE activo = TRUE ORDER BY nombre'
    );
    return NextResponse.json(modules);
  } catch (error) {
    console.error('Error al obtener módulos:', error);
    return NextResponse.json(
      { error: 'Error al obtener módulos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { nombre, descripcion, ruta, imagen_url, icono, activo, acepta_subrutas } = body;

    const [result] = await pool.query(
      'INSERT INTO modulos (nombre, descripcion, ruta, imagen_url, icono, activo, acepta_subrutas) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, descripcion, ruta, imagen_url, icono, activo, acepta_subrutas]
    ) as [ResultSetHeader, any];

    return NextResponse.json({ id: result.insertId, ...body });
  } catch (error) {
    console.error('Error al crear módulo:', error);
    return NextResponse.json(
      { error: 'Error al crear módulo' },
      { status: 500 }
    );
  }
} 