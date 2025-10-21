import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface ActiveUserRow extends RowDataPacket {
  id: number;
  nombre: string;
  rol: string;
  ultima_actividad: string;
}

export async function GET() {
  let connection;
  try {
    connection = await db.getConnection();
    
    // Hora actual del servidor (debug)
    console.log('Hora actual del servidor:', new Date().toISOString());

    // Usuarios activos en las últimas 24 horas
    const activeUsersQuery = `SELECT 
      u.id,
      u.nombre,
      r.nombre as rol,
      us.last_activity as ultima_actividad
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN user_sessions us ON u.id = us.user_id
    WHERE us.last_activity >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ORDER BY us.last_activity DESC`;
    const [activeRows] = await connection.execute<ActiveUserRow[]>(activeUsersQuery);
    const activeUsers = activeRows.length;

    // Total de usuarios
    const [totalUsersResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users'
    );
    const totalUsers = (totalUsersResult as any)[0]?.total ?? 0;

    // Porcentaje de usuarios activos
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    // Respuesta profesional
    return NextResponse.json({
      totalUsers,
      activeUsers,
      activePercentage,
      users: activeRows
    });
  } catch (error) {
    console.error("Error detallado en active-users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios activos", details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  } finally {
    if (connection) try { connection.release(); } catch {}
  }
} 