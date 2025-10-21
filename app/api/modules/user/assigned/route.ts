export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    const userId = payload.id;

    // Obtener módulos asignados al usuario
    const [modules] = await pool.query<RowDataPacket[]>(
      `SELECT m.* 
       FROM modulos m
       INNER JOIN usuarios_modulos um ON m.id = um.modulo_id
       WHERE um.user_id = ? AND um.permitido = TRUE AND m.activo = TRUE
       ORDER BY m.nombre`,
      [userId]
    );

    return NextResponse.json(modules);
  } catch (error) {
    console.error('Error al obtener módulos asignados:', error);
    return NextResponse.json(
      { error: 'Error al obtener los módulos asignados' },
      { status: 500 }
    );
  }
} 