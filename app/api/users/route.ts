// app/api/users/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db"; // Usamos el pool global en lugar de crear uno nuevo
import { RowDataPacket } from "mysql2/promise"; // Añadimos RowDataPacket

// Definimos una interfaz para los resultados
interface UserRow extends RowDataPacket {
  id: number;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  role_name: string | null;
}

export async function GET() {
  try {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.username,
        u.email,
        r.nombre as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id`
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}