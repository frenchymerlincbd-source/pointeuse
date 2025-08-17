"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient"; // app/planning -> ../../lib
import { format } from "date-fns";
import fr from "date-fns/locale/fr";

type Row = {
  id: string;
  debut: string;
  fin: string;
  employes: { nom: string; email: string } | null;
};

export default function PlanningListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    // fenêtre : aujourd'hui 00:00 -> 23:59
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    const { data, error } = await supabase
      .from("plannings")
      .select("id, debut, fin, employes(nom,email)")
      .gte("debut", start.toISOString())
      .lte("debut", end.toISOString())
      .order("debut", { ascending: true });
    if (!error && data) setRows(data as Row[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Plannings du jour</h1>
        <a href="/planning/new" className="underline">+ Nouveau planning</a>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[640px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Employé</th>
              <th className="text-left p-2 border-b">Début</th>
              <th className="text-left p-2 border-b">Fin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border-b">
                  {r.employes?.nom ?? "—"} <span className="text-gray-500">({r.employes?.email ?? "—"})</span>
                </td>
                <td className="p-2 border-b">
                  {format(new Date(r.debut), "EEE dd/MM 'à' HH:mm", { locale: fr })}
                </td>
                <td className="p-2 border-b">
                  {format(new Date(r.fin), "EEE dd/MM 'à' HH:mm", { locale: fr })}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={3} className="p-3 text-gray-500">Aucun planning aujourd’hui.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
