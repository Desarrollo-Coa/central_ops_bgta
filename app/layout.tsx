import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Central Op " + process.env.NEXT_PUBLIC_OPERACION || "Central Op",
  description: "Plataforma de gestión operativa",
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-100`} suppressHydrationWarning>
        {children}
        <Toaster 
          richColors 
          position="top-right" 
          duration={3000}
          closeButton={true}
          expand={false}
        />
      </body>
    </html>
  );
}