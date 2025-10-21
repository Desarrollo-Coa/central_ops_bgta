import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT id_tipo_turno, nombre_tipo_turno FROM tipos_turno ORDER BY FIELD(id_tipo_turno, 1, 3, 2);');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al obtener tipos de turno:', error);
    return NextResponse.json({ error: 'Error al obtener tipos de turno' }, { status: 500 });
  }
} 