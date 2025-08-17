export const dynamic = 'force-dynamic';

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../..//lib/supabaseClient";
import { format, isToday, isThisWeek } from "date-fns";
import fr from "date-fns/locale/fr";

type Row = {
  id: string;
  type: "ENTREE" | "SORTIE";
  horodatage: string;
  employes: { nom: string; email: string } | null;
};

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // filtres
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "WEEK">("ALL");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pointages")
      .select("id,type,horodatage,employes(nom,email)")
      .order("horodatage", { ascending: false })
      .limit(200);

    if (!error && data) setRows(data as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("rt-pointages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pointages" }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // applique les filtres
  const filteredRows = rows.filter((r) => {
    const date = new Date(r.horodatage);

    // filtre par date
    if (dateFilter === "TODAY" && !isToday(date)) return false;
    if (dateFilter === "WEEK" && !isThisWeek(date, { weekStartsOn: 1 })) return false;

    // filtre par recherche employé
    if (search.trim() !== "" && !r.employes?.nom.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h1 className="text-xl font-semibold">Historique des pointages</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as "ALL" | "TODAY" | "WEEK")}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="ALL">Tout</option>
            <option value="TODAY">Aujourd'hui</option>
            <option value="WEEK">Cette semaine</option>
          </select>
          <button
            onClick={load}
            className="px-3 py-1.5 border rounded hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? "..." : "Rafraîchir"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 border-b">Employé</th>
              <th className="text-left p-2 border-b">Type</th>
              <th className="text-left p-2 border-b">Horodatage</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border-b">
                  {r.employes?.nom ?? "—"}{" "}
                  <span className="text-gray-500">({r.employes?.email ?? "—"})</span>
                </td>
                <td className="p-2 border-b">{r.type === "ENTREE" ? "Entrée" : "Sortie"}</td>
                <td className="p-2 border-b">
                  {format(new Date(r.horodatage), "EEE dd/MM à HH:mm:ss", { locale: fr })}
                </td>
              </tr>
            ))}
            {!loading && filteredRows.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={3}>
                  Aucun pointage trouvé avec ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        La liste se met à jour automatiquement quand un nouveau pointage arrive.
      </p>
    </div>
  );
}
