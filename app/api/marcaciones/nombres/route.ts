import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id_cliente = searchParams.get('id_cliente');
  if (!id_cliente) {
    return NextResponse.json([], { status: 200 });
  }
  const [rows] = await pool.query(
    'SELECT DISTINCT punto_marcacion FROM puntos_marcacion WHERE id_cliente = ? ORDER BY punto_marcacion',
    [id_cliente]
  );
  return NextResponse.json(rows);
} 