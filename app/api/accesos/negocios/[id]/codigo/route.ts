import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const id_negocio = parseInt(id);
    
    if (isNaN(id_negocio)) {
      return NextResponse.json(
        { error: 'ID de negocio inválido' }, 
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      'SELECT codigo_acceso_hash FROM codigos_seguridad_negocio WHERE id_negocio = ? AND activo = 1 LIMIT 1',
      [id_negocio]
    );
    
    return NextResponse.json((rows as any[])[0] || {});
  } catch (error) {
    console.error('Error al obtener código:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener código' }, 
      { status: 500 }
    );
  }
}

// POST: Generar nuevo código
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const id_negocio = parseInt(id);
    
    if (isNaN(id_negocio)) {
      return NextResponse.json(
        { error: 'ID de negocio inválido' }, 
        { status: 400 }
      );
    }

    // Verificar que el negocio existe
    const [negocios] = await pool.query(
      'SELECT id_negocio, nombre_negocio FROM negocios WHERE id_negocio = ?',
      [id_negocio]
    );

    if ((negocios as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' }, 
        { status: 404 }
      );
    }

    const codigoPlano = generarCodigo();

    // Eliminar códigos anteriores completamente
    await pool.query(
      'DELETE FROM codigos_seguridad_negocio WHERE id_negocio = ?',
      [id_negocio]
    );

    // Insertar solo el código plano
    await pool.query(
      'INSERT INTO codigos_seguridad_negocio (id_negocio, codigo_acceso_hash, activo) VALUES (?, ?, 1)',
      [id_negocio, codigoPlano]
    );

    return NextResponse.json({ 
      codigo: codigoPlano,
      mensaje: 'Código generado exitosamente',
      negocio: (negocios as any[])[0]
    });
  } catch (error) {
    console.error('Error al generar código:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al generar código' }, 
      { status: 500 }
    );
  }
}

// PUT: Eliminar el código activo
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const id_negocio = parseInt(id);
    
    if (isNaN(id_negocio)) {
      return NextResponse.json(
        { error: 'ID de negocio inválido' }, 
        { status: 400 }
      );
    }

    // Verificar que el negocio existe
    const [negocios] = await pool.query(
      'SELECT id_negocio FROM negocios WHERE id_negocio = ?',
      [id_negocio]
    );

    if ((negocios as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' }, 
        { status: 404 }
      );
    }

    // Eliminar el código activo
    const [result] = await pool.query(
      'DELETE FROM codigos_seguridad_negocio WHERE id_negocio = ? AND activo = 1',
      [id_negocio]
    );

    return NextResponse.json({ 
      success: true,
      mensaje: 'Código eliminado correctamente',
      afectados: (result as any).affectedRows
    });
  } catch (error) {
    console.error('Error al eliminar código:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar código' }, 
      { status: 500 }
    );
  }
}

// DELETE: Eliminar el código activo (mismo comportamiento que PUT)
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const id_negocio = parseInt(id);
    
    if (isNaN(id_negocio)) {
      return NextResponse.json(
        { error: 'ID de negocio inválido' }, 
        { status: 400 }
      );
    }

    // Verificar que el negocio existe
    const [negocios] = await pool.query(
      'SELECT id_negocio FROM negocios WHERE id_negocio = ?',
      [id_negocio]
    );

    if ((negocios as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' }, 
        { status: 404 }
      );
    }

    const [result] = await pool.query(
      'DELETE FROM codigos_seguridad_negocio WHERE id_negocio = ? AND activo = 1',
      [id_negocio]
    );

    return NextResponse.json({ 
      success: true,
      mensaje: 'Código eliminado correctamente',
      afectados: (result as any).affectedRows
    });
  } catch (error) {
    console.error('Error al eliminar código:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar código' }, 
      { status: 500 }
    );
  }
} 