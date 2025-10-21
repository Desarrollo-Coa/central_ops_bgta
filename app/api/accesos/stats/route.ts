import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

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
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Obtener días trabajados en el mes actual
      const [diasTrabajados] = await pool.query(`
        SELECT COUNT(DISTINCT fecha) as dias_trabajados
        FROM cumplidos 
        WHERE id_colaborador = ? 
        AND MONTH(fecha) = ? 
        AND YEAR(fecha) = ?
        AND id_colaborador IS NOT NULL
      `, [colaboradorId, currentMonth, currentYear]) as [any[], any];

      const diasTrabajadosCount = diasTrabajados[0]?.dias_trabajados || 0;

      return NextResponse.json({
        dias_activo: diasTrabajadosCount
      });

    } catch (jwtError) {
      console.error('Error verificando JWT:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 