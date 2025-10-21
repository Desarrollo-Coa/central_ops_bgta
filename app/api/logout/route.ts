import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

interface UserSession extends RowDataPacket {
  user_id: number;
}

export async function POST(request: Request) {
  let connection;
  try {
    connection = await db.getConnection();
    
    // Obtener el token de la cookie
    const cookieHeader = request.headers.get("cookie");
    const token = cookieHeader?.split("token=")[1]?.split(";")[0];
    
    if (token) {
      // Primero obtener el ID del usuario desde la sesión
      const [rows] = await connection.execute<UserSession[]>(
        `SELECT user_id FROM user_sessions 
         WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
         ORDER BY last_activity DESC LIMIT 1`
      );

      if (rows && rows.length > 0 && rows[0].user_id) {
        // Eliminar la sesión del usuario
        await connection.execute(
          `DELETE FROM user_sessions WHERE user_id = ?`,
          [rows[0].user_id]
        );
      }
    }

    const response = NextResponse.json({ message: "Logout exitoso" });

    // Borrar la cookie estableciendo su expiración en el pasado
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { error: "Error durante el logout" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
