import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pointeuse",
  description: "Application de suivi des pointages",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header style={{ padding: "20px", background: "#222", color: "#fff" }}>
          <h1>Pointeuse</h1>
        </header>
        <main style={{ padding: "20px" }}>{children}</main>
        <footer style={{ padding: "20px", background: "#f0f0f0" }}>
          <small>© 2025 Pointeuse - Tous droits réservés</small>
        </footer>
      </body>
    </html>
  );
}
