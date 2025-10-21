// app/api/users/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { decrypt } from "@/lib/encryption";
import { RowDataPacket } from "mysql2"; // Añadimos RowDataPacket

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "tu_clave_secreta_aqui");

// Actualizamos las interfaces para que extiendan RowDataPacket
interface UserRow extends RowDataPacket {
  password: string;
}

interface TargetUserRow extends RowDataPacket {
  email: string;
}

interface SolicitudRow extends RowDataPacket {
  raw_password: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, currentUserPassword } = await req.json();
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, SECRET_KEY);
    const currentUserId = payload.id as string;
    const currentUserRole = payload.role as string;

    if (currentUserRole !== "Administrador" && currentUserRole !== "administrador") {
      return NextResponse.json({ error: "No autorizado: se requiere rol de administrador" }, { status: 403 });
    }

    const [currentUserRows] = await pool.query<UserRow[]>("SELECT password FROM users WHERE id = ?", [currentUserId]);
    const currentUser = currentUserRows[0];

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario autenticado no encontrado" }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(currentUserPassword, currentUser.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    const [targetUserRows] = await pool.query<TargetUserRow[]>("SELECT email FROM users WHERE id = ?", [userId]);
    const targetUser = targetUserRows[0];

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario solicitado no encontrado" }, { status: 404 });
    }

    console.log("Procesando solicitud de contraseña...");

    const [solicitudRows] = await pool.query<SolicitudRow[]>(
      "SELECT raw_password FROM solicitudes_cuenta WHERE email = ? AND estado = 'aprobado'",
      [targetUser.email]
    );
    const solicitud = solicitudRows[0];

    if (!solicitud || !solicitud.raw_password) {
      return NextResponse.json({ error: "No se encontró la contraseña original" }, { status: 404 });
    }

    const decryptedPassword = decrypt(solicitud.raw_password);
    return NextResponse.json({ password: decryptedPassword }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Error en el servidor" }, { status: 500 });
  }
}