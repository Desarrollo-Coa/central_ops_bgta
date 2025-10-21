import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout exitoso" });
  
  // Borrar la cookie estableciendo su expiración en el pasado
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0
  });

  return response;
} 