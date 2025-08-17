"use client";
import { useState } from "react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");

  async function pointer(action: "ENTREE" | "SORTIE") {
    setMsg("");
    const res = await fetch("/api/pointer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin, action }),
    });
    const data = await res.json();
    setMsg(data.message || (res.ok ? "OK" : "Erreur"));
    if (res.ok) setPin("");
  }

  return (
    <div style={{ padding: 24, maxWidth: 380 }}>
      <h1 style={{ marginBottom: 12 }}>Borne de pointage</h1>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />
      <input
        placeholder="PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        inputMode="numeric"
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={() => pointer("ENTREE")}>Entrée</button>
        <button onClick={() => pointer("SORTIE")}>Sortie</button>
      </div>
      <p>{msg}</p>
    </div>
  );
}
