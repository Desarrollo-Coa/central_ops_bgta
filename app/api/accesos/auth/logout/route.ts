import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function POST(request: NextRequest) {
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

      // No necesitamos eliminar de user_sessions porque los vigilantes no están en esa tabla
      // El logout se maneja solo eliminando el token del localStorage en el frontend

      return NextResponse.json({
        success: true,
        message: 'Sesión cerrada correctamente'
      });

    } catch (jwtError) {
      console.error('Error verificando JWT:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 