"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  shift_id: string;
  boutique: string | null;
  start_at: string;
  end_at: string;
  employe: { id: string; nom: string; email: string };
  dernier_pointage: { id: string; type: "ENTREE"|"SORTIE"; horodatage: string } | null;
  statut: "A_LHEURE" | "EN_RETARD" | "PRESENT" | "ABSENT" | "TERMINE";
  minutesLate: number;
};

export default function Dashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [boutiques, setBoutiques] = useState<string[]>([]);
  const [selectedBoutique, setSelectedBoutique] = useState<string>("");
  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedBoutique) params.set("boutique", selectedBoutique);
    if (threshold !== 5) params.set("threshold", String(threshold));

    const res = await fetch(`/api/dashboard/today?${params.toString()}`);
    const json = await res.json();
    if (json.ok) {
      setRows(json.data);
      setBoutiques(json.boutiques ?? []);
    }
    setLoading(false);
  }

  useEffect(()=>{ load(); /* on mount */ }, []); // eslint-disable-line
  useEffect(()=>{ load(); /* on filter change */ }, [selectedBoutique, threshold]); // eslint-disable-line

  const counters = useMemo(()=>{
    const c = { PRESENT:0, EN_RETARD:0, ABSENT:0, A_LHEURE:0, TERMINE:0 };
    rows.forEach(r => { (c as any)[r.statut]++; });
    return c;
  }, [rows]);

  const badge = (s: Row["statut"]) => {
    const map: Record<Row["statut"], string> = {
      PRESENT:  "#e6f4ea",
      EN_RETARD:"#fde8e8",
      ABSENT:   "#fff3cd",
      A_LHEURE: "#e7f0ff",
      TERMINE:  "#f1f1f1",
    };
    return { background: map[s], padding: "2px 8px", borderRadius: 999, fontSize: 12 };
  };

  return (
    <section>
      <h2>Dashboard — Aujourd’hui</h2>

      <div style={{ display:"flex", gap:12, alignItems:"center", marginTop:8, flexWrap:"wrap" }}>
        <label>Boutique</label>
        <select value={selectedBoutique} onChange={e=>setSelectedBoutique(e.target.value)}>
          <option value="">Toutes</option>
          {boutiques.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <label style={{ marginLeft:12 }}>Seuil retard (min)</label>
        <input type="number" value={threshold} min={0} max={120} onChange={e=>setThreshold(parseInt(e.target.value||"0"))} style={{ width:80 }} />

        <button onClick={load}>Rafraîchir</button>
      </div>

      <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" }}>
        <span style={{ ...badge("PRESENT") }}>Présent: {counters.PRESENT}</span>
        <span style={{ ...badge("EN_RETARD") }}>En retard: {counters.EN_RETARD}</span>
        <span style={{ ...badge("ABSENT") }}>Absent: {counters.ABSENT}</span>
        <span style={{ ...badge("A_LHEURE") }}>À l’heure: {counters.A_LHEURE}</span>
        <span style={{ ...badge("TERMINE") }}>Terminé: {counters.TERMINE}</span>
      </div>

      {loading ? <p style={{ marginTop:12 }}>Chargement…</p> : (
        <div style={{ overflowX:"auto", marginTop:12 }}>
          <table style={{ borderCollapse:"collapse", minWidth:900 }}>
            <thead>
              <tr>
                <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>Employé</th>
                <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>Boutique</th>
                <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>Shift</th>
                <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>Dernier pointage</th>
                <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.shift_id}>
                  <td style={{ borderBottom:"1px solid #f5f5f5", padding:8 }}>
                    <b>{r.employe.nom}</b> <span style={{ color:"#777" }}>({r.employe.email})</span>
                  </td>
                  <td style={{ borderBottom:"1px solid #f5f5f5", padding:8 }}>{r.boutique ?? "—"}</td>
                  <td style={{ borderBottom:"1px solid #f5f5f5", padding:8 }}>
                    {new Date(r.start_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                    {" - "}
                    {new Date(r.end_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
                  </td>
                  <td style={{ borderBottom:"1px solid #f5f5f5", padding:8 }}>
                    {r.dernier_pointage
                      ? `${r.dernier_pointage.type} · ${new Date(r.dernier_pointage.horodatage).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}`
                      : "—"}
                  </td>
                  <td style={{ borderBottom:"1px solid #f5f5f5", padding:8 }}>
                    <span style={badge(r.statut)}>
                      {r.statut.replace("_"," ")}
                      {r.statut==="EN_RETARD" ? ` (+${r.minutesLate} min)` : ""}
                    </span>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={5} style={{ padding:12, color:"#666" }}>Aucun shift aujourd’hui pour ce filtre.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
