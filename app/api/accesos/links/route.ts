import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import Hashids from 'hashids';

const hashids = new Hashids(process.env.HASHIDS_SALT || 'accesos_salt', 8);

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT id_negocio, nombre_negocio FROM negocios WHERE activo = 1');
    
    const links = (rows as any[]).map((negocio: any) => ({
      ...negocio,
      link: `${process.env.NEXT_PUBLIC_BASE_URL}/accesos/login/${hashids.encode(negocio.id_negocio)}`
    }));
    
    return NextResponse.json(links);
  } catch (error) {
    console.error('Error al obtener links:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener links' }, 
      { status: 500 }
    );
  }
} 