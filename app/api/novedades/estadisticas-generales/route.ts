import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_negocio = searchParams.get('id_negocio');
    const id_unidad = searchParams.get('id_unidad');
    const id_puesto = searchParams.get('id_puesto');
    let desde = searchParams.get('desde');
    let hasta = searchParams.get('hasta');

    // LOG de parámetros recibidos
    console.log('==============================');
    console.log('   Estadísticas Generales API  ');
    console.log('------------------------------');
    console.log(`Negocio: ${id_negocio}`);
    console.log(`Unidad:  ${id_unidad ?? 'Todas'}`);
    console.log(`Puesto:  ${id_puesto ?? 'Todos'}`);
    console.log(`Desde:   ${desde}`);
    console.log(`Hasta:   ${hasta}`);
    console.log('==============================');

    if (!id_negocio || !desde || !hasta) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (id_negocio, desde, hasta)' }, { status: 400 });
    }

    // Ajustar fechas para incluir todo el rango del día
    if (/^\d{4}-\d{2}-\d{2}$/.test(desde)) {
      desde = `${desde} 00:00:00`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      hasta = `${hasta} 23:59:59`;
    }

    // Filtros dinámicos
    let where = 'novedades.fecha_hora_novedad BETWEEN ? AND ? AND puestos.id_unidad = unidades_negocio.id_unidad AND unidades_negocio.id_negocio = negocios.id_negocio AND negocios.id_negocio = ?';
    let params: any[] = [desde, hasta, id_negocio];

    if (id_unidad) {
      where += ' AND unidades_negocio.id_unidad = ?';
      params.push(id_unidad);
    }
    if (id_puesto) {
      where += ' AND puestos.id_puesto = ?';
      params.push(id_puesto);
    }

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

    // Novedades por puesto
    const sqlPorPuesto = `SELECT puestos.nombre_puesto as puesto, COUNT(*) as cantidad
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}
       GROUP BY puestos.nombre_puesto
       ORDER BY cantidad DESC`;
    const [porPuesto] = await pool.query(sqlPorPuesto, params);

    // Novedades por unidad de negocio
    const sqlPorUnidad = `SELECT unidades_negocio.nombre_unidad as unidad, COUNT(*) as cantidad
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}
       GROUP BY unidades_negocio.nombre_unidad
       ORDER BY cantidad DESC`;
    const [porUnidad] = await pool.query(sqlPorUnidad, params);

    // Total novedades y días analizados
    const sqlTotales = `SELECT COUNT(*) as total, DATEDIFF(?, ?) + 1 as dias
       FROM novedades
       JOIN puestos ON novedades.id_puesto = puestos.id_puesto
       JOIN unidades_negocio ON puestos.id_unidad = unidades_negocio.id_unidad
       JOIN negocios ON unidades_negocio.id_negocio = negocios.id_negocio
       WHERE ${where}`;
    const [totales] = await pool.query(sqlTotales, [hasta, desde, ...params]);

    // Eventos detallados (para modales)
    const sqlEventos = `SELECT novedades.id_novedad, novedades.consecutivo, novedades.fecha_hora_novedad as fecha_novedad, TIME_FORMAT(novedades.fecha_hora_novedad, '%H:%i:%s') as hora_novedad, 
              novedades.descripcion, novedades.gestion, tipos_evento.nombre_tipo_evento as tipo_novedad, 
              unidades_negocio.nombre_unidad as unidad_negocio, negocios.nombre_negocio, puestos.nombre_puesto as puesto,
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

    // LOG de parámetros recibidos y resumen de resultados
    // Este log ayuda al programador a entender qué filtros se usaron y qué resultados se obtuvieron en cada petición
    const timestamp = new Date().toISOString();
    // Buscar nombres si están presentes
    let nombreNegocio = id_negocio;
    let nombreUnidad = id_unidad;
    let nombrePuesto = id_puesto;
    const porUnidadArr = porUnidad as any[];
    const porPuestoArr = porPuesto as any[];
    const porTipoArr = porTipo as any[];
    const porMesArr = porMes as any[];
    if (porUnidadArr && porUnidadArr.length === 1) {
      nombreUnidad = porUnidadArr[0].unidad;
    }
    if (porPuestoArr && porPuestoArr.length === 1) {
      nombrePuesto = porPuestoArr[0].puesto;
    }
    if (porTipoArr && porTipoArr.length === 1) {
      // No se usa, pero podría usarse para mostrar el tipo
    }
    if (porUnidadArr && porUnidadArr.length > 0 && !id_unidad) {
      nombreUnidad = 'Todas';
    }
    if (porPuestoArr && porPuestoArr.length > 0 && !id_puesto) {
      nombrePuesto = 'Todos';
    }
    // Buscar nombre del negocio en porUnidad o porPuesto si existe
    // (esto es solo un ejemplo, idealmente deberías tener una consulta para obtener el nombre del negocio)
    // Mostrar resumen de eventos por puesto y por mes para 2024 y 2025
    const resumenPorPuesto2024 = porPuestoArr.map((p: any) => `${p.puesto}: ${p.cantidad}`).join(', ');
    const resumenPorMes2024 = porMesArr.filter((m: any) => m.mes && m.cantidad).map((m: any) => `Mes ${m.mes}: ${m.cantidad}`).join(', ');
    const resumenPorTipo = porTipoArr.map((t: any) => `${t.tipo}: ${t.cantidad}`).join(', ');
    const totalEventos = Array.isArray(eventosProcesados) ? eventosProcesados.length : 0;
    const primerosIds = Array.isArray(eventosProcesados) ? eventosProcesados.slice(0, 5).map((e: any) => e.id_novedad).join(', ') : '';
    console.log('==============================');
    console.log('   Estadísticas Generales API  ');
    console.log('------------------------------');
    console.log(`Negocio: ${id_negocio}${nombreNegocio && nombreNegocio !== id_negocio ? ` (${nombreNegocio})` : ''}`);
    console.log(`Unidad:  ${id_unidad ?? 'Todas'}${nombreUnidad && nombreUnidad !== id_unidad ? ` (${nombreUnidad})` : ''}`);
    console.log(`Puesto:  ${id_puesto ?? 'Todos'}${nombrePuesto && nombrePuesto !== id_puesto ? ` (${nombrePuesto})` : ''}`);
    console.log(`Desde:   ${desde}`);
    console.log(`Hasta:   ${hasta}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log('------------------------------');
    console.log('Resumen de resultados:');
    console.log(`- Eventos por Puesto: ${resumenPorPuesto2024 || 'Sin datos'}`);
    console.log(`- Eventos por Mes: ${resumenPorMes2024 || 'Sin datos'}`);
    console.log(`- Eventos por Tipo: ${resumenPorTipo || 'Sin datos'}`);
    console.log(`- Total eventos detallados: ${totalEventos} ${primerosIds ? `(IDs: ${primerosIds})` : ''}`);
    console.log('==============================');

    return NextResponse.json({
      porTipo,
      porMes,
      porPuesto,
      porUnidad,
      totales: Array.isArray(totales) ? totales[0] : totales,
      eventos: eventosProcesados
    });
  } catch (error) {
    console.error('Error en estadísticas generales:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas generales' }, { status: 500 });
  }
}