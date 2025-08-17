"use client";
import { useEffect, useState } from "react";

function startOfISOWeek(d: Date) {
  const day = d.getDay() || 7;
  const res = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  res.setUTCDate(res.getUTCDate() - (day - 1));
  res.setUTCHours(0,0,0,0);
  return res;
}
export default function MonPlanning() {
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    if (!email) return;
    const from = startOfISOWeek(new Date()).toISOString();
    const to = new Date(startOfISOWeek(new Date())); to.setUTCDate(to.getUTCDate()+7);
    const res = await fetch(`/api/shifts?from=${from}&to=${to.toISOString()}`);
    const json = await res.json();
    if (json.ok) {
      setRows((json.data as any[]).filter(r=>r.employes?.email===email));
    }
  }
  useEffect(()=>{ /* vide */ },[]);

  return (
    <section style={{ maxWidth:520 }}>
      <h2>Mon planning (semaine)</h2>
      <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="mon.email@exemple.com"
             style={{ width:"100%", padding:8, border:"1px solid #ccc", borderRadius:6 }} />
      <button onClick={load} style={{ marginTop:8 }}>Afficher</button>

      <ul style={{ marginTop:12 }}>
        {rows.map((r,i)=>(
          <li key={i}>
            {new Date(r.start_at).toLocaleDateString("fr-FR", { weekday:"short", day:"2-digit", month:"2-digit" })}
            {" · "}
            {new Date(r.start_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
            {" - "}
            {new Date(r.end_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
            {r.boutique ? ` · ${r.boutique}` : ""}
          </li>
        ))}
        {!rows.length && <li style={{ color:"#666" }}>Aucun créneau pour cette semaine.</li>}
      </ul>
    </section>
  );
}
