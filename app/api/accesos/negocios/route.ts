import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Traer negocios y su código de acceso más reciente
    const [rows] = await pool.query(`
      SELECT n.id_negocio, n.nombre_negocio, n.activo,
        c.codigo_acceso_hash
      FROM negocios n
      LEFT JOIN (
        SELECT c1.*
        FROM codigos_seguridad_negocio c1
        LEFT JOIN codigos_seguridad_negocio c2
          ON c1.id_negocio = c2.id_negocio 
          AND c2.id_codigo > c1.id_codigo
        WHERE c2.id_codigo IS NULL
      ) c ON n.id_negocio = c.id_negocio
      ORDER BY n.id_negocio ASC
    `);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al obtener negocios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener negocios' }, 
      { status: 500 }
    );
  }
} 