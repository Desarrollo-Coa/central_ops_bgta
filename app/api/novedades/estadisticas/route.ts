import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filtroTemporal = searchParams.get('filtroTemporal')
    const unidadNegocio = searchParams.get('unidadNegocio')
    const negocio = searchParams.get('negocio')

    if (!filtroTemporal) {
      return NextResponse.json(
        { error: 'Filtro temporal es requerido' },
        { status: 400 }
      )
    }

    let query = ''
    let params: any[] = []

    switch (filtroTemporal) {
      case 'anual':
        // Novedades por año
        query = `
          SELECT 
            YEAR(n.fecha_hora_novedad) as nombre,
            COUNT(*) as cantidad
          FROM novedades n
          JOIN puestos p ON n.id_puesto = p.id_puesto
          JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
          JOIN negocios ne ON un.id_negocio = ne.id_negocio
          WHERE p.activo = 1
          GROUP BY YEAR(n.fecha_hora_novedad)
          ORDER BY nombre DESC
        `
        break

      case 'tipo':
        // Porcentaje de novedades por tipo
        query = `
          WITH total_novedades AS (
            SELECT COUNT(*) as total 
            FROM novedades n
            JOIN puestos p ON n.id_puesto = p.id_puesto
            JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
            JOIN negocios ne ON un.id_negocio = ne.id_negocio
            WHERE p.activo = 1
          )
          SELECT 
            te.nombre_tipo_evento as nombre,
            COUNT(*) as cantidad,
            ROUND((COUNT(*) * 100.0 / (SELECT total FROM total_novedades)), 2) as porcentaje
          FROM novedades n
          JOIN puestos p ON n.id_puesto = p.id_puesto
          JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
          JOIN negocios ne ON un.id_negocio = ne.id_negocio
          JOIN tipos_evento te ON n.id_tipo_evento = te.id_tipo_evento
          WHERE p.activo = 1
          GROUP BY te.nombre_tipo_evento
          ORDER BY cantidad DESC
        `
        break

      case 'puesto':
        // Top 10 puestos con más novedades
        query = `
          SELECT 
            p.nombre_puesto as nombre,
            COUNT(*) as cantidad
          FROM novedades n
          JOIN puestos p ON n.id_puesto = p.id_puesto
          JOIN unidades_negocio un ON p.id_unidad = un.id_unidad
          JOIN negocios ne ON un.id_negocio = ne.id_negocio
          WHERE p.activo = 1
          GROUP BY p.nombre_puesto
          ORDER BY cantidad DESC
          LIMIT 10
        `
        break

      default:
        throw new Error('Filtro temporal no válido')
    }

    const [datos] = await pool.query(query, params)
    
    return NextResponse.json(Array.isArray(datos) ? datos : [])
  } catch (error) {
    console.error('Error en estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
} 