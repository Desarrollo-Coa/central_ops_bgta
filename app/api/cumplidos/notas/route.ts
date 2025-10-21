import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idCumplido = searchParams.get('idCumplido');

    if (!idCumplido) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro idCumplido' },
        { status: 400 }
      );
    }

    const [notas] = await pool.query(
      'SELECT * FROM notas_cumplidos WHERE id_cumplido = ?',
      [parseInt(idCumplido)]
    );

    return NextResponse.json(notas);
  } catch (error) {
    console.error('Error al obtener notas:', error);
    return NextResponse.json(
      { error: 'Error al obtener las notas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idCumplido, nota } = body;

    if (!idCumplido) {
      return NextResponse.json(
        { error: 'Se requiere idCumplido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una nota para este cumplido
    const [existing] = await pool.query(
      'SELECT id_nota FROM notas_cumplidos WHERE id_cumplido = ?',
      [idCumplido]
    ) as [any[], any];

    if (existing && existing.length > 0) {
      if (nota) {
        // Actualizar nota existente
        await pool.query(
          'UPDATE notas_cumplidos SET nota = ? WHERE id_cumplido = ?',
          [nota, idCumplido]
        );
      } else {
        // Eliminar nota si está vacía
        await pool.query(
          'DELETE FROM notas_cumplidos WHERE id_cumplido = ?',
          [idCumplido]
        );
        // Después de eliminar la nota, verificar si el cumplido tiene colaborador vacío o null
        const [cumplido] = await pool.query(
          'SELECT nombre_colaborador FROM cumplidos WHERE id_cumplido = ?',
          [idCumplido]
        ) as [any[], any];
        if (cumplido && cumplido.length > 0) {
          const nombre_colaborador = cumplido[0].nombre_colaborador;
          if (nombre_colaborador === null || nombre_colaborador === undefined || nombre_colaborador.trim() === '') {
            await pool.query(
              'DELETE FROM cumplidos WHERE id_cumplido = ?',
              [idCumplido]
            );
          }
        }
      }
    } else if (nota) {
      // Crear nueva nota
      await pool.query(
        'INSERT INTO notas_cumplidos (id_cumplido, nota) VALUES (?, ?)',
        [idCumplido, nota]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al guardar nota:', error);
    return NextResponse.json(
      { error: 'Error al guardar la nota' },
      { status: 500 }
    );
  }
} 