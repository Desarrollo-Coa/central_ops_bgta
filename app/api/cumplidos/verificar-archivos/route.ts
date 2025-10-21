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
    const idCumplido = searchParams.get('idCumplido');

    if (!idCumplido) {
      return NextResponse.json(
        { error: 'Se requiere idCumplido' },
        { status: 400 }
      );
    }

    console.log('Verificando archivos para cumplido:', idCumplido);

    // Verificar si hay archivos asociados al cumplido
    const [archivos] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total_archivos
       FROM file_rc f
       INNER JOIN tipo_archivo ta ON f.tipo_id = ta.id
       WHERE f.id_cumplido = ?`,
      [idCumplido]
    );

    const totalArchivos = archivos[0]?.total_archivos || 0;
    console.log('Total de archivos encontrados:', totalArchivos);

    return NextResponse.json({ 
      tieneArchivos: totalArchivos > 0,
      totalArchivos: totalArchivos
    });

  } catch (error) {
    console.error('Error verificando archivos del cumplido:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 