"use client";
import { useEffect, useState } from "react";
import { supabase } from "../..//lib/supabaseClient";
import { formatDistanceToNow, format } from "date-fns";
import fr from "date-fns/locale/fr";

type Alerte = {
  id: string;
  employe_id: string;
  type: "LATE";
  horodatage: string;
  pointage_ts: string;
  retard_minutes: number;
  note: string | null;
  employes?: { nom: string; email: string } | null; // si tu ajoutes la relation dans la requête
};

export default function Page() {
  const [rows, setRows] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("alertes")
      .select("id, employe_id, type, horodatage, pointage_ts, retard_minutes, note, employes(nom,email)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) setRows(data as Alerte[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("rt-alertes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alertes" }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Alertes de retard</h1>
        <button
          onClick={load}
          className="px-3 py-1.5 border rounded hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "..." : "Rafraîchir"}
        </button>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Employé</th>
              <th className="text-left p-2 border-b">Retard</th>
              <th className="text-left p-2 border-b">Pointage</th>
              <th className="text-left p-2 border-b">Alerte</th>
              <th className="text-left p-2 border-b">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const pt = new Date(a.pointage_ts);
              const al = new Date(a.horodatage);
              return (
                <tr key={a.id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 border-b">
                    {a.employes?.nom ?? "—"}{" "}
                    <span className="text-gray-500">({a.employes?.email ?? "—"})</span>
                  </td>
                  <td className="p-2 border-b">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                      {a.retard_minutes} min
                    </span>
                  </td>
                  <td className="p-2 border-b">
                    {format(pt, "EEE dd/MM 'à' HH:mm:ss", { locale: fr })}{" "}
                    <span className="text-gray-500">
                      ({formatDistanceToNow(pt, { addSuffix: true, locale: fr })})
                    </span>
                  </td>
                  <td className="p-2 border-b">
                    {format(al, "EEE dd/MM 'à' HH:mm:ss", { locale: fr })}
                  </td>
                  <td className="p-2 border-b">{a.note ?? "—"}</td>
                </tr>
              );
            })}
            {!loading && rows.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>
                  Aucune alerte pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Génération automatique : ENTREE après l’heure de début du planning + tolérance.
      </p>
    </div>
  );
}
