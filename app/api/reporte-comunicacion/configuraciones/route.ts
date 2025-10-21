import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Obtener todas las configuraciones por negocio (ordenadas por fecha_inicial ascendente)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const negocioId = searchParams.get('negocioId');
    if (!negocioId) {
      return NextResponse.json({ error: 'Falta el parámetro negocioId' }, { status: 400 });
    }
    const [rows] = await pool.query('SELECT * FROM configuracion_reportes_comunicacion WHERE id_negocio = ? ORDER BY fecha_inicial ASC', [negocioId]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    return NextResponse.json({ error: 'Error al obtener configuraciones' }, { status: 500 });
  }
}

// Crear una nueva configuración
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[POST /api/reporte-comunicacion/configuraciones] Body recibido:', body);
    const { fecha_inicial, cantidad_diurno, cantidad_nocturno, negocioId } = body;
    if (!fecha_inicial || cantidad_diurno === undefined || cantidad_nocturno === undefined || !negocioId) {
      console.log('[POST] Faltan campos obligatorios:', { fecha_inicial, cantidad_diurno, cantidad_nocturno, negocioId });
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }
    const [result] = await pool.query(
      'INSERT INTO configuracion_reportes_comunicacion (fecha_inicial, cantidad_diurno, cantidad_nocturno, id_negocio) VALUES (?, ?, ?, ?)',
      [fecha_inicial, cantidad_diurno, cantidad_nocturno, negocioId]
    );
    console.log('[POST] Configuración creada con id:', (result as any).insertId);
    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error: any) {
    console.error('[POST] Error al crear configuración:', error);
    if (error.code === 'ER_DUP_ENTRY' || (error.sqlMessage && error.sqlMessage.includes('unique_fecha_negocio'))) {
      return NextResponse.json({ error: 'Ya existe una configuración para este día y negocio.' }, { status: 400 });
    }
    if (error.code === 'ER_WARN_DATA_OUT_OF_RANGE' || (error.sqlMessage && error.sqlMessage.includes('Out of range value'))) {
      return NextResponse.json({ error: 'El valor ingresado es demasiado grande o inválido para uno de los campos numéricos.' }, { status: 400 });
    }
    if (error.code === 'ER_BAD_NULL_ERROR' || (error.sqlMessage && error.sqlMessage.includes('cannot be null'))) {
      return NextResponse.json({ error: 'Hay campos obligatorios vacíos o nulos.' }, { status: 400 });
    }
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE' || (error.sqlMessage && error.sqlMessage.includes('Incorrect'))) {
      return NextResponse.json({ error: 'Uno de los valores ingresados no es válido.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear configuración' }, { status: 500 });
  }
}

// Actualizar una configuración existente
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('[PUT /api/reporte-comunicacion/configuraciones] Body recibido:', body);
    const { id, fecha_inicial, cantidad_diurno, cantidad_nocturno, negocioId } = body;
    if (!id || !fecha_inicial || cantidad_diurno === undefined || cantidad_nocturno === undefined || !negocioId) {
      console.log('[PUT] Faltan campos obligatorios:', { id, fecha_inicial, cantidad_diurno, cantidad_nocturno, negocioId });
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }
    await pool.query(
      'UPDATE configuracion_reportes_comunicacion SET fecha_inicial = ?, cantidad_diurno = ?, cantidad_nocturno = ?, id_negocio = ? WHERE id = ?',
      [fecha_inicial, cantidad_diurno, cantidad_nocturno, negocioId, id]
    );
    console.log('[PUT] Configuración actualizada:', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PUT] Error al actualizar configuración:', error);
    if (error.code === 'ER_DUP_ENTRY' || (error.sqlMessage && error.sqlMessage.includes('unique_fecha_negocio'))) {
      return NextResponse.json({ error: 'Ya existe una configuración para este día y negocio.' }, { status: 400 });
    }
    if (error.code === 'ER_WARN_DATA_OUT_OF_RANGE' || (error.sqlMessage && error.sqlMessage.includes('Out of range value'))) {
      return NextResponse.json({ error: 'El valor ingresado es demasiado grande o inválido para uno de los campos numéricos.' }, { status: 400 });
    }
    if (error.code === 'ER_BAD_NULL_ERROR' || (error.sqlMessage && error.sqlMessage.includes('cannot be null'))) {
      return NextResponse.json({ error: 'Hay campos obligatorios vacíos o nulos.' }, { status: 400 });
    }
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE' || (error.sqlMessage && error.sqlMessage.includes('Incorrect'))) {
      return NextResponse.json({ error: 'Uno de los valores ingresados no es válido.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}

// Eliminar una configuración
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('[DELETE /api/reporte-comunicacion/configuraciones] id recibido:', id);
    if (!id) {
      console.log('[DELETE] Falta el id');
      return NextResponse.json({ error: 'Falta el id' }, { status: 400 });
    }
    await pool.query('DELETE FROM configuracion_reportes_comunicacion WHERE id = ?', [id]);
    console.log('[DELETE] Configuración eliminada:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE] Error al eliminar configuración:', error);
    return NextResponse.json({ error: 'Error al eliminar configuración' }, { status: 500 });
  }
} 