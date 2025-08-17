import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pointeuse",
  description: "Application de suivi des pointages",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header style={{ padding: "16px 20px", background: "#222", color: "#fff" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <h1 style={{ margin: 0 }}>Pointeuse</h1>
           <nav style={{ display:"flex", gap:16 }}>
  <a href="/" style={{ color:"#fff", textDecoration:"none" }}>Accueil</a>
  <a href="/pointer" style={{ color:"#fff", textDecoration:"none" }}>Pointer</a>
  <a href="/historique" style={{ color:"#fff", textDecoration:"none" }}>Historique</a>
  <a href="/alertes" style={{ color:"#fff", textDecoration:"none" }}>Alertes</a>
  <a href="/dashboard" style={{ color:"#fff", textDecoration:"none" }}>Dashboard</a>
</nav>

          </div>
        </header>

        <main style={{ padding: "20px" }}>{children}</main>

        <footer style={{ padding: "16px 20px", background: "#f5f5f5" }}>
          <small>© 2025 Pointeuse</small>
        </footer>
      </body>
    </html>
  );
}
