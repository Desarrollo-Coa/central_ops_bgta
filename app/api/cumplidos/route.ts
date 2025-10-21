import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const negocioId = searchParams.get('negocioId');
    const fecha = searchParams.get('fecha');

    if (!negocioId || !fecha) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros negocioId y fecha' },
        { status: 400 }
      );
    }

    const fechaObj = new Date(fecha);
    const fechaFormateada = fechaObj.toISOString().split('T')[0];

    const [cumplidos] = await pool.query(`
      SELECT 
        c.*,
        p.nombre_puesto,
        u.nombre_unidad,
        (
          SELECT GROUP_CONCAT(
            CONCAT(
              '{',
              '"id_nota":', n.id_nota, ',',
              '"nota":"', REPLACE(n.nota, '"', '\\"'), '"',
              '}'
            )
          )
          FROM notas_cumplidos n
          WHERE n.id_cumplido = c.id_cumplido
        ) as notas
      FROM cumplidos c
      JOIN puestos p ON c.id_puesto = p.id_puesto
      JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
      WHERE c.fecha = ? AND u.id_negocio = ?
    `, [fechaFormateada, parseInt(negocioId)]);

    // Convertir el resultado en un array
    const cumplidosArray = Array.isArray(cumplidos) ? cumplidos : [cumplidos];

    // Procesar las notas para convertirlas en un formato más manejable
    const cumplidosConNotas = cumplidosArray.map((cumplido: any) => {
      const notas = cumplido.notas ? JSON.parse(`[${cumplido.notas}]`) : [];
      return {
        ...cumplido,
        notas
      };
    });

    return NextResponse.json(cumplidosConNotas);
  } catch (error) {
    console.error('Error al obtener cumplidos:', error);
    return NextResponse.json(
      { error: 'Error al obtener los cumplidos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Error al procesar el JSON del request' },
        { status: 400 }
      );
    }

    const { id_puesto, fecha, id_tipo_turno, nombre_colaborador } = body;

    if (!id_puesto || !fecha || !id_tipo_turno) {
      return NextResponse.json(
        { error: 'Se requieren id_puesto, fecha e id_tipo_turno' },
        { status: 400 }
      );
    }

    // Validar que id_puesto e id_tipo_turno sean números
    if (isNaN(Number(id_puesto)) || isNaN(Number(id_tipo_turno))) {
      return NextResponse.json(
        { error: 'id_puesto e id_tipo_turno deben ser números válidos' },
        { status: 400 }
      );
    }

    let fechaFormateada;
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        throw new Error('Fecha inválida');
      }
      fechaFormateada = fechaObj.toISOString().split('T')[0];
    } catch (e) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un registro para este puesto, fecha y turno
    const [existing] = await pool.query(
      'SELECT id_cumplido FROM cumplidos WHERE id_puesto = ? AND fecha = ? AND id_tipo_turno = ?',
      [id_puesto, fechaFormateada, id_tipo_turno]
    ) as [any[], any];

    if (existing && existing.length > 0) {
      // Si el colaborador es vacío/null, aplicar lógica de limpieza SOLO en actualización
      if (nombre_colaborador === undefined || nombre_colaborador === null || (typeof nombre_colaborador === 'string' && nombre_colaborador.trim() === '')) {
        const registroExistente = existing[0];
        const [notas] = await pool.query(
          'SELECT id_nota FROM notas_cumplidos WHERE id_cumplido = ?',
          [registroExistente.id_cumplido]
        ) as [any[], any];
        if (!notas || notas.length === 0) {
          await pool.query(
            'DELETE FROM cumplidos WHERE id_cumplido = ?',
            [registroExistente.id_cumplido]
          );
          return NextResponse.json({ success: true, deleted: true, id_cumplido: registroExistente.id_cumplido, message: 'Registro eliminado por estar vacío y sin notas' });
        } else {
          await pool.query(
            'UPDATE cumplidos SET nombre_colaborador = NULL WHERE id_cumplido = ?',
            [registroExistente.id_cumplido]
          );
          return NextResponse.json({ success: true, id_cumplido: registroExistente.id_cumplido, message: 'Colaborador limpiado pero registro conservado por tener notas' });
        }
      }
      // Si no, actualizar normalmente
      const registroExistente = existing[0];
      await pool.query(
        `UPDATE cumplidos 
         SET nombre_colaborador = ?
         WHERE id_puesto = ? AND fecha = ? AND id_tipo_turno = ?`,
        [nombre_colaborador || null, id_puesto, fechaFormateada, id_tipo_turno]
      );
      return NextResponse.json({ 
        success: true, 
        id_cumplido: registroExistente.id_cumplido,
        message: 'Registro actualizado correctamente'
      });
    } else {
      // Permitir crear el registro aunque colaborador sea null o vacío
      const [result] = await pool.query(
        `INSERT INTO cumplidos 
         (fecha, id_puesto, id_tipo_turno, nombre_colaborador) 
         VALUES (?, ?, ?, ?)`,
        [fechaFormateada, id_puesto, id_tipo_turno, nombre_colaborador || null]
      ) as [ResultSetHeader, any];
      return NextResponse.json({ 
        success: true, 
        id_cumplido: result.insertId,
        message: 'Registro creado correctamente'
      });
    }
  } catch (error) {
    console.error('Error al guardar cumplido:', error);
    return NextResponse.json(
      { error: 'Error al guardar el cumplido', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}