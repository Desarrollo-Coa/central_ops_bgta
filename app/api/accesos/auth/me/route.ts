import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { jwtVerify } from 'jose';
import { RowDataPacket } from 'mysql2/promise';

interface Colaborador extends RowDataPacket {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  foto_url?: string;
  activo: boolean;
}

interface Puesto extends RowDataPacket {
  id_puesto: number;
  nombre_puesto: string;
  id_unidad: number;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const negocioHash = request.headers.get('x-negocio-hash');

    // Obtener token del header o de cookies
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback: buscar token en cookies de vigilante
      const vigilanteTokenCookie = request.cookies.get('vigilante_token')?.value;
      if (vigilanteTokenCookie) {
        try {
          const sessionData = JSON.parse(vigilanteTokenCookie);
          token = sessionData.token;
        } catch (error) {
          console.error('Error parsing vigilante token:', error);
        }
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    if (!negocioHash) {
      return NextResponse.json(
        { error: 'Hash de negocio requerido' },
        { status: 400 }
      );
    }

    try {
      // Verificar el token JWT
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jwtVerify(token, secret);

      // Verificar que es un token de vigilante
      if (payload.tipo !== 'vigilante') {
        return NextResponse.json(
          { error: 'Token inválido para vigilantes' },
          { status: 401 }
        );
      }

      const colaboradorId = payload.id as number;

      // Verificar que el colaborador sigue activo
      const [colaboradores] = await pool.query<Colaborador[]>(
        `SELECT id, nombre, apellido, cedula, foto_url, activo
         FROM colaboradores
         WHERE id = ? AND activo = TRUE`,
        [colaboradorId]
      );

      if (!colaboradores.length) {
        return NextResponse.json(
          { error: 'Colaborador no encontrado o inactivo' },
          { status: 401 }
        );
      }

      const colaborador = colaboradores[0];

      // Decodificar el hash para obtener el ID del negocio
      const Hashids = require('hashids');
      const hashids = new Hashids(process.env.HASHIDS_SALT || 'accesos_salt', 8);
      const ids = hashids.decode(negocioHash);
      
      if (!ids.length) {
        return NextResponse.json(
          { error: 'Hash de negocio inválido' },
          { status: 400 }
        );
      }
      
      const id_negocio = ids[0];
      
      // Verificar que el negocio sigue activo
      const [negocios] = await pool.query<RowDataPacket[]>(
        'SELECT id_negocio, nombre_negocio, activo FROM negocios WHERE id_negocio = ? AND activo = TRUE',
        [id_negocio]
      );

      if (!negocios.length) {
        return NextResponse.json(
          { error: 'Negocio no encontrado o inactivo' },
          { status: 401 }
        );
      }

      const negocio = negocios[0];

      // Obtener el puesto desde la cookie del request
      const cookies = request.headers.get('cookie') || '';
      const tokenCookie = cookies.split(';').find(cookie => cookie.trim().startsWith('vigilante_token='));
      
      let puestoAsignado = null;
      if (tokenCookie) {
        try {
          const sessionData = JSON.parse(tokenCookie.split('=')[1]);
          if (sessionData.puesto) {
            puestoAsignado = {
              id_puesto: sessionData.puesto.id_puesto,
              nombre_puesto: sessionData.puesto.nombre_puesto,
              id_unidad: sessionData.puesto.id_unidad
            };
          }
        } catch (error) {
          console.error('Error parsing session data:', error);
        }
      }

      return NextResponse.json({
        colaborador: {
          id: colaborador.id,
          nombre: colaborador.nombre,
          apellido: colaborador.apellido,
          cedula: colaborador.cedula,
          foto_url: colaborador.foto_url,
          activo: colaborador.activo
        },
        negocio: {
          id: negocio.id_negocio,
          nombre: negocio.nombre_negocio,
          activo: negocio.activo
        },
        puesto: puestoAsignado
      });
    } catch (jwtError) {
      console.error('Error verificando JWT:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error en /api/accesos/auth/me:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 