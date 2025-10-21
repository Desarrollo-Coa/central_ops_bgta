import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT nombre FROM roles');
    console.log('Roles obtenidos:', rows);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error al obtener roles:', err);
    return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 });
  }
} 