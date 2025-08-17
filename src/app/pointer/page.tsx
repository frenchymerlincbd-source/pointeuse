"use client";

import { useState } from "react";

export default function PointerPage() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [type, setType] = useState<"ENTREE" | "SORTIE">("ENTREE");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function pointer() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pointer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin, type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erreur");
      setMsg("✅ Pointage enregistré");
      setPin("");
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 420 }}>
      <h2>Borne de pointage</h2>

      <label style={{ display:"block", margin:"12px 0 4px" }}>Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="paul@example.com"
        style={{ width:"100%", padding:8, border:"1px solid #ccc", borderRadius:6 }}
      />

      <label style={{ display:"block", margin:"12px 0 4px" }}>PIN</label>
      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        inputMode="numeric"
        maxLength={6}
        style={{ width:"100%", padding:8, border:"1px solid #ccc", borderRadius:6 }}
      />

      <div style={{ display:"flex", gap:12, marginTop:12 }}>
        <button onClick={() => setType("ENTREE")}
          style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #ddd",
                   background: type==="ENTREE" ? "#e6f4ea" : "#fff" }}>
          Entrée
        </button>
        <button onClick={() => setType("SORTIE")}
          style={{ padding:"8px 12px", borderRadius:6, border:"1px solid #ddd",
                   background: type==="SORTIE" ? "#fde8e8" : "#fff" }}>
          Sortie
        </button>
      </div>

      <button
        onClick={pointer}
        disabled={loading || !email || !pin}
        style={{ marginTop:16, padding:"10px 14px", borderRadius:8, border:"none", background:"#111", color:"#fff" }}
      >
        {loading ? "Enregistrement..." : `Pointer ${type === "ENTREE" ? "Entrée" : "Sortie"}`}
      </button>

      {msg && <p style={{ marginTop:12 }}>{msg}</p>}
    </section>
  );
}
