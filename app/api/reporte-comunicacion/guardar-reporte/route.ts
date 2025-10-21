import { NextResponse } from "next/server"
import pool from "@/lib/db"

// Función para determinar el turno según la hora
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

export async function POST(request: Request) {
  try {
    const { id_cumplido, calificaciones } = await request.json()

    console.log("--- DEPURACIÓN REPORTE DE COMUNICACIÓN ---")
    console.log("Recibido:", { id_cumplido, calificaciones })

    // Mostrar cómo se procesan las calificaciones
    Object.entries(calificaciones).forEach(([rKey, horas]) => {
      console.log(`Reporte ${rKey}:`)
      if (horas && typeof horas === "object" && !Array.isArray(horas)) {
        Object.entries(horas).forEach(([hora, valor]) => {
          if (typeof valor === "object" && valor !== null && "valor" in valor && "nota" in valor) {
            console.log(
              `  Hora ${hora}: valor=${(valor as any).valor}, nota="${(valor as any).nota}", turno=${getTurnoByHora(hora)}`,
            )
          } else {
            console.log(`  Hora ${hora}: valor=${valor}, turno=${getTurnoByHora(hora)}`)
          }
        })
      }
    })

    if (!id_cumplido || !calificaciones) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }

    // 1. Obtener info de cumplido (fecha, id_tipo_turno, id_negocio, colaborador)
    const [cumplidoRows] = (await pool.query(
      `SELECT c.fecha, c.id_tipo_turno, u.id_negocio, c.nombre_colaborador, c.id_puesto
       FROM cumplidos c
       JOIN puestos p ON c.id_puesto = p.id_puesto
       JOIN unidades_negocio u ON p.id_unidad = u.id_unidad
       WHERE c.id_cumplido = ?`,
      [id_cumplido],
    )) as any[]

    const cumplido = cumplidoRows[0]
    if (!cumplido) {
      return NextResponse.json({ error: "Cumplido no encontrado" }, { status: 404 })
    }

    console.log("Cumplido:", cumplido)

    // 2. Verificar si existe turno B para este puesto en la fecha
    const [turnosBRows] = (await pool.query(
      `SELECT COUNT(*) as count_turno_b 
       FROM cumplidos c
       JOIN puestos p ON c.id_puesto = p.id_puesto
       WHERE p.id_puesto = ? AND c.fecha = ? AND c.id_tipo_turno = 3`,
      [cumplido.id_puesto, cumplido.fecha],
    )) as any[]

    const existeTurnoB = turnosBRows[0].count_turno_b > 0
    console.log("¿Existe turno B para este puesto?", existeTurnoB)

    // 3. Procesar calificaciones según la lógica de turnos
    const calificacionesProcesadas: Record<string, Record<string, { valor: number | null; nota: string | null }>> = {}

    Object.entries(calificaciones).forEach(([rKey, horasObj]) => {
      if (horasObj && typeof horasObj === "object" && !Array.isArray(horasObj)) {
        Object.entries(horasObj).forEach(([hora, val]) => {
          let turnoDestino: string

          if (existeTurnoB) {
            // Si existe turno B, usar la lógica de horas
            turnoDestino = getTurnoByHora(hora)
          } else {
            // Si no existe turno B, usar el turno del cumplido actual
            turnoDestino = cumplido.id_tipo_turno === 1 ? "diurno" : "nocturno"
          }

          // Solo procesar si la calificación corresponde al turno del cumplido actual
          const turnoActual = cumplido.id_tipo_turno === 1 ? "diurno" : cumplido.id_tipo_turno === 2 ? "nocturno" : "b"

          if (turnoDestino === turnoActual) {
            if (!calificacionesProcesadas[rKey]) {
              calificacionesProcesadas[rKey] = {}
            }
            calificacionesProcesadas[rKey][hora] = val as { valor: number | null; nota: string | null }
          }
        })
      }
    })

    console.log("Calificaciones procesadas para este cumplido:", calificacionesProcesadas)

    // 4. Insertar o actualizar
    const [existeRows] = (await pool.query("SELECT id FROM reporte_comunicacion WHERE id_cumplido = ?", [
      id_cumplido,
    ])) as any[]
    const existe = existeRows[0]

    console.log("Guardando en la base de datos:", {
      id_cumplido,
      calificaciones: calificacionesProcesadas,
      modo: existe ? "UPDATE" : "INSERT",
    })
    
    // Log detallado de las calificaciones procesadas
    console.log("--- CALIFICACIONES PROCESADAS DETALLADAS ---")
    Object.entries(calificacionesProcesadas).forEach(([rKey, horas]) => {
      console.log(`Reporte procesado ${rKey}:`)
      if (horas && typeof horas === "object") {
        Object.entries(horas).forEach(([hora, valor]) => {
          console.log(`  Hora ${hora}: valor=${valor.valor}, nota="${valor.nota}"`)
        })
      }
    })

    if (existe) {
      await pool.query(
        "UPDATE reporte_comunicacion SET calificaciones = ?, fecha_actualizacion = NOW() WHERE id_cumplido = ?",
        [JSON.stringify(calificacionesProcesadas), id_cumplido],
      )
    } else {
      await pool.query("INSERT INTO reporte_comunicacion (id_cumplido, calificaciones) VALUES (?, ?)", [
        id_cumplido,
        JSON.stringify(calificacionesProcesadas),
      ])
    }

    console.log("--- FIN DEPURACIÓN REPORTE DE COMUNICACIÓN ---")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al guardar reporte de comunicación:", error)
    return NextResponse.json({ error: "Error al guardar el reporte" }, { status: 500 })
  }
}