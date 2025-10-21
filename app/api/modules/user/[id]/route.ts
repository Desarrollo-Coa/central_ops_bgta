import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const token = request.cookies.get('token');

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await jwtVerify(token.value, new TextEncoder().encode(process.env.JWT_SECRET));

    const userId = params.id;

    // Obtener todos los módulos disponibles
    const [modules] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM modulos WHERE activo = TRUE ORDER BY nombre'
    );

    // Obtener módulos asignados al usuario
    const [assignedModules] = await pool.query<RowDataPacket[]>(
      `SELECT m.id 
       FROM modulos m
       INNER JOIN usuarios_modulos um ON m.id = um.modulo_id
       WHERE um.user_id = ? AND um.permitido = TRUE`,
      [userId]
    );

    const assignedModuleIds = assignedModules.map(m => m.id);

    return NextResponse.json({
      availableModules: modules,
      assignedModules: assignedModuleIds
    });
  } catch (error) {
    console.error('Error al obtener módulos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los módulos' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const token = request.cookies.get('token');

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await jwtVerify(token.value, new TextEncoder().encode(process.env.JWT_SECRET));

    const userId = params.id;
    
    if (!userId || userId === 'null') {
      return NextResponse.json(
        { error: 'ID de usuario no válido' },
        { status: 400 }
      );
    }

    const { selectedModules } = await request.json();

    if (!Array.isArray(selectedModules)) {
      return NextResponse.json(
        { error: 'Formato de módulos inválido' },
        { status: 400 }
      );
    }

    // Iniciar transacción
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Eliminar asignaciones existentes
      await connection.query(
        'DELETE FROM usuarios_modulos WHERE user_id = ?',
        [userId]
      );

      // Insertar nuevas asignaciones
      if (selectedModules.length > 0) {
        const values = selectedModules.map(moduleId => [parseInt(userId), parseInt(moduleId), true]);
        await connection.query(
          'INSERT INTO usuarios_modulos (user_id, modulo_id, permitido) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({
        message: 'Módulos actualizados exitosamente'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error al guardar módulos:', error);
    return NextResponse.json(
      { error: 'Error al guardar los módulos' },
      { status: 500 }
    );
  }
} 