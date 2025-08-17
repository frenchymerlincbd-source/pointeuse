"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { format } from "date-fns";
import fr from "date-fns/locale/fr";

type Shift = { id: string; debut: string; fin: string };

export default function MonPlanning() {
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null); setLoading(true);
    const { data: emp, error: e1 } = await supabase
      .from("employes").select("id").eq("email", email).single();
    if (e1 || !emp) { setErr("Employé introuvable"); setLoading(false); return; }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("plannings")
      .select("id,debut,fin")
      .eq("employe_id", emp.id)
      .gte("fin", now)
      .order("debut", { ascending: true })
      .limit(50);
    setLoading(false);
    if (error || !data) { setErr(error?.message || "Erreur"); return; }
    setRows(data as Shift[]);
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold mb-3">Mon planning</h1>
      <div className="flex gap-2 mb-3">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Mon email…"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={load} className="bg-black text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? "..." : "Voir"}
        </button>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="border rounded overflow-x-auto">
        <table className="min-w-[500px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Début</th>
              <th className="text-left p-2 border-b">Fin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border-b">
                  {format(new Date(r.debut), "EEE dd/MM 'à' HH:mm", { locale: fr })}
                </td>
                <td className="p-2 border-b">
                  {format(new Date(r.fin), "EEE dd/MM 'à' HH:mm", { locale: fr })}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td className="p-3 text-gray-500" colSpan={2}>Aucun shift à venir.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
