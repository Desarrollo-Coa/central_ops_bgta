import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function DELETE(req: NextRequest) {
  try {
    // Primero obtener los IDs de las novedades de prueba para eliminar sus imágenes
    const [novedadesPrueba] = await pool.query(
      `SELECT id_novedad FROM novedades 
       WHERE consecutivo >= 100000 
       AND descripcion LIKE '%NOVEDAD DE PRUEBA%'`
    );

    const idsNovedades = (novedadesPrueba as any[]).map(n => n.id_novedad);

    // Eliminar imágenes asociadas a las novedades de prueba
    if (idsNovedades.length > 0) {
      await pool.query(
        `DELETE FROM imagenes_novedades 
         WHERE id_novedad IN (${idsNovedades.map(() => '?').join(',')})`,
        idsNovedades
      );
    }

    // Eliminar todas las novedades de prueba (consecutivo >= 100000)
    const [result] = await pool.query(
      `DELETE FROM novedades 
       WHERE consecutivo >= 100000 
       AND descripcion LIKE '%NOVEDAD DE PRUEBA%'`
    );

    const deletedCount = (result as any).affectedRows || 0;

    return NextResponse.json({ 
      message: `Se eliminaron ${deletedCount} novedades de prueba y sus imágenes asociadas`,
      eliminadas: deletedCount
    });

  } catch (error) {
    console.error('Error eliminando novedades fake:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Contar novedades de prueba existentes
    const [count] = await pool.query(
      `SELECT COUNT(*) as count FROM novedades 
       WHERE consecutivo >= 100000 
       AND descripcion LIKE '%NOVEDAD DE PRUEBA%'`
    );

    const cantidad = (count as any[])[0].count;

    return NextResponse.json({ 
      cantidad,
      message: `Existen ${cantidad} novedades de prueba`
    });

  } catch (error) {
    console.error('Error contando novedades fake:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
