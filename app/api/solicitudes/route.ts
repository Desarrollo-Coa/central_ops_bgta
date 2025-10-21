// app/api/solicitudes/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import bcrypt from 'bcryptjs';
import { RowDataPacket, ResultSetHeader } from 'mysql2'; // Añadimos ResultSetHeader

interface SolicitudRow extends RowDataPacket {
  id?: number;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  password: string;
  raw_password?: string;
  cargo?: string;
  comentario?: string;
  estado?: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_solicitud?: string;
}

interface RoleRow extends RowDataPacket {
  id: number;
}

interface UserRow extends RowDataPacket {
  email: string;
  username: string;
}

export async function GET() {
  try {
    const [rows] = await pool.query<SolicitudRow[]>('SELECT * FROM solicitudes_cuenta');
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error fetching solicitudes:', err);
    return NextResponse.json({ error: 'Error fetching solicitudes' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { id, role } = await request.json();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [solicitudRows] = await connection.query<SolicitudRow[]>(
      'SELECT nombre, apellido, username, email, password FROM solicitudes_cuenta WHERE id = ?',
      [id]
    );
    const solicitud = solicitudRows[0];

    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    const [roleRows] = await connection.query<RoleRow[]>(
      'SELECT id FROM roles WHERE nombre = ?',
      [role]
    );
    const roleData = roleRows[0];

    if (!roleData) {
      throw new Error('Rol no encontrado');
    }

    await connection.query(
      `INSERT INTO users (nombre, apellido, username, email, password, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        solicitud.nombre,
        solicitud.apellido,
        solicitud.username,
        solicitud.email,
        solicitud.password,
        roleData.id
      ]
    );

    await connection.query(
      'UPDATE solicitudes_cuenta SET estado = "aprobado" WHERE id = ?',
      [id]
    );

    await connection.commit();
    return NextResponse.json({ message: 'Solicitud aprobada y usuario creado' });
  } catch (err) {
    await connection.rollback();
    console.error('Error approving solicitud:', err);
    return NextResponse.json(
      { error: `Error al aprobar la solicitud: ${(err as Error).message}` },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  try {
    await pool.query(
      'UPDATE solicitudes_cuenta SET estado = "rechazado" WHERE id = ?',
      [id]
    );
    return NextResponse.json({ message: 'Solicitud rechazada' });
  } catch (err) {
    console.error('Error rejecting solicitud:', err);
    return NextResponse.json({ error: 'Error rejecting solicitud' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const body = await request.json();
    const { nombre, apellido, email, cargo, comentario, password } = body;

    if (!nombre || !apellido || !email || !cargo || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const username = email.split('@')[0];

    const [existingUser] = await connection.query<UserRow[]>(
      'SELECT email, username FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      const user = existingUser[0];
      if (user.email === email) {
        return NextResponse.json(
          { error: 'Este correo electrónico ya está registrado en el sistema' },
          { status: 400 }
        );
      }
      if (user.username === username) {
        return NextResponse.json(
          { error: 'Este nombre de usuario ya está registrado en el sistema' },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const encryptedRawPassword = encrypt(password);

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO solicitudes_cuenta 
       (nombre, apellido, username, email, password, raw_password, cargo, comentario) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        apellido,
        username,
        email,
        hashedPassword,
        encryptedRawPassword,
        cargo,
        comentario || ''
      ]
    );

    await connection.commit();
    return NextResponse.json({
      message: 'Solicitud creada exitosamente',
      id: result.insertId
    }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating solicitud:', error);
    return NextResponse.json(
      { error: 'Error al crear la solicitud' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}