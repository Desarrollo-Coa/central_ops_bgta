import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_unidad = searchParams.get('id_unidad');
    const id_puesto = searchParams.get('id_puesto');
    let desde = searchParams.get('desde');
    let hasta = searchParams.get('hasta');

    if (!desde || !hasta) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (desde, hasta)' }, { status: 400 });
    }

    // Ajustar fechas para incluir todo el rango del día
    if (/^\d{4}-\d{2}-\d{2}$/.test(desde)) {
      desde = `${desde} 00:00:00`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      hasta = `${hasta} 23:59:59`;
    }

    // Filtros dinámicos
    let where = 'novedades.fecha_hora_novedad BETWEEN ? AND ? AND puestos.id_unidad = unidades_negocio.id_unidad AND unidades_negocio.id_negocio = negocios.id_negocio';
    let params: any[] = [desde, hasta];

    if (id_unidad) {
      where += ' AND unidades_negocio.id_unidad = ?';
      params.push(id_unidad);
    }
    if (id_puesto) {
      where += ' AND puestos.id_puesto = ?';
      params.push(id_puesto);
    }

    // Novedades por negocio
    const sqlPorNegocio = `SELECT negocios.id_negocio, negocios.nombre_negocio as negocio, COUNT(*) as cantidad
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}
       GROUP BY negocios.id_negocio, negocios.nombre_negocio
       ORDER BY cantidad DESC`;
    const [porNegocio] = await pool.query(sqlPorNegocio, params);

    // Novedades por unidad de negocio
    const sqlPorUnidad = `SELECT unidades_negocio.id_unidad, unidades_negocio.nombre_unidad as unidad, COUNT(*) as cantidad
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}
       GROUP BY unidades_negocio.id_unidad, unidades_negocio.nombre_unidad
       ORDER BY cantidad DESC`;
    const [porUnidad] = await pool.query(sqlPorUnidad, params);

    // Novedades por mes
    const sqlPorMes = `SELECT MONTH(novedades.fecha_hora_novedad) as mes, COUNT(*) as cantidad
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}
       GROUP BY mes
       ORDER BY mes ASC`;
    const [porMes] = await pool.query(sqlPorMes, params);

    // Novedades por tipo de evento
    const sqlPorTipo = `SELECT tipos_evento.nombre_tipo_evento as tipo, COUNT(*) as cantidad
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       JOIN tipos_evento ON novedades.id_tipo_evento = tipos_evento.id_tipo_evento
       WHERE ${where}
       GROUP BY tipos_evento.nombre_tipo_evento
       ORDER BY cantidad DESC`;
    const [porTipo] = await pool.query(sqlPorTipo, params);

    // Totales generales
    const sqlTotales = `SELECT COUNT(*) as total, DATEDIFF(LEAST(?, MAX(DATE(novedades.fecha_hora_novedad))), GREATEST(?, MIN(DATE(novedades.fecha_hora_novedad)))) + 1 as dias
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}`;
    const [totales] = await pool.query(sqlTotales, [hasta, desde, ...params]);

    // Eventos detallados (para modales)
    const sqlEventos = `SELECT novedades.id_novedad, novedades.consecutivo, novedades.fecha_hora_novedad as fecha_novedad, TIME_FORMAT(novedades.fecha_hora_novedad, '%H:%i:%s') as hora_novedad, 
              novedades.descripcion, novedades.gestion, tipos_evento.nombre_tipo_evento as tipo_novedad, 
              unidades_negocio.nombre_unidad as unidad_negocio, negocios.id_negocio, negocios.nombre_negocio, puestos.nombre_puesto as puesto,
              GROUP_CONCAT(imagenes_novedades.url_imagen) as archivos
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       JOIN tipos_evento ON novedades.id_tipo_evento = tipos_evento.id_tipo_evento
       LEFT JOIN imagenes_novedades ON novedades.id_novedad = imagenes_novedades.id_novedad
       WHERE ${where}
       GROUP BY novedades.id_novedad
       ORDER BY novedades.fecha_hora_novedad DESC`;
    const [eventos] = await pool.query(sqlEventos, params);
    const eventosProcesados = (eventos as any[]).map(evento => ({
      ...evento,
      archivos: evento.archivos ? Array.from(new Set((evento.archivos as string).split(','))).map((url: string) => ({ url_archivo: url })) : []
    }));

    return NextResponse.json({
      porNegocio,
      porUnidad,
      porMes,
      porTipo,
      totales: Array.isArray(totales) ? totales[0] : totales,
      eventos: eventosProcesados
    });
  } catch (error) {
    console.error('Error en estadísticas generales TODOS:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas generales (todos los negocios)' }, { status: 500 });
  }
} 