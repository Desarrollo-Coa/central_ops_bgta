import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import ExcelJS from 'exceljs';

function getFechaFormato(fecha: string | Date) {
  const d = new Date(fecha);
  return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
}

// Función para determinar el turno según la hora (igual al frontend)
function getTurnoByHora(hora: string) {
  if (!hora) return "diurno"
  const [hh, mm] = hora.split(":").map(Number)
  const minutos = hh * 60 + mm
  if (minutos >= 360 && minutos < 840) return "diurno" // 06:00 - 13:59
  if (minutos >= 840 && minutos < 1320) return "b" // 14:00 - 21:59
  // Nocturno: 22:00 - 23:59 (1320-1439) o 00:00 - 05:59 (0-359)
  if (minutos >= 1320 || minutos < 360) return "nocturno"
  return "diurno" // fallback
}

// Función para migrar calificaciones al nuevo formato { valor, nota } (igual al frontend)
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

async function getConfiguracion(negocioId: string, fecha: string) {
  try {
  const [rows] = await pool.query(
    'SELECT cantidad_diurno, cantidad_nocturno FROM configuracion_reportes_comunicacion WHERE id_negocio = ? AND fecha_inicial <= ? ORDER BY fecha_inicial DESC LIMIT 1',
    [negocioId, fecha]
  );
    const config = Array.isArray(rows) && rows.length > 0 ? rows[0] : { cantidad_diurno: 1, cantidad_nocturno: 1 };
  return { ...config, cantidad_turno_b: 0 } as { cantidad_diurno: number; cantidad_nocturno: number; cantidad_turno_b: number };
  } catch (error) {
    console.error('Error al obtener configuración, usando valores por defecto:', error);
    return { cantidad_diurno: 1, cantidad_nocturno: 1, cantidad_turno_b: 0 };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { negocioId, tipo, fechaInicio, fechaFin, fechaDia, nombreNegocio } = body;
    if (!negocioId || !tipo || !nombreNegocio) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    let fechas: string[] = [];
    if (tipo === 'global') {
      if (!fechaInicio || !fechaFin) {
        return NextResponse.json({ error: 'Faltan fechas para descarga global' }, { status: 400 });
      }
      const start = new Date(fechaInicio);
      const end = new Date(fechaFin);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        fechas.push(new Date(d).toISOString().split('T')[0]);
      }
    } else if (tipo === 'dia') {
      if (!fechaDia) {
        return NextResponse.json({ error: 'Falta fecha para descarga de día' }, { status: 400 });
      }
      fechas = [new Date(fechaDia).toISOString().split('T')[0]];
    } else {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const workbook = new ExcelJS.Workbook();
    const diasSinDatos: string[] = [];
    let hojasConDatos = 0;

    for (const fecha of [...fechas].reverse()) {
      try {
      const { cantidad_diurno, cantidad_nocturno, cantidad_turno_b } = await getConfiguracion(negocioId, fecha);

      const [cumplidosRows] = await pool.query(
        `SELECT c.*, p.*, u.*, c.nombre_colaborador
         FROM cumplidos c
         JOIN puestos p ON c.id_puesto = p.id_puesto
         JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
         WHERE c.fecha = ? AND u.id_negocio = ?`,
        [fecha, parseInt(negocioId)]
      ) as any[];
      const cumplidosArray = Array.isArray(cumplidosRows) ? cumplidosRows : [cumplidosRows];
      if (!cumplidosArray || cumplidosArray.length === 0) {
        diasSinDatos.push(fecha);
        continue;
      }

      const idsCumplido = cumplidosArray.map((c: any) => c.id_cumplido);
      let reportes: any[] = [];
      if (idsCumplido.length > 0) {
        const [reportesRows] = await pool.query(
          `SELECT id_cumplido, calificaciones FROM reporte_comunicacion WHERE id_cumplido IN (${idsCumplido.map(() => '?').join(',')})`,
          idsCumplido
        );
        reportes = (reportesRows as any[]).map((r: any) => {
          let calificacionesProcesadas;
          try {
            calificacionesProcesadas = migrarCalificaciones(
              typeof r.calificaciones === 'string'
              ? JSON.parse(r.calificaciones)
                : (r.calificaciones || {})
            );
          } catch (e) {
            console.error('Error al migrar calificaciones para id_cumplido', r.id_cumplido, e);
            calificacionesProcesadas = {};
          }
          return {
            id_cumplido: r.id_cumplido,
            calificaciones: calificacionesProcesadas,
          };
        });
      }

      const unidades: Record<string, any[]> = {};
      cumplidosArray.forEach((c: any) => {
        if (!unidades[c.nombre_unidad]) unidades[c.nombre_unidad] = [];
        unidades[c.nombre_unidad].push(c);
      });

      // Estructurar datos por puesto: cumplidos[idPuesto] = { diurno, b, nocturno }
      const cumplidosEstructurados: Record<number, { diurno?: any, b?: any, nocturno?: any }> = {};
      
      cumplidosArray.forEach((c: any) => {
        if (!cumplidosEstructurados[c.id_puesto]) {
          cumplidosEstructurados[c.id_puesto] = {};
        }
        
        const turno = c.id_tipo_turno === 1 ? 'diurno' : c.id_tipo_turno === 2 ? 'nocturno' : 'b';
        cumplidosEstructurados[c.id_puesto][turno] = {
          id_cumplido: c.id_cumplido,
          colaborador: c.nombre_colaborador || '',
          calificaciones: {}
        };
      });

      // Agregar calificaciones a cada turno
      reportes.forEach((reporte: any) => {
        const cumplido = cumplidosArray.find((c: any) => c.id_cumplido === reporte.id_cumplido);
        if (cumplido && cumplidosEstructurados[cumplido.id_puesto]) {
          const turno = cumplido.id_tipo_turno === 1 ? 'diurno' : cumplido.id_tipo_turno === 2 ? 'nocturno' : 'b';
          if (cumplidosEstructurados[cumplido.id_puesto][turno]) {
            cumplidosEstructurados[cumplido.id_puesto][turno].calificaciones = reporte.calificaciones || {};
          }
        }
      });

      // Generar claves basadas en la configuración (igual que el frontend)
      const horas: { key: string; label: string; tipo: "diurno" | "b" | "nocturno" }[] = [
        ...Array.from({ length: cantidad_diurno || 0 }, (_, i) => ({
          key: `R${i + 1}`,
          label: `R${i + 1} (Diurno)`,
          tipo: "diurno" as const,
        })),
        ...Array.from({ length: cantidad_turno_b || 0 }, (_, i) => ({
          key: `R${cantidad_diurno + i + 1}`,
          label: `R${cantidad_diurno + i + 1} (Turno B)`,
          tipo: "b" as const,
        })),
        ...Array.from({ length: cantidad_nocturno || 0 }, (_, i) => ({
          key: `R${cantidad_diurno + (cantidad_turno_b || 0) + i + 1}`,
          label: `R${cantidad_diurno + (cantidad_turno_b || 0) + i + 1} (Nocturno)`,
          tipo: "nocturno" as const,
        })),
      ];
      
      // Extraer horas reales de las calificaciones existentes
      const horasReales: { [key: string]: string } = {};
      
      // Buscar horas reales en los datos estructurados por puesto y turno
      Object.values(cumplidosEstructurados).forEach((turnos: any) => {
        Object.values(turnos).forEach((turno: any) => {
          if (turno.calificaciones && typeof turno.calificaciones === 'object') {
            Object.entries(turno.calificaciones).forEach(([rKey, horaObj]) => {
              if (horaObj && typeof horaObj === 'object' && !Array.isArray(horaObj)) {
                // Buscar la primera hora que tenga datos (valor > 0 o nota)
                const horasConDatos = Object.entries(horaObj).filter(([hora, val]) => {
                  if (val && typeof val === 'object' && 'valor' in val) {
                    return val.valor > 0 || (val.nota && val.nota.trim() !== '');
                  }
                  return val > 0;
                });
                
                if (horasConDatos.length > 0 && !horasReales[rKey]) {
                  horasReales[rKey] = horasConDatos[0][0]; // Usar la primera hora con datos
                }
              }
            });
          }
        });
      });

      console.log('=== DEPURACIÓN EXCEL ===');
      console.log('Horas generadas:', horas.map(h => `${h.key} (${h.tipo})`));
      console.log('Horas reales extraídas:', horasReales);
      console.log('Reportes encontrados:', reportes.length);

      // Generar horas basadas en las horas reales de las calificaciones
      const horasConValores: { key: string; hora: string; tipo: "diurno" | "b" | "nocturno" }[] = [];
      
      horas.forEach((h) => {
        const hora = horasReales[h.key];
        if (hora) {
          horasConValores.push({ ...h, hora });
        } else {
          // Si no hay hora real, usar hora por defecto basada en el tipo
          let horaDefault = '';
          if (h.tipo === 'diurno') {
            const index = horas.filter(hr => hr.tipo === 'diurno').indexOf(h);
            horaDefault = `${(6 + index).toString().padStart(2, '0')}:00`;
          } else if (h.tipo === 'b') {
            const index = horas.filter(hr => hr.tipo === 'b').indexOf(h);
            horaDefault = `${(14 + index).toString().padStart(2, '0')}:00`;
          } else if (h.tipo === 'nocturno') {
            const index = horas.filter(hr => hr.tipo === 'nocturno').indexOf(h);
            horaDefault = `${(22 + index).toString().padStart(2, '0')}:00`;
          }
          horasConValores.push({ ...h, hora: horaDefault });
        }
      });

      console.log('Horas finales con valores:', horasConValores);

      const sheet = workbook.addWorksheet(fecha);
      hojasConDatos++;

      const totalCols = 6 + horasConValores.length;
      
      // Título principal
      sheet.mergeCells(1, 1, 1, totalCols);
      const titleCell = sheet.getCell(1, 1);
      titleCell.value = `REPORTE DE COMUNICACIÓN ${String(nombreNegocio).toUpperCase()}`;
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '002060' }
      };
      titleCell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 16 };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Fecha
      sheet.mergeCells(2, 1, 2, totalCols);
      const [yyyy, mm, dd] = fecha.split('-');
      const dateCell = sheet.getCell(2, 1);
      dateCell.value = `${dd}-${mm}-${yyyy}`;
      dateCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '002060' }
      };
      dateCell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 13 };
      dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
      dateCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Encabezados principales
      const encabezadosPrincipales = [
        'UNIDAD DE NEGOCIO',
        'PUESTO',
        'COLABORADOR DIURNO',
        'COLABORADOR TURNO B',
        'COLABORADOR NOCTURNO',
        'NIVEL DE COMUNICACIÓN'
      ];
      
      for (let c = 1; c <= encabezadosPrincipales.length; c++) {
        sheet.mergeCells(3, c, 4, c);
        const headerCell = sheet.getCell(3, c);
        headerCell.value = encabezadosPrincipales[c - 1];
        headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        headerCell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 11 };
        headerCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '002060' }
        };
        headerCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }

        // Encabezados de horas agrupados por turno
        let col = encabezadosPrincipales.length + 1;
        
        // Agrupar horas por tipo de turno
        const horasPorTurno = {
          diurno: horasConValores.filter(h => h.tipo === 'diurno'),
          b: horasConValores.filter(h => h.tipo === 'b'),
          nocturno: horasConValores.filter(h => h.tipo === 'nocturno')
        };
        
        // Generar encabezados agrupados
        Object.entries(horasPorTurno).forEach(([tipoTurno, horas]) => {
          if (horas.length === 0) return;
          
          const tipoLabel = tipoTurno === 'diurno' ? 'DIURNO' : tipoTurno === 'b' ? 'TURNO B' : 'NOCTURNO';
          
          // Encabezado del grupo (si hay más de una hora)
          if (horas.length > 1) {
            const groupCell = sheet.getCell(3, col);
            groupCell.value = tipoLabel;
            groupCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            groupCell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 10 };
            groupCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '002060' }
            };
            groupCell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // Combinar celdas del grupo
            if (horas.length > 1) {
              sheet.mergeCells(3, col, 3, col + horas.length - 1);
            }
          }
          
          // Encabezados individuales de horas
          horas.forEach((h) => {
            const hourCell = sheet.getCell(4, col);
            hourCell.value = h.hora;
            hourCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            hourCell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 10 };
            hourCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '002060' }
            };
            hourCell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            col++;
          });
        });

      let row = 5;
      for (const unidad of Object.keys(unidades)) {
        const puestosUnidad = unidades[unidad];
        
        // Agrupar puestos únicos (sin duplicados por turno)
        const puestosUnicos = puestosUnidad.reduce((acc: any[], puesto: any) => {
          if (!acc.find(p => p.id_puesto === puesto.id_puesto)) {
            acc.push(puesto);
          }
          return acc;
        }, []);
        
        const startRow = row;
        for (const puesto of puestosUnicos) {
          const idPuesto = puesto.id_puesto;
          const cumplido = cumplidosEstructurados[idPuesto] || {};
          const diurnoData = cumplido.diurno || { colaborador: '', calificaciones: {} };
          const turnoBData = cumplido.b || { colaborador: '', calificaciones: {} };
          const nocturnoData = cumplido.nocturno || { colaborador: '', calificaciones: {} };
          
          let col = 1;
          
          // Unidad de negocio
          if (idPuesto === puestosUnicos[0].id_puesto) {
            const unidadCell = sheet.getCell(row, col);
            unidadCell.value = unidad;
            unidadCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            unidadCell.font = { bold: true, size: 10 };
          }
          col++;
          
          // Puesto
          const puestoCell = sheet.getCell(row, col);
          puestoCell.value = puesto.nombre_puesto;
          puestoCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          puestoCell.font = { bold: true, size: 10 };
          col++;
          
          // Colaborador diurno
          const diurnoCell = sheet.getCell(row, col);
          diurnoCell.value = diurnoData.colaborador.trim();
          diurnoCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          diurnoCell.font = { size: 10 };
          col++;
          
          // Colaborador turno B
          const turnoBCell = sheet.getCell(row, col);
          turnoBCell.value = turnoBData.colaborador.trim();
          turnoBCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          turnoBCell.font = { size: 10 };
          col++;
          
          // Colaborador nocturno
          const nocturnoCell = sheet.getCell(row, col);
          nocturnoCell.value = nocturnoData.colaborador.trim();
          nocturnoCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          nocturnoCell.font = { size: 10 };
          col++;

          // Calcular nivel de comunicación sumando todos los puntajes de los 3 turnos
          let puntajes: number[] = [];
          
          // Sumar puntajes de diurno
          if (diurnoData.calificaciones) {
            Object.values(diurnoData.calificaciones).forEach((reporte: any) => {
              if (typeof reporte === 'object' && reporte !== null) {
                Object.values(reporte).forEach((val: any) => {
                  if (val && typeof val === 'object' && 'valor' in val && typeof val.valor === 'number') {
                    puntajes.push(val.valor);
                  }
                });
              }
            });
          }
          
          // Sumar puntajes de turno B
          if (turnoBData.calificaciones) {
            Object.values(turnoBData.calificaciones).forEach((reporte: any) => {
              if (typeof reporte === 'object' && reporte !== null) {
                Object.values(reporte).forEach((val: any) => {
                  if (val && typeof val === 'object' && 'valor' in val && typeof val.valor === 'number') {
                    puntajes.push(val.valor);
                  }
                });
              }
            });
          }
          
          // Sumar puntajes de nocturno
          if (nocturnoData.calificaciones) {
            Object.values(nocturnoData.calificaciones).forEach((reporte: any) => {
              if (typeof reporte === 'object' && reporte !== null) {
                Object.values(reporte).forEach((val: any) => {
                  if (val && typeof val === 'object' && 'valor' in val && typeof val.valor === 'number') {
                    puntajes.push(val.valor);
                  }
                });
              }
            });
          }
          
          const nivelCom = puntajes.length > 0 ? `${Math.round((puntajes.reduce((a, b) => a + b, 0) / puntajes.length) * 10)}%` : '';
          const nivelComCell = sheet.getCell(row, col);
          nivelComCell.value = nivelCom;
          nivelComCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          nivelComCell.font = { bold: true, size: 10, color: { argb: '000000' } };
          if (nivelCom) {
            const porcentaje = parseInt(nivelCom.replace('%', ''));
            if (porcentaje >= 80) {
              nivelComCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6EFCE' } }; // Verde claro
            } else if (porcentaje >= 60) {
              nivelComCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEB9C' } }; // Amarillo claro
            } else {
              nivelComCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7CE' } }; // Rojo claro
            }
          }
          col++;

          // Procesar columnas de calificaciones (renderizar datos sin asociar turnos)
          horasConValores.forEach((h) => {
            let valor = '';
            let nota = '';
            
            // Buscar en todos los turnos (diurno, b, nocturno) sin asociar por hora
            const todosTurnos = [diurnoData, turnoBData, nocturnoData];
            
            for (const turnoData of todosTurnos) {
              if (turnoData && turnoData.calificaciones && turnoData.calificaciones[h.key] && turnoData.calificaciones[h.key][h.hora]) {
                const val = turnoData.calificaciones[h.key][h.hora];
                if (val && typeof val === 'object' && 'valor' in val) {
                  valor = val.valor;
                  nota = val.nota || '';
                } else {
                  valor = val;
                }
                break; // Usar el primer valor encontrado
              }
            }
            
            const cell = sheet.getCell(row, col);
            cell.value = valor;
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.font = { size: 10 };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            if (nota && nota.length > 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCC' } };
              cell.note = nota;
            }
            col++;
          });

          // Aplicar estilo de fila alternada solo a celdas que no tienen color especial
          const fillColor = row % 2 === 0 ? 'FFFFFF' : 'F8F9FA';
          for (let cIdx = 1; cIdx <= totalCols; cIdx++) {
            const cell = sheet.getCell(row, cIdx);
            // Solo aplicar color de fondo si la celda no tiene un color especial
            if (!cell.fill || 
                (cell.fill as any).fgColor?.argb === 'FFFFFF' || 
                (cell.fill as any).fgColor?.argb === 'F2F2F2' ||
                (cell.fill as any).fgColor?.argb === 'F8F9FA') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
            }
            // Asegurar que todas las celdas tengan bordes
            if (!cell.border || Object.keys(cell.border).length === 0) {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            }
          }
          row++;
        }

        if (puestosUnicos.length > 1) {
          sheet.mergeCells(startRow, 1, row - 1, 1);
          sheet.getCell(startRow, 1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
      }

      // Configurar anchos de columna optimizados
      sheet.columns = [
        { width: 30 }, // Unidad de negocio
        { width: 25 }, // Puesto
        { width: 30 }, // Colaborador diurno
        { width: 30 }, // Colaborador turno B
        { width: 30 }, // Colaborador nocturno
        { width: 20 }, // Nivel de comunicación
        ...horasConValores.map(() => ({ width: 15 })), // Columnas de calificaciones
      ];
      
      // Configurar altura de filas
      sheet.getRow(1).height = 30; // Título
      sheet.getRow(2).height = 25; // Fecha
      sheet.getRow(3).height = 20; // Encabezados principales
      sheet.getRow(4).height = 20; // Encabezados de horas
      
      // Aplicar altura a todas las filas de datos
      for (let r = 5; r <= row; r++) {
        sheet.getRow(r).height = 18;
      }
      } catch (error) {
        console.error(`Error procesando fecha ${fecha}:`, error);
        diasSinDatos.push(fecha);
        continue;
      }
    }

    if (hojasConDatos === 0) {
      return NextResponse.json({ error: tipo === 'global' ? 'No hay datos para ningún día del rango seleccionado.' : 'No hay datos para el día seleccionado.' }, { status: 404 });
    }
    const buffer = await workbook.xlsx.writeBuffer();
    let filename = '';
    if (tipo === 'global') {
      filename = `${nombreNegocio}_${fechas[0]}_a_${fechas[fechas.length - 1]}.xlsx`;
    } else {
      filename = `${nombreNegocio}_${fechas[0]}.xlsx`;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    };
    if (diasSinDatos.length > 0) {
      headers['X-No-Data-Days'] = diasSinDatos.join(',');
    }
    return new Response(buffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error generando Excel:', error);
    return NextResponse.json({ error: 'Error generando Excel' }, { status: 500 });
  }
}