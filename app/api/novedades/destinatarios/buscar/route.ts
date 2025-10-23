import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'El parámetro email es requerido' },
        { status: 400 }
      )
    }

    const [result] = await pool.query(`
      SELECT id_destinatario, email, nombre
      FROM destinatarios
      WHERE email LIKE ?
      AND activo = true
      LIMIT 10
    `, [`%${email}%`])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error al buscar destinatarios:', error)
    return NextResponse.json(
      { error: 'Error al buscar destinatarios' },
      { status: 500 }
    )
  }
}