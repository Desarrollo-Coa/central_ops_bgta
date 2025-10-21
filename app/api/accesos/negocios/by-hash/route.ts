import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import Hashids from 'hashids';

const hashids = new Hashids(process.env.HASHIDS_SALT || 'default_salt', 8);

export async function GET(req: NextRequest) {
  try {
    const hash = req.nextUrl.searchParams.get('hash');
    if (!hash) return NextResponse.json({ error: 'Hash requerido' }, { status: 400 });

    console.log('Hash recibido:', hash);
    console.log('HASHIDS_SALT:', process.env.HASHIDS_SALT);
    
    const ids = hashids.decode(hash);
    console.log('IDs decodificados:', ids);
    
    if (!ids.length) return NextResponse.json({ error: 'Hash inválido' }, { status: 404 });

    const id_negocio = ids[0];
    console.log('ID del negocio:', id_negocio);
    
    // Verificar conexión a la base de datos
    console.log('Verificando conexión a la base de datos...');
    
    // Traer el negocio y su código activo
    const [rows] = await pool.query(
      `SELECT n.id_negocio, n.nombre_negocio, c.codigo_acceso_hash
       FROM negocios n
       LEFT JOIN codigos_seguridad_negocio c
         ON n.id_negocio = c.id_negocio AND c.activo = 1
       WHERE n.id_negocio = ?`,
      [id_negocio]
    );
    const negocios = rows as any[];
    console.log('Negocios encontrados:', negocios.length);
    console.log('Datos de negocios:', negocios);
    
    if (negocios.length === 0) {
      // Verificar si el negocio existe sin código
      const [negociosSinCodigo] = await pool.query(
        `SELECT n.id_negocio, n.nombre_negocio
         FROM negocios n
         WHERE n.id_negocio = ?`,
        [id_negocio]
      );
      console.log('Negocios sin código:', negociosSinCodigo);
      
      if ((negociosSinCodigo as any[]).length === 0) {
        return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
      } else {
        const negocio = (negociosSinCodigo as any[])[0];
        return NextResponse.json({
          ...negocio,
          code: "",
        });
      }
    }

    // Mapear el código como 'code'
    const negocio = negocios[0];
    return NextResponse.json({
      ...negocio,
      code: negocio.codigo_acceso_hash || "",
    });
  } catch (error) {
    console.error('Error en by-hash:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 