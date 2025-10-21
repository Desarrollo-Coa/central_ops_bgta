import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_negocio = searchParams.get('id_negocio');

    if (!id_negocio) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro id_negocio' },
        { status: 400 }
      );
    }

    const [unidades] = await pool.query<RowDataPacket[]>(
      'SELECT id_unidad, nombre_unidad FROM unidades_negocio WHERE id_negocio = ? ORDER BY nombre_unidad',
      [parseInt(id_negocio)]
    );

    return NextResponse.json(unidades);
  } catch (error) {
    console.error('Error al obtener unidades de negocio:', error);
    return NextResponse.json(
      { error: 'Error al obtener las unidades de negocio' },
      { status: 500 }
    );
  }
}
