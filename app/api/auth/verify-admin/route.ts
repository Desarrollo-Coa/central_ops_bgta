import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Configuración de administrador no encontrada" },
        { status: 500 }
      );
    }

    if (password === ADMIN_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      response.cookies.set("admin_auth", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60, // 1 hora
      });

      return response;
    }

    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Error en verify-admin:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 