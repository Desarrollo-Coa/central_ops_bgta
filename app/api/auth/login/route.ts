import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2/promise';
import { SignJWT } from 'jose';
import { randomBytes } from 'crypto';

// Clave secreta para JWT
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'tu_clave_secreta_aqui');

// Interfaz para tipar las filas devueltas por las consultas
interface RoleRow extends RowDataPacket { // Extendemos RowDataPacket
  id: number;
}

interface UserRow extends RowDataPacket { // Extendemos RowDataPacket
  id: number;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  password: string;
  role_id: number;
}

// Función para asegurar que exista un usuario administrador
async function ensureAdminExists() {
  const connection = await pool.getConnection();
  try {
    console.log('🔍 Verificando existencia de administrador...');
    const adminEmail = 'admin@central.com';
    const adminUsername = 'admin';
    
    // Verificar si existe por email o username
    const [existingAdmin] = await connection.query<UserRow[]>(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [adminEmail, adminUsername]
    );

    if (existingAdmin.length === 0) {
      console.log('❌ No se encontró administrador, creando uno nuevo...');
      
      // Verificar que existe el rol Administrador
      const [roleRows] = await connection.query<RoleRow[]>(
        'SELECT id FROM roles WHERE nombre = ?',
        ['Administrador']
      );
      const roleId = roleRows[0]?.id;

      if (!roleId) {
        console.error('❌ Rol Administrador no encontrado');
        throw new Error('Rol Administrador no encontrado');
      }

      // Crear contraseña hasheada
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      // Insertar usuario administrador
      await connection.query(
        `INSERT INTO users (
          nombre,
          apellido, 
          username,
          email,
          password,
          role_id,
          activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'COA',
          'Principal',
          adminUsername,
          adminEmail,
          hashedPassword,
          roleId,
          1
        ]
      );

      console.log('✅ Usuario administrador creado exitosamente:');
      console.log('   📧 Email:', adminEmail);
      console.log('   👤 Username:', adminUsername);
      console.log('   🔑 Contraseña: Admin123!');
    } else {
      console.log('✅ Administrador ya existe con email:', adminEmail);
    }
  } catch (error) {
    console.error('❌ Error al asegurar administrador:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Interfaz para tipar el usuario devuelto por la consulta
interface User extends RowDataPacket { // Extendemos RowDataPacket
  id: number;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

export async function POST(request: Request) {
  try {
    // Asegurar que existe un usuario administrador
    await ensureAdminExists();
    
    const { identifier, password } = await request.json();

    // Buscar usuario por email o username
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT u.*, r.nombre as role 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ? OR u.username = ?`,
      [identifier, identifier]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Verificar contraseña usando bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Generar token JWT usando SECRET_KEY
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      username: user.username,
      role_id: user.role_id,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(SECRET_KEY);

    // Registrar o actualizar sesión del usuario
    const connection = await pool.getConnection();
    try {
      // Verificar si ya existe una sesión para este usuario
      const [existingSessions] = await connection.query<RowDataPacket[]>(
        'SELECT id_session FROM user_sessions WHERE user_id = ?',
        [user.id]
      );

      if (existingSessions.length > 0) {
        // Actualizar sesión existente
        await connection.query(
          'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE user_id = ?',
          [user.id]
        );
        console.log(`Sesión actualizada para usuario ID: ${user.id}`);
      } else {
        // Crear nueva sesión con token único
        const sessionToken = randomBytes(32).toString('hex');
        await connection.query(
          'INSERT INTO user_sessions (user_id, session_token) VALUES (?, ?)',
          [user.id, sessionToken]
        );
        console.log(`Nueva sesión creada para usuario ID: ${user.id}`);
      }
    } catch (error) {
      console.error('Error al registrar sesión:', error);
    } finally {
      connection.release();
    }

    // Devolver información del usuario (sin la contraseña)
    const { password: _, ...userWithoutPassword } = user;

    console.log('Datos del usuario enviados:', userWithoutPassword);

    // Crear la respuesta
    const response = NextResponse.json({
      message: 'Login exitoso',
      user: userWithoutPassword
    });

    // Establecer cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 // 8 horas
    });

    return response;

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error al procesar el login' },
      { status: 500 }
    );
  }
}