import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import Hashids from 'hashids';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const negocioHash = searchParams.get('negocioHash');

    if (!negocioHash) {
      return NextResponse.json(
        { error: 'Hash de negocio requerido' },
        { status: 400 }
      );
    }

    // Decodificar el hash para obtener el ID del negocio
    const hashids = new Hashids(process.env.HASHIDS_SALT || 'accesos_salt', 8);
    const ids = hashids.decode(negocioHash);
    
    if (!ids.length) {
      return NextResponse.json(
        { error: 'Hash de negocio inválido' },
        { status: 400 }
      );
    }
    
    const id_negocio = ids[0];

    // Obtener puestos disponibles del negocio
    const [puestos] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id_puesto,
        p.nombre_puesto,
        un.nombre_unidad
       FROM puestos p
       JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
       WHERE un.id_negocio = ? AND p.activo = TRUE
       ORDER BY un.nombre_unidad, p.nombre_puesto`,
      [id_negocio]
    );

    return NextResponse.json(puestos);

  } catch (error) {
    console.error('Error obteniendo puestos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 