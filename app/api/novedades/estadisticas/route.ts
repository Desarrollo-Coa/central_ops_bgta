import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filtroTemporal = searchParams.get('filtroTemporal')
    const zona = searchParams.get('zona')

    if (!filtroTemporal) {
      return NextResponse.json(
        { error: 'Filtro temporal es requerido' },
        { status: 400 }
      )
    }

    if (!zona) {
      return NextResponse.json(
        { error: 'Zona es requerida' },
        { status: 400 }
      )
    }

    let query = ''

    switch (filtroTemporal) {
      case 'anual':
        // Novedades por año
        query = `
          SELECT 
            YEAR(n.fecha_hora_novedad) as nombre,
            COUNT(*) as cantidad
          FROM novedades_cementos_argos n
          JOIN Sedes s ON n.id_sede = s.id_sede
          JOIN zonas_cementos_argos z ON s.id_zona = z.id_zona
          WHERE z.nombre_zona = ?
          GROUP BY YEAR(n.fecha_hora_novedad)
          ORDER BY nombre DESC
        `
        break

      case 'tipo':
        // Porcentaje de novedades por tipo
        query = `
          WITH total_novedades AS (
            SELECT COUNT(*) as total 
            FROM novedades_cementos_argos n
            JOIN Sedes s ON n.id_sede = s.id_sede
            JOIN zonas_cementos_argos z ON s.id_zona = z.id_zona
            WHERE z.nombre_zona = ?
          )
          SELECT 
            te.nombre_tipo_evento as nombre,
            COUNT(*) as cantidad,
            ROUND((COUNT(*) * 100.0 / (SELECT total FROM total_novedades)), 2) as porcentaje
          FROM novedades_cementos_argos n
          JOIN Sedes s ON n.id_sede = s.id_sede
          JOIN zonas_cementos_argos z ON s.id_zona = z.id_zona
          JOIN tipos_evento te ON n.id_tipo_evento = te.id_tipo_evento
          WHERE z.nombre_zona = ?
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
          FROM novedades_cementos_argos n
          JOIN Sedes s ON n.id_sede = s.id_sede
          JOIN zonas_cementos_argos z ON s.id_zona = z.id_zona
          JOIN puestos_cementos_argos p ON n.id_puesto = p.id_puesto
          WHERE z.nombre_zona = ?
          GROUP BY p.nombre_puesto
          ORDER BY cantidad DESC
          LIMIT 10
        `
        break

      default:
        throw new Error('Filtro temporal no válido')
    }

    const params = filtroTemporal === 'tipo' ? [zona, zona] : [zona]
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