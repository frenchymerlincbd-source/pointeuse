"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "../../../lib/supabaseClient"; // app/planning/new -> ../../../lib

const ShiftSchema = z.object({
  employe_id: z.string().uuid({ message: "Choisis un employé" }),
  debut: z.string().min(1, "Début requis"),
  fin: z.string().min(1, "Fin requise"),
}).refine(
  (v) => new Date(v.debut).getTime() < new Date(v.fin).getTime(),
  { message: "L'heure de fin doit être après l'heure de début", path: ["fin"] }
);

type Employe = { id: string; nom: string; email: string };

export default function NewPlanningPage() {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // champs
  const [employeId, setEmployeId] = useState("");
  const [debut, setDebut] = useState<string>(() => defaultStart());
  const [fin, setFin] = useState<string>(() => defaultEnd());
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("employes")
        .select("id, nom, email")
        .order("nom", { ascending: true });
      if (!error && data) setEmployes(data as Employe[]);
      setLoading(false);
    })();
  }, []);

  const filteredEmployes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employes;
    return employes.filter(
      (e) => e.nom?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q)
    );
  }, [employes, search]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setErrorMsg(null);
    const payload = { employe_id: employeId, debut: toISO(debut), fin: toISO(fin) };

    const parsed = ShiftSchema.safeParse(payload);
    if (!parsed.success) {
      const firstErr = parsed.error.errors[0]?.message || "Champs invalides";
      setErrorMsg(firstErr);
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("plannings").insert(parsed.data);
    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setMessage("Planning créé ✅");
      // option : reset fin/début juste après
      // setDebut(defaultStart()); setFin(defaultEnd()); setEmployeId("");
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Créer un planning</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Employé */}
        <div>
          <label className="block text-sm font-medium mb-1">Employé</label>
          <div className="flex gap-2 mb-2">
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border rounded px-3 py-2 w-full"
            value={employeId}
            onChange={(e) => setEmployeId(e.target.value)}
            disabled={loading}
          >
            <option value="">— Sélectionner —</option>
            {filteredEmployes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom} ({e.email})
              </option>
            ))}
          </select>
        </div>

        {/* Dates/Heures */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Début</label>
            <input
              type="datetime-local"
              className="border rounded px-3 py-2 w-full"
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fin</label>
            <input
              type="datetime-local"
              className="border rounded px-3 py-2 w-full"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
            />
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMsg}
          </p>
        )}
        {message && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {message}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {saving ? "Enregistrement…" : "Créer le planning"}
          </button>

          <a className="underline" href="/pointages">Voir les pointages</a>
          <a className="underline" href="/alertes">Voir les alertes</a>
        </div>
      </form>

      <InfoHelp />
    </div>
  );
}

/** Helpers */
function defaultStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0); // pile à l'heure
  return toLocalInput(d);
}
function defaultEnd() {
  const d = new Date();
  d.setHours(d.getHours() + 4);
  d.setMinutes(0, 0, 0);
  return toLocalInput(d);
}
function toLocalInput(d: Date) {
  // format yyyy-MM-ddThh:mm pour input datetime-local
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${mi}`;
}
function toISO(dtLocal: string) {
  // dtLocal est en heure locale; on le convertit en ISO string (UTC) pour timestamptz
  const d = new Date(dtLocal);
  return d.toISOString();
}

function InfoHelp() {
  return (
    <div className="mt-6 text-xs text-gray-600 space-y-1">
      <p>• Les horaires saisis sont en heure locale ; la base enregistre en UTC (timestamptz).</p>
      <p>• L’alerte de retard se déclenche lors d’une <strong>Entrée</strong> après l’heure de début + tolérance.</p>
      <p>• Modifie la tolérance avec :{" "}
        <code>
          update params set value = '{'{'}"minutes": 5{'}'}'::jsonb where key='lateness_tolerance';
        </code>
      </p>
    </div>
  );
}
