import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import Hashids from 'hashids';

interface Colaborador extends RowDataPacket {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  foto_url?: string;
  activo: boolean;
}

interface Negocio extends RowDataPacket {
  id_negocio: number;
  nombre_negocio: string;
  codigo_acceso_hash: string;
}

export async function POST(request: NextRequest) {
  try {
    const { cedula, codigo_acceso, negocio_hash } = await request.json();

    console.log('Login vigilante - Datos recibidos:', { cedula, codigo_acceso: '***', negocio_hash });

    if (!cedula || !codigo_acceso || !negocio_hash) {
      return NextResponse.json(
        { error: 'Cédula, código de acceso y hash de negocio son requeridos' },
        { status: 400 }
      );
    }

    // Decodificar el hash para obtener el ID del negocio
    const hashids = new Hashids(process.env.HASHIDS_SALT || 'accesos_salt', 8);
    const ids = hashids.decode(negocio_hash);
    
    if (!ids.length) {
      return NextResponse.json(
        { error: 'Hash de negocio inválido' },
        { status: 400 }
      );
    }
    
    const id_negocio = ids[0];
    
    // Verificar que el negocio existe y obtener su código de acceso
    const [negocios] = await pool.query<Negocio[]>(
      `SELECT n.id_negocio, n.nombre_negocio, csn.codigo_acceso_hash
       FROM negocios n
       INNER JOIN codigos_seguridad_negocio csn ON n.id_negocio = csn.id_negocio
       WHERE n.id_negocio = ? AND csn.activo = TRUE AND n.activo = TRUE`,
      [id_negocio]
    );

    console.log('Negocios encontrados:', negocios.length);

    if (!negocios.length) {
      // Verificar si el negocio existe pero no tiene código de acceso
      const [negociosSinCodigo] = await pool.query<RowDataPacket[]>(
        `SELECT n.id_negocio, n.nombre_negocio
         FROM negocios n
         WHERE n.id_negocio = ? AND n.activo = TRUE`,
        [id_negocio]
      );
      
      console.log('Negocios sin código de acceso:', negociosSinCodigo);
      
      return NextResponse.json(
        { error: 'Código de acceso inválido o negocio inactivo' },
        { status: 401 }
      );
    }

    const negocio = negocios[0];
    console.log('Negocio encontrado:', { id: negocio.id_negocio, nombre: negocio.nombre_negocio });

    // Verificar que el colaborador existe y está activo (por cédula o placa)
    const [colaboradores] = await pool.query<Colaborador[]>(
      `SELECT id, nombre, apellido, cedula, foto_url, activo
       FROM colaboradores
       WHERE (cedula = ? OR placa = ?) AND activo = TRUE`,
      [cedula, cedula]
    );

    console.log('Colaboradores encontrados:', colaboradores.length);

    if (!colaboradores.length) {
      return NextResponse.json(
        { error: 'Colaborador no encontrado o inactivo' },
        { status: 401 }
      );
    }

    const colaborador = colaboradores[0];
    console.log('Colaborador encontrado:', { id: colaborador.id, nombre: colaborador.nombre });

    // Verificar que el código de acceso coincide
    const codigoValido = codigo_acceso === negocio.codigo_acceso_hash;
    console.log('Código válido:', codigoValido);
    
    if (!codigoValido) {
      return NextResponse.json(
        { error: 'Código de acceso incorrecto' },
        { status: 401 }
      );
    }

    // Generar token JWT con expiración de 12 horas
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({
      id: colaborador.id,
      nombre: colaborador.nombre,
      apellido: colaborador.apellido,
      cedula: colaborador.cedula,
      foto_url: colaborador.foto_url,
      negocio: {
        id: negocio.id_negocio,
        nombre: negocio.nombre_negocio
      },
      tipo: 'vigilante'
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .sign(secret);

    console.log('Login exitoso para vigilante:', colaborador.nombre);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: colaborador.id,
        nombre: colaborador.nombre,
        apellido: colaborador.apellido,
        cedula: colaborador.cedula,
        foto_url: colaborador.foto_url,
        negocio: {
          id: negocio.id_negocio,
          nombre: negocio.nombre_negocio
        }
      }
    });

  } catch (error) {
    console.error('Error en login de vigilante:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 