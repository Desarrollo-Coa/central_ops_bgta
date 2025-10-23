import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

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

    const [result] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as existe FROM destinatarios WHERE email = ?',
      [email]
    )

    return NextResponse.json({ existe: result[0].existe > 0 })
  } catch (error) {
    console.error('Error al verificar destinatario:', error)
    return NextResponse.json(
      { error: 'Error al verificar destinatario' },
      { status: 500 }
    )
  }
} 