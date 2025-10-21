export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export async function GET() {
  try {
    const [result] = await pool.query<RowDataPacket[]>(`
      SELECT 
        h.id_envio,
        h.id_novedad,
        n.consecutivo,
        h.fecha_envio,
        CONCAT(u.nombre, ' ', u.apellido) AS operador,
        h.destinatarios,
        h.estado,
        h.mensaje_error
      FROM historial_envios h
      INNER JOIN novedades n ON h.id_novedad = n.id_novedad
      INNER JOIN users u ON h.operador_id = u.id
      ORDER BY h.fecha_envio DESC
    `)

    const envios = await Promise.all(result.map(async (envio) => {
      let destinatarios: any[] = [];
      try {
        if (typeof envio.destinatarios === 'string') {
          destinatarios = JSON.parse(envio.destinatarios)
        } else if (Array.isArray(envio.destinatarios)) {
          destinatarios = envio.destinatarios
        } else {
          destinatarios = []
        }
      } catch (e) {
        destinatarios = []
      }

      // Normalizar destinatarios para que tengan las propiedades requeridas
      const destinatariosConEstado = await Promise.all(
        destinatarios.map(async (dest: any) => {
          const [destResult] = await pool.query<RowDataPacket[]>(
            'SELECT nombre, activo FROM destinatarios WHERE email = ?',
            [dest.email]
          )
          const existe = destResult.length > 0
          return {
            email: dest.email,
            nombre: dest.nombre || (existe ? destResult[0].nombre : ''),
            activo: existe ? !!destResult[0].activo : false,
            existe
          }
        })
      )

      return {
        ...envio,
        destinatarios: destinatariosConEstado
      }
    }))

    return NextResponse.json(envios)
  } catch (error) {
    console.error('Error al obtener historial de envíos:', error)
    return NextResponse.json(
      { error: 'Error al obtener historial de envíos' },
      { status: 500 }
    )
  }
} 