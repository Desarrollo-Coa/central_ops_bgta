import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  const { consecutivos } = await req.json()
  if (!Array.isArray(consecutivos) || consecutivos.length === 0) {
    return NextResponse.json({ faltantes: [] })
  }
  const [rows] = await pool.query(
    `SELECT consecutivo FROM novedades_cementos_argos WHERE consecutivo IN (${consecutivos.map(() => '?').join(',')})`,
    consecutivos
  )
  const existentes = (rows as any).map((r: any) => r.consecutivo)
  const faltantes = consecutivos.filter((c: any) => !existentes.includes(c))
  return NextResponse.json({ faltantes })
} 