'use client';

import { useEffect, useState } from "react";

type Emp = { id: string; nom: string; email: string; actif: boolean };

export default function NewShiftForm({ onCreated }: { onCreated: () => void }) {
  const [emps, setEmps] = useState<Emp[]>([]);
  const [employeId, setEmployeId] = useState("");
  const [date, setDate] = useState<string>("");
  const [start, setStart] = useState<string>("09:00");
  const [end, setEnd] = useState<string>("17:00");
  const [boutique, setBoutique] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadEmps() {
    const res = await fetch("/api/employes");
    const json = await res.json();
    if (json.ok) setEmps(json.data);
  }

  useEffect(() => { loadEmps(); }, []);

  function toISO(dateStr: string, hm: string) {
    // Construit un ISO UTC simple YYYY-MM-DDTHH:mm:00.000Z
    return `${dateStr}T${hm}:00.000Z`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!employeId || !date) { setMsg("Choisis un employé et une date"); return; }
    setLoading(true);
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        employe_id: employeId,
        start_at: toISO(date, start),
        end_at: toISO(date, end),
        boutique: boutique || null
      })
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) { setMsg(json.message || "Erreur"); return; }
    setEmployeId(""); setDate(""); setStart("09:00"); setEnd("17:00"); setBoutique("");
    onCreated();
  }

  return (
    <form onSubmit={submit} style={{ display:"grid", gap:8, alignItems:"center" }}>
      <div style={{ display:"grid", gap:6 }}>
        <label>Employé</label>
        <select value={employeId} onChange={e=>setEmployeId(e.target.value)} required>
          <option value="">— choisir —</option>
          {emps.map(e => <option key={e.id} value={e.id}>{e.nom} ({e.email})</option>)}
        </select>
      </div>

      <div style={{ display:"grid", gap:6 }}>
        <label>Date</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} required />
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <div style={{ display:"grid", gap:6 }}>
          <label>Début</label>
          <input type="time" value={start} onChange={e=>setStart(e.target.value)} required />
        </div>
        <div style={{ display:"grid", gap:6 }}>
          <label>Fin</label>
          <input type="time" value={end} onChange={e=>setEnd(e.target.value)} required />
        </div>
      </div>

      <div style={{ display:"grid", gap:6 }}>
        <label>Boutique (optionnel)</label>
        <input value={boutique} onChange={e=>setBoutique(e.target.value)} placeholder="Boutique A" />
      </div>

      <button type="submit" disabled={loading}>{loading ? "Ajout..." : "Ajouter le shift"}</button>
      {msg && <p style={{ color:"crimson" }}>{msg}</p>}
    </form>
  );
}
