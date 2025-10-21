import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { jwtVerify } from 'jose';
import { ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const negocioHashHeader = request.headers.get('x-negocio-hash');

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

    if (!negocioHashHeader) {
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
    } catch (jwtError) {
      console.error('Error verificando JWT:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const negocioHash = searchParams.get('negocioHash');
    const idPuesto = searchParams.get('idPuesto');

    if (!fecha || !negocioHash) {
      return NextResponse.json(
        { error: 'Se requieren fecha y negocioHash' },
        { status: 400 }
      );
    }

    if (!idPuesto) {
      return NextResponse.json(
        { error: 'Se requiere idPuesto' },
        { status: 400 }
      );
    }

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

    console.log('Obteniendo turnos para fecha:', fecha, 'negocio:', id_negocio, 'y puesto:', idPuesto);

    // Obtener todos los tipos de turno
    const [tiposTurno] = await pool.query(
      'SELECT id_tipo_turno, nombre_tipo_turno FROM tipos_turno ORDER BY id_tipo_turno'
    ) as [any[], any];

    console.log('Tipos de turno encontrados:', tiposTurno);

    // Obtener turnos ocupados para la fecha específica y puesto específico
    const [turnosOcupados] = await pool.query(`
      SELECT 
        c.id_tipo_turno,
        c.id_colaborador,
        col.nombre,
        col.apellido,
        tt.nombre_tipo_turno
      FROM cumplidos c
      JOIN colaboradores col ON c.id_colaborador = col.id
      JOIN tipos_turno tt ON c.id_tipo_turno = tt.id_tipo_turno
      JOIN puestos p ON c.id_puesto = p.id_puesto
      JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
      WHERE c.fecha = ? 
      AND u.id_negocio = ?
      AND c.id_puesto = ?
      AND c.id_colaborador IS NOT NULL
    `, [fecha, id_negocio, idPuesto]) as [any[], any];

    console.log('Turnos ocupados encontrados:', turnosOcupados);

    // Crear el resultado con todos los tipos de turno y su estado
    const turnos = tiposTurno.map((tipo: any) => {
      const ocupado = turnosOcupados.find((ocupado: any) => ocupado.id_tipo_turno === tipo.id_tipo_turno);
      return {
        id_tipo_turno: tipo.id_tipo_turno,
        nombre_tipo_turno: tipo.nombre_tipo_turno,
        ocupado: !!ocupado,
        colaborador: ocupado ? {
          id: ocupado.id_colaborador,
          nombre: `${ocupado.nombre} ${ocupado.apellido}`
        } : null
      };
    });

    return NextResponse.json(turnos);

  } catch (error) {
    console.error('Error obteniendo turnos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

 