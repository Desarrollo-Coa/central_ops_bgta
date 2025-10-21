// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { randomBytes } from 'crypto';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'tu_clave_secreta_aqui');

interface UserRow extends RowDataPacket {
  id: number;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  role_id: number;
  role_name: string;
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, SECRET_KEY);

    // Obtener datos actualizados del usuario
    const [users] = await pool.query<UserRow[]>(
      `SELECT u.*, r.nombre as role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [payload.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Actualizar la sesión del usuario
    const connection = await pool.getConnection();
    try {
      // Verificar si ya existe una sesión para este usuario
      const [existingSessions] = await connection.query<RowDataPacket[]>(
        'SELECT id_session FROM user_sessions WHERE user_id = ?',
        [payload.id]
      );

      if (existingSessions.length > 0) {
        // Actualizar sesión existente
        await connection.query(
          'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE user_id = ?',
          [payload.id]
        );
      } else {
        // Crear nueva sesión con token único
        const sessionToken = randomBytes(32).toString('hex');
        await connection.query(
          'INSERT INTO user_sessions (user_id, session_token) VALUES (?, ?)',
          [payload.id, sessionToken]
        );
      }
    } catch (error) {
      console.error('Error al actualizar sesión:', error);
    } finally {
      connection.release();
    }

    const user = users[0];
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error al verificar token:', error);
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }
}