import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { ResultSetHeader } from "mysql2";

// GET: Listar todos los negocios
export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT id_negocio, nombre_negocio, activo, fecha_creacion, fecha_actualizacion FROM negocios ORDER BY id_negocio ASC`
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Error al obtener negocios:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ 
      error: "Error al obtener negocios", 
      details: errorMessage 
    }, { status: 500 });
  }
}

// POST: Crear un nuevo negocio
export async function POST(request: Request) {
  try {
    const { nombre_negocio, activo } = await request.json();
    if (!nombre_negocio || typeof nombre_negocio !== "string") {
      return NextResponse.json({ error: "Nombre de negocio requerido" }, { status: 400 });
    }
    // activo puede ser true/false, por defecto true
    const [result] = await pool.query(
      `INSERT INTO negocios (nombre_negocio, activo) VALUES (?, ?)`,
      [nombre_negocio, typeof activo === 'boolean' ? activo : true]
    );
    const insertId = (result as ResultSetHeader).insertId;
    // Devolver el negocio recién creado
    const [rows] = await pool.query(
      `SELECT id_negocio, nombre_negocio, activo, fecha_creacion, fecha_actualizacion FROM negocios WHERE id_negocio = ?`,
      [insertId]
    );
    const negocio = (rows as any[])[0];
    return NextResponse.json({ message: "Negocio creado", negocio }, { status: 201 });
  } catch (error) {
    console.error("Error al crear negocio:", error);
    return NextResponse.json({ error: "Error al crear negocio" }, { status: 500 });
  }
} 