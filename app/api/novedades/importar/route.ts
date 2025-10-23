import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  const { novedades } = await req.json()
  let insertados = 0
  let errores: any[] = []
  let exitos: any[] = []

  for (const nov of novedades) {
    try {
      // Normalización de datos
      const usuarioExcel = (nov['Usuario'] || '').replace(/\s+/g, ' ').trim()
      const consecutivo = nov['Consecutvo']
      const fechaNovedad = nov['Fecha y hora novedad'] 
      const tipoReporte = (nov['Tipo de reporte'] || '').trim()
      const tipoEvento = (nov['Tipo de evento'] || '').trim()
      const tipoNegocio = (nov['Tipo de negocio'] || '').trim()
      const sedeExcel = (nov['Sede'] || '').replace(/\s+/g, ' ').trim()
      const gestion = (nov['Gestion'] || '').trim()
      const descripcion = (nov['Descripción'] || '').trim()
      const fechaRegistro = nov['Fecha y hora de registro']

      // Buscar por Apellido Nombre
      let [userRows]: any = await pool.query(
        'SELECT id FROM users WHERE TRIM(CONCAT(apellido, " ", nombre)) = ? LIMIT 1',
        [usuarioExcel]
      )

      // Si no encuentra, buscar por Nombre Apellido
      if (!userRows.length) {
        [userRows] = await pool.query(
          'SELECT id FROM users WHERE TRIM(CONCAT(nombre, " ", apellido)) = ? LIMIT 1',
          [usuarioExcel]
        )
      }

      if (!userRows.length) {
        errores.push({ consecutivo, error: `Usuario no encontrado: ${usuarioExcel} (probado ambos órdenes)` })
        continue
      }
      const id_usuario = userRows[0].id

      // Buscar id_sede
      const [sedeRows]: any = await pool.query(
        'SELECT id_sede FROM Sedes WHERE TRIM(nombre_sede) = ? LIMIT 1',
        [sedeExcel]
      )
      if (!sedeRows.length) {
        errores.push({ consecutivo, error: `Sede no encontrada: ${sedeExcel}` })
        continue
      }
      const id_sede = sedeRows[0].id_sede
  

      // Buscar id_tipo_reporte
      const [tipoReporteRows]: any = await pool.query(
        'SELECT id_tipo_reporte FROM tipos_reporte WHERE nombre_tipo_reporte = ? LIMIT 1',
        [tipoReporte]
      )
      if (!tipoReporteRows.length) {
        errores.push({ consecutivo, error: `Tipo de reporte no encontrado: ${tipoReporte}` })
        continue
      }
      const id_tipo_reporte = tipoReporteRows[0].id_tipo_reporte

      // Buscar id_tipo_evento
      const [tipoEventoRows]: any = await pool.query(
        'SELECT id_tipo_evento FROM tipos_evento WHERE nombre_tipo_evento = ? AND id_tipo_reporte = ? LIMIT 1',
        [tipoEvento, id_tipo_reporte]
      )
      if (!tipoEventoRows.length) {
        errores.push({ consecutivo, error: `Tipo de evento no encontrado: ${tipoEvento}` })
        continue
      }
      const id_tipo_evento = tipoEventoRows[0].id_tipo_evento

      // Buscar id_tipo_negocio
      const [tipoNegocioRows]: any = await pool.query(
        'SELECT id_tipo_negocio FROM tipos_negocio_cementos WHERE nombre_tipo_negocio = ? LIMIT 1',
        [tipoNegocio]
      )
      if (!tipoNegocioRows.length) {
        errores.push({ consecutivo, error: `Tipo de negocio no encontrado: ${tipoNegocio}` })
        continue
      }
      const id_tipo_negocio = tipoNegocioRows[0].id_tipo_negocio

      // Insertar novedad
      const [result]: any = await pool.query(
        `INSERT INTO novedades_cementos_argos (
          id_usuario, consecutivo, fecha_hora_novedad, id_estado_proceso, id_tipo_reporte, id_tipo_evento, id_tipo_negocio, id_sede, gestion, descripcion, fecha_hora_registro, evento_critico
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
        [
          id_usuario,
          consecutivo,
          fechaNovedad, 
          id_tipo_reporte,
          id_tipo_evento,
          id_tipo_negocio,
          id_sede,
          gestion,
          descripcion,
          fechaRegistro
        ]
      )
      if (result && result.insertId) {
        insertados++
        exitos.push({ consecutivo, insertId: result.insertId })
      } else {
        errores.push({ consecutivo, error: 'No insertId returned' })
      }
    } catch (e: any) {
      errores.push({ consecutivo: nov['Consecutvo'], error: e.message })
    }
  }
  console.log('Insertados:', insertados, 'Errores:', errores)
  return NextResponse.json({ ok: true, insertados, exitos, errores })
} 