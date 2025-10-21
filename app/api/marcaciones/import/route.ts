import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  
  try {
    const { inserts } = await request.json();

    if (!inserts || !Array.isArray(inserts)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const exitos: any[] = [];
    const errores: any[] = [];

    // Procesar cada registro individualmente
    for (const item of inserts) {
      try {
        // Verificar si ya existe un registro con el mismo id_origen
        const [existingRows] = await connection.query(
          'SELECT id FROM puntos_marcacion WHERE id_origen = ? AND id_cliente = ?',
          [item.id_origen, item.id_cliente]
        );

        if (Array.isArray(existingRows) && existingRows.length > 0) {
          // Registro duplicado
          errores.push({
            id_origen: item.id_origen,
            error: 'Registro duplicado - ya existe en la base de datos'
          });
          continue;
        }

        // Validar datos requeridos
        if (!item.id_origen || !item.punto_marcacion || !item.fecha || !item.hora_marcacion || !item.usuario || !item.nombre) {
          errores.push({
            id_origen: item.id_origen || 'N/A',
            error: 'Datos incompletos - faltan campos requeridos'
          });
          continue;
        }

        // Validar formato de fecha
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(item.fecha)) {
          errores.push({
            id_origen: item.id_origen,
            error: 'Formato de fecha inválido - debe ser YYYY-MM-DD'
          });
          continue;
        }

        // Validar formato de hora
        const horaRegex = /^\d{2}:\d{2}:\d{2}$/;
        if (!horaRegex.test(item.hora_marcacion)) {
          errores.push({
            id_origen: item.id_origen,
            error: 'Formato de hora inválido - debe ser HH:MM:SS'
          });
          continue;
        }

        // Insertar el registro
        const [result] = await connection.query(
          'INSERT INTO puntos_marcacion (id_cliente, id_origen, punto_marcacion, fecha, hora_marcacion, usuario, nombre) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.id_cliente, item.id_origen, item.punto_marcacion, item.fecha, item.hora_marcacion, item.usuario, item.nombre]
        );

        exitos.push({
          id_origen: item.id_origen,
          punto_marcacion: item.punto_marcacion,
          fecha: item.fecha,
          hora_marcacion: item.hora_marcacion,
          usuario: item.usuario,
          nombre: item.nombre
        });

      } catch (error) {
        console.error('Error procesando registro:', error);
        errores.push({
          id_origen: item.id_origen || 'N/A',
          error: error instanceof Error ? error.message : 'Error desconocido al procesar el registro'
        });
      }
    }

    return NextResponse.json({ 
      message: 'Procesamiento completado',
      exitos,
      errores,
      total: inserts.length,
      exitosos: exitos.length,
      conError: errores.length
    });

  } catch (error) {
    console.error('Error en la importación:', error);
    return NextResponse.json(
      { error: 'Error al procesar los datos' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 