import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const colaboradorId = searchParams.get("colaboradorId");
    const fecha = searchParams.get("fecha");
    const puestoId = searchParams.get("puestoId");
    const tipoTurno = searchParams.get("tipoTurno");

    if (!colaboradorId || !fecha || !puestoId) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    // Mapear tipoTurno a id_tipo_turno
    let idTipoTurno: number | undefined = undefined;
    if (tipoTurno === "diurno") idTipoTurno = 1;
    else if (tipoTurno === "nocturno") idTipoTurno = 2;
    else if (tipoTurno === "turno_b") idTipoTurno = 3;

    // Traer todos los cumplidos y su reporte (LEFT JOIN)
    let cumplidosQuery = `
      SELECT c.id_cumplido, c.id_colaborador, c.id_tipo_turno, p.nombre_puesto, col.nombre, col.apellido, col.foto_url, rc.calificaciones
      FROM cumplidos c
      JOIN puestos p ON c.id_puesto = p.id_puesto
      LEFT JOIN colaboradores col ON c.id_colaborador = col.id
      LEFT JOIN reporte_comunicacion rc ON rc.id_cumplido = c.id_cumplido
      WHERE c.id_puesto = ? AND c.fecha = ? AND c.id_colaborador = ?`;
    const cumplidosParams: any[] = [puestoId, fecha, colaboradorId];
    if (idTipoTurno) {
      cumplidosQuery += ' AND c.id_tipo_turno = ?';
      cumplidosParams.push(idTipoTurno);
    }
    const [cumplidos] = await pool.query<RowDataPacket[]>(cumplidosQuery, cumplidosParams);

    if (!cumplidos || cumplidos.length === 0) {
      return NextResponse.json({ error: "No existe cumplido para esos datos" }, { status: 404 });
    }

    // Selecciona el primer cumplido con calificaciones no nulas
    const cumplido = cumplidos.find(c => c.calificaciones !== null) || cumplidos[0];
    const id_cumplido = cumplido.id_cumplido;

    // Traer notas asociadas al cumplido
    const [notas] = await pool.query<RowDataPacket[]>(
      'SELECT nota FROM notas_cumplidos WHERE id_cumplido = ?',
      [id_cumplido]
    );

    // Construir respuesta
    return NextResponse.json({
      id_cumplido,
      colaborador: {
        id: colaboradorId,
        nombre: [cumplido.nombre, cumplido.apellido].filter(Boolean).join(' '),
        foto_url: cumplido.foto_url
      },
      puesto: cumplido.nombre_puesto,
      fecha,
      id_tipo_turno: cumplido.id_tipo_turno,
      nota: notas && notas.length > 0 ? notas[0].nota : null,
      reportes: cumplido.calificaciones
        ? (typeof cumplido.calificaciones === "string"
            ? JSON.parse(cumplido.calificaciones)
            : cumplido.calificaciones)
        : null
    });
  } catch (error) {
    console.error("Error al obtener reporte por colaborador:", error);
    return NextResponse.json({ error: "Error al obtener reporte por colaborador" }, { status: 500 });
  }
} 