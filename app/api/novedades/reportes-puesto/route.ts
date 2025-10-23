import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id_negocio = searchParams.get('id_negocio')

    if (!id_negocio) {
      return NextResponse.json({ error: "Se requiere el parámetro id_negocio" }, { status: 400 })
    }

    // 1. Información completa del negocio con unidades y puestos
    const queryNegocioCompleto = `
      SELECT 
        ne.id_negocio,
        ne.nombre_negocio,
        un.id_unidad,
        un.nombre_unidad,
        p.id_puesto,
        p.nombre_puesto,
        p.activo as puesto_activo
      FROM negocios ne
      JOIN unidades_negocio un ON ne.id_negocio = un.id_negocio
      JOIN puestos p ON un.id_unidad = p.id_unidad
      WHERE ne.id_negocio = ? AND p.activo = 1
      ORDER BY un.nombre_unidad, p.nombre_puesto
    `
    const [negocioCompleto] = await pool.query(queryNegocioCompleto, [id_negocio])

    // 2. Eventos por puesto y año (LEFT JOIN para incluir puestos sin eventos)
    const queryPorPuesto = `
      SELECT 
        p.id_puesto,
        p.nombre_puesto AS puesto,
        un.nombre_unidad,
        y.anio AS anio,
        COUNT(n.id_novedad) AS cantidad
      FROM puestos p
      JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      JOIN negocios ne ON un.id_negocio = ne.id_negocio
      LEFT JOIN (
        SELECT * FROM novedades WHERE YEAR(fecha_hora_novedad) IN (2024, 2025)
      ) n ON n.id_puesto = p.id_puesto
      JOIN (SELECT 2024 as anio UNION SELECT 2025) y
      WHERE ne.id_negocio = ? AND p.activo = 1
        AND (YEAR(n.fecha_hora_novedad) = y.anio OR n.id_novedad IS NULL)
      GROUP BY p.id_puesto, p.nombre_puesto, un.nombre_unidad, y.anio
      ORDER BY un.nombre_unidad, p.nombre_puesto, y.anio
    `
    const [porPuesto] = await pool.query(queryPorPuesto, [id_negocio])

    // 3. Eventos por mes y año (todos los meses, aunque no haya eventos)
    const queryPorMes = `
      SELECT 
        y.anio, 
        m.mes, 
        COUNT(n.id_novedad) AS cantidad
      FROM 
        (SELECT 2024 as anio UNION SELECT 2025) y
      CROSS JOIN 
        (SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m
      LEFT JOIN novedades n ON YEAR(n.fecha_hora_novedad) = y.anio AND MONTH(n.fecha_hora_novedad) = m.mes
      LEFT JOIN puestos p ON n.id_puesto = p.id_puesto
      LEFT JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      LEFT JOIN negocios ne ON un.id_negocio = ne.id_negocio
      WHERE (ne.id_negocio = ? OR ne.id_negocio IS NULL) AND (p.activo = 1 OR p.activo IS NULL)
      GROUP BY y.anio, m.mes
      ORDER BY y.anio, m.mes
    `
    const [porMes] = await pool.query(queryPorMes, [id_negocio])

    // 4. Eventos por tipo y año (todos los tipos, aunque no haya eventos)
    const queryPorTipo = `
      SELECT 
        t.id_tipo_evento,
        t.nombre_tipo_evento AS tipo,
        tr.nombre_tipo_reporte,
        y.anio,
        COUNT(n.id_novedad) AS cantidad
      FROM tipos_evento t
      JOIN tipos_reporte tr ON t.id_tipo_reporte = tr.id_tipo_reporte
      CROSS JOIN (SELECT 2024 as anio UNION SELECT 2025) y
      LEFT JOIN novedades n ON n.id_tipo_evento = t.id_tipo_evento AND YEAR(n.fecha_hora_novedad) = y.anio
      LEFT JOIN puestos p ON n.id_puesto = p.id_puesto
      LEFT JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      LEFT JOIN negocios ne ON un.id_negocio = ne.id_negocio
      WHERE (ne.id_negocio = ? OR ne.id_negocio IS NULL) AND (p.activo = 1 OR p.activo IS NULL)
      GROUP BY t.id_tipo_evento, t.nombre_tipo_evento, tr.nombre_tipo_reporte, y.anio
      ORDER BY tr.nombre_tipo_reporte, t.nombre_tipo_evento, y.anio
    `
    const [porTipo] = await pool.query(queryPorTipo, [id_negocio])

    // 5. Totales por año
    const queryTotales = `
      SELECT 
        y.anio, 
        COUNT(n.id_novedad) AS cantidad
      FROM (SELECT 2024 as anio UNION SELECT 2025) y
      LEFT JOIN novedades n ON YEAR(n.fecha_hora_novedad) = y.anio
      LEFT JOIN puestos p ON n.id_puesto = p.id_puesto
      LEFT JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
      LEFT JOIN negocios ne ON un.id_negocio = ne.id_negocio
      WHERE (ne.id_negocio = ? OR ne.id_negocio IS NULL) AND (p.activo = 1 OR p.activo IS NULL)
      GROUP BY y.anio
      ORDER BY y.anio
    `
    const [totales] = await pool.query(queryTotales, [id_negocio])

    // 6. Resumen de puestos por unidad
    const queryResumenPuestos = `
      SELECT 
        un.nombre_unidad,
        COUNT(p.id_puesto) as total_puestos,
        COUNT(CASE WHEN p.activo = 1 THEN 1 END) as puestos_activos
      FROM unidades_negocio un
      LEFT JOIN puestos p ON un.id_unidad = p.id_unidad
      WHERE un.id_negocio = ?
      GROUP BY un.id_unidad, un.nombre_unidad
      ORDER BY un.nombre_unidad
    `
    const [resumenPuestos] = await pool.query(queryResumenPuestos, [id_negocio])

    // Función para generar estructura de debugging
    const generarEstructuraDebug = () => {
      const negocioData = (negocioCompleto as any[])[0];
      if (!negocioData) return null;

      const estructura = {
        negocio: negocioData.nombre_negocio,
        unidades: [] as any[]
      };

      // Agrupar puestos por unidad
      const puestosPorUnidad: { [key: string]: any[] } = {};
      
      (porPuesto as any[]).forEach((puesto: any) => {
        if (!puestosPorUnidad[puesto.nombre_unidad]) {
          puestosPorUnidad[puesto.nombre_unidad] = [];
        }
        puestosPorUnidad[puesto.nombre_unidad].push(puesto);
      });

      // Crear estructura de unidades
      Object.keys(puestosPorUnidad).forEach(nombreUnidad => {
        const puestosUnidad = puestosPorUnidad[nombreUnidad];
        const puestosAgrupados: { [key: string]: any } = {};

        // Agrupar por nombre de puesto
        puestosUnidad.forEach((puesto: any) => {
          if (!puestosAgrupados[puesto.puesto]) {
            puestosAgrupados[puesto.puesto] = {
              nombre_puesto: puesto.puesto,
              novedades_2024: 0,
              novedades_2025: 0
            };
          }
          if (puesto.anio === 2024) {
            puestosAgrupados[puesto.puesto].novedades_2024 = parseInt(puesto.cantidad);
          } else if (puesto.anio === 2025) {
            puestosAgrupados[puesto.puesto].novedades_2025 = parseInt(puesto.cantidad);
          }
        });

        estructura.unidades.push({
          nombre_unidad: nombreUnidad,
          puestos: Object.values(puestosAgrupados)
        });
      });

      return estructura;
    };

    // Generar y imprimir estructura de debugging
    const estructuraDebug = generarEstructuraDebug();
    console.log('=== DEBUG: ESTRUCTURA DEL NEGOCIO ===');
    console.log(JSON.stringify(estructuraDebug, null, 2));
    console.log('=== FIN DEBUG ===');

    return NextResponse.json({
      // Información del negocio
      negocio: (negocioCompleto as any[]).length > 0 ? {
        id_negocio: (negocioCompleto as any[])[0].id_negocio,
        nombre_negocio: (negocioCompleto as any[])[0].nombre_negocio,
        unidades: resumenPuestos,
        total_puestos: (negocioCompleto as any[]).length
      } : null,
      
      // Datos estructurados
      porPuesto,
      porMes,
      porTipo,
      totales,
      
      // Estructura de debugging
      estructuraDebug,
      
      // Datos completos para debugging
      debug: {
        negocioCompleto,
        resumenPuestos,
        total_registros_porPuesto: (porPuesto as any[]).length,
        total_registros_porMes: (porMes as any[]).length,
        total_registros_porTipo: (porTipo as any[]).length
      }
    })
  } catch (error) {
    console.error("Error al obtener reportes por puesto:", error)
    return NextResponse.json({ error: "Error al obtener reportes por puesto" }, { status: 500 })
  }
} 