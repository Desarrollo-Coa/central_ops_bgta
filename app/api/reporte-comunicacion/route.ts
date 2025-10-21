export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const negocioId = searchParams.get('negocioId');
    const fecha = searchParams.get('fecha');
    console.log('[GET /api/reporte-comunicacion] negocioId:', negocioId, 'fecha:', fecha);
    if (!negocioId || !fecha) {
      console.log('[GET /api/reporte-comunicacion] Faltan parámetros negocioId o fecha', { negocioId, fecha });
      return NextResponse.json({ error: 'Faltan parámetros negocioId o fecha' }, { status: 400 });
    }

    // 1. Buscar los cumplidos de ese negocio y fecha, con info de colaborador y notas
    const [cumplidosRows] = await pool.query(
      `SELECT c.id_cumplido, c.id_puesto, p.nombre_puesto, c.id_tipo_turno, c.nombre_colaborador, c.fecha,
              n.nota, n.id_nota
       FROM cumplidos c
       JOIN puestos p ON c.id_puesto = p.id_puesto
       JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
       LEFT JOIN (
         SELECT id_cumplido, nota, id_nota FROM notas_cumplidos
       ) n ON n.id_cumplido = c.id_cumplido
       WHERE u.id_negocio = ? AND c.fecha = ?`,
      [negocioId, fecha]
    ) as any[];

    if (!cumplidosRows.length) {
      return NextResponse.json([]);
    }

    // Agrupar notas por id_cumplido
    const notasMap: Record<number, Record<string, string>> = {};
    (cumplidosRows as any[]).forEach((row: any) => {
      if (row.id_nota) {
        if (!notasMap[row.id_cumplido]) notasMap[row.id_cumplido] = {};
        notasMap[row.id_cumplido][row.id_nota] = row.nota;
      }
    });

    // 2. Buscar los reportes de comunicación para esos cumplidos
    const idsCumplido = [...new Set(cumplidosRows.map((c: any) => c.id_cumplido))] as number[];
    let reportes: any[] = [];
    if (idsCumplido.length > 0) {
      const [reportesRows] = await pool.query(
        `SELECT id_cumplido, calificaciones FROM reporte_comunicacion WHERE id_cumplido IN (${idsCumplido.map(() => '?').join(',')})`,
        idsCumplido
      ) as any[];

      // DEPURACIÓN: Mostrar los reportes crudos obtenidos de la base de datos
      console.log('--- DEPURACIÓN: Reportes crudos obtenidos ---');
      console.log(reportesRows);

      reportes = reportesRows.map((r: any) => {
        let calificacionesProcesadas;
        try {
          calificacionesProcesadas = migrarCalificaciones(
            typeof r.calificaciones === "string"
              ? JSON.parse(r.calificaciones)
              : (r.calificaciones || {})
          );
        } catch (e) {
          console.error('Error al migrar calificaciones para id_cumplido', r.id_cumplido, e);
          calificacionesProcesadas = {};
        }
        // DEPURACIÓN: Mostrar el resultado de la migración de calificaciones
        console.log(`--- DEPURACIÓN: Calificaciones migradas para id_cumplido ${r.id_cumplido} ---`);
        console.log(calificacionesProcesadas);

        return {
          id_cumplido: r.id_cumplido,
          calificaciones: calificacionesProcesadas,
        };
      });

      // DEPURACIÓN: Mostrar el array final de reportes procesados
      console.log('--- DEPURACIÓN: Reportes procesados finales ---');
      console.log(reportes);
    }

    // 3. Combinar todo
    const resultado = idsCumplido.map((id_cumplido) => {
      const row: any = (cumplidosRows as any[]).find((c: any) => c.id_cumplido === id_cumplido);
      const reporte = reportes.find((r: any) => r.id_cumplido === id_cumplido);
      // Usar nombre_colaborador directamente
      const colaborador = row.nombre_colaborador || '';
      return {
        id_cumplido,
        id_puesto: row.id_puesto,
        nombre_puesto: row.nombre_puesto,
        id_tipo_turno: row.id_tipo_turno,
        nombre_colaborador: row.nombre_colaborador,
        colaborador,
        fecha: row.fecha,
        notas: notasMap[id_cumplido] || {},
        calificaciones: reporte ? reporte.calificaciones : {},
      };
    });

    // --- MINI INFORME DE DEPURACIÓN ---
    console.log('\n========= MINI INFORME DE CALIFICACIONES =========');
    const turnosNombres = { 1: 'DIURNO', 2: 'NOCTURNO', 3: 'TURNO B' } as Record<number, string>;
    resultado.forEach(r => {
      console.log(`\nNOMBRE DEL PUESTO: ${r.nombre_puesto || r.id_puesto}`);
      const turno = turnosNombres[r.id_tipo_turno] || `TURNO ${r.id_tipo_turno}`;
      console.log(`TURNO: ${turno}`);
      if (r.colaborador) {
        console.log(`COLABORADOR: ${r.colaborador}`);
      }
      if (r.calificaciones && Object.keys(r.calificaciones).length > 0) {
        console.log('CALIFICACIONES:');
        Object.entries(r.calificaciones).forEach(([rKey, horasObj]) => {
          if (horasObj && typeof horasObj === 'object' && !Array.isArray(horasObj)) {
            Object.entries(horasObj).forEach(([hora, val]) => {
              const valor = typeof val === 'object' && val !== null && 'valor' in val ? val.valor : val;
              console.log(`    ${rKey}: ${hora} >: ${valor}`);
            });
          }
        });
      } else {
        console.log('SIN CALIFICACIONES');
      }
    });
    console.log('==============================================\n');

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error al obtener reportes de comunicación:', error);
    return NextResponse.json({ error: 'Error al obtener los reportes de comunicación' }, { status: 500 });
  }
}

// Función para migrar calificaciones al nuevo formato { valor, nota }
function migrarCalificaciones(calificaciones: any) {
  if (!calificaciones || typeof calificaciones !== 'object') return {};
  const resultado: any = {};
  for (const key of Object.keys(calificaciones)) {
    const horas = calificaciones[key];
    if (typeof horas !== 'object' || Array.isArray(horas)) {
      resultado[key] = horas;
      continue;
    }
    resultado[key] = {};
    for (const hora of Object.keys(horas)) {
      const valor = horas[hora];
      if (typeof valor === 'object' && valor !== null && 'valor' in valor) {
        // Ya migrado
        resultado[key][hora] = valor;
      } else {
        // Migrar
        resultado[key][hora] = { valor, nota: null };
      }
    }
  }
  return resultado;
} 