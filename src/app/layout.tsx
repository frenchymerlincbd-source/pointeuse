// dans RootLayout, à l’intérieur de <head>…</head>
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* 🔑 Balise de vérification Google Search Console */}
        <meta
          name="google-site-verification"
          content="ZgoTO0vDWAB9rIVPpFfKurO_ZwUCda52osVw42OEGR4"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header style={{ padding: "12px 20px", background: "#222", color: "#fff" }}>
          <nav style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/" style={{ color: "#fff", textDecoration: "none" }}>Accueil</a>
            <a href="/pointer" style={{ color: "#fff", textDecoration: "none" }}>Pointer</a>
            <a href="/employes" style={{ color: "#fff", textDecoration: "none" }}>Employés</a>
            <a href="/planning/week" style={{ color: "#fff", textDecoration: "none" }}>Planning semaine</a>
            <a href="/alertes" style={{ color: "#fff", textDecoration: "none" }}>Alertes</a>
            <a href="/pointages" style={{ color: "#fff", textDecoration: "none" }}>Historique</a>
            <a href="/dashboard" style={{ color: "#fff", textDecoration: "none" }}>Dashboard</a>
          </nav>
        </header>

        <main style={{ padding: "20px" }}>{children}</main>

        <footer style={{ padding: "16px 20px", background: "#f5f5f5" }}>
          <small>© 2025 Pointeuse</small>
        </footer>
      </body>
    </html>
  );
}



import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pointeuse – Planning & Pointages en Boutique",
  description:
    "Application de pointage simple pour les boutiques : planning hebdo, borne de pointage, alertes de retard et dashboard managers.",
  metadataBase: new URL("https://pointeuse-xxxxx.vercel.app"), // remplace
  openGraph: {
    title: "Pointeuse – Planning & Pointages",
    description:
      "Planning hebdo, borne de pointage (iPad), alertes de retard et dashboard managers.",
    url: "https://pointeuse-xxxxx.vercel.app",
    siteName: "Pointeuse",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <header style={{ padding: "12px 20px", background: "#222", color: "#fff" }}>
  <nav style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
    <a href="/" style={{ color:"#fff", textDecoration:"none" }}>Accueil</a>
    <a href="/pointer" style={{ color:"#fff", textDecoration:"none" }}>Pointer</a>
    <a href="/employes" style={{ color:"#fff", textDecoration:"none" }}>Employés</a>
    <a href="/planning/week" style={{ color:"#fff", textDecoration:"none" }}>Planning semaine</a>
    <a href="/alertes" style={{ color:"#fff", textDecoration:"none" }}>Alertes</a>
    <a href="/pointages" style={{ color:"#fff", textDecoration:"none" }}>Historique</a>
    <a href="/dashboard" style={{ color:"#fff", textDecoration:"none" }}>Dashboard</a>
  </nav>
</header>


        <main style={{ padding: "20px" }}>{children}</main>

        <footer style={{ padding: "16px 20px", background: "#f5f5f5" }}>
          <small>© 2025 Pointeuse</small>
        </footer>
      </body>
    </html>
  );
}
