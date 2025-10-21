import { NextRequest, NextResponse } from 'next/server';
import { getVigilanteTokenFromRequest } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const token = getVigilanteTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const id_puesto = searchParams.get('id_puesto');
    const id_tipo_turno = searchParams.get('id_tipo_turno');
    const id_colaborador = searchParams.get('id_colaborador');

    if (!fecha || !id_puesto || !id_tipo_turno || !id_colaborador) {
      return NextResponse.json(
        { error: 'Se requieren fecha, id_puesto, id_tipo_turno e id_colaborador' },
        { status: 400 }
      );
    }

    // Buscar el cumplido específico
    const [cumplidos] = await pool.query<RowDataPacket[]>(
      `SELECT id_cumplido, fecha, id_puesto, id_tipo_turno, id_colaborador
       FROM cumplidos 
       WHERE fecha = ? AND id_puesto = ? AND id_tipo_turno = ? AND id_colaborador = ?`,
      [fecha, id_puesto, id_tipo_turno, id_colaborador]
    );

    if (!cumplidos.length) {
      return NextResponse.json({ id_cumplido: null });
    }

    return NextResponse.json({ id_cumplido: cumplidos[0].id_cumplido });
  } catch (error) {
    console.error('Error buscando cumplido:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 