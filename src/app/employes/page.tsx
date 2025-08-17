'use client';

import { useEffect, useState } from "react";

type Emp = { id: string; nom: string; email: string; actif: boolean };

export default function EmployesPage() {
  const [rows, setRows] = useState<Emp[]>([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/employes");
    const json = await res.json();
    if (json.ok) setRows(json.data);
    setLoading(false);
  }

  async function addEmp(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/employes", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ nom, email, pin }),
    });
    const json = await res.json();
    if (!json.ok) {
      setMsg(json.message || "Erreur");
      return;
    }
    setNom(""); setEmail(""); setPin("");
    await load();
  }

  useEffect(()=>{ load(); }, []);

  return (
    <section>
      <h2>Employés</h2>

      <form onSubmit={addEmp} style={{ display:"grid", gap:8, maxWidth:420, marginTop:12 }}>
        <input placeholder="Nom"
               value={nom} onChange={e=>setNom(e.target.value)} required />
        <input placeholder="Email" type="email"
               value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="PIN (4-6 chiffres)"
               value={pin} onChange={e=>setPin(e.target.value)} minLength={4} maxLength={6} required />
        <button type="submit">Ajouter l’employé</button>
        {msg && <p style={{ color:"crimson" }}>{msg}</p>}
      </form>

      <h3 style={{ marginTop:24 }}>Liste</h3>
      {loading ? <p>Chargement…</p> : (
        <ul style={{ marginTop:8 }}>
          {rows.map(e => (
            <li key={e.id} style={{ marginBottom:6 }}>
              <b>{e.nom}</b> — <span style={{ color:"#555" }}>{e.email}</span> {e.actif ? "" : "(inactif)"}
            </li>
          ))}
          {rows.length === 0 && <li>Aucun employé.</li>}
        </ul>
      )}
    </section>
  );
}
