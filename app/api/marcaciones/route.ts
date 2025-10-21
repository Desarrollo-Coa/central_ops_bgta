import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const id_cliente = searchParams.get("id_cliente");

  // id_cliente es obligatorio
  if (!id_cliente) {
    return NextResponse.json({ error: "id_cliente es obligatorio" }, { status: 400 });
  }

  let query = "SELECT * FROM puntos_marcacion";
  let params: (string | number)[] = [];
  let where: string[] = [];

  where.push("id_cliente = ?");
  params.push(id_cliente);

  if (desde && hasta) {
    where.push("fecha BETWEEN ? AND ?");
    params.push(desde, hasta);
  }
  if (where.length > 0) {
    query += " WHERE " + where.join(" AND ");
  }

  try {
    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
