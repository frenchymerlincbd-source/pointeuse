"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient"; // app/planning/week -> ../../../lib
import {
  addDays,
  startOfWeek,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
} from "date-fns";
import fr from "date-fns/locale/fr";

type Employe = { id: string; nom: string; email: string };
type Shift = { id: string; employe_id: string; debut: string; fin: string; published?: boolean };

export default function PlanningWeekPage() {
  // ancre = lundi de la semaine affichée
  const [anchor, setAnchor] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const [emps, setEmps] = useState<Employe[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // panneau ajout/edition
  const [formEmp, setFormEmp] = useState<string>("");
  const [formDay, setFormDay] = useState<string>("");
  const [formStart, setFormStart] = useState<string>("09:00");
  const [formEnd, setFormEnd] = useState<string>("17:00");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    // employés
    const { data: eData } = await supabase
      .from("employes")
      .select("id,nom,email")
      .order("nom", { ascending: true });

    if (eData) setEmps(eData as Employe[]);

    // shifts de la semaine
    const { data: sData } = await supabase
      .from("plannings")
      .select("id, employe_id, debut, fin, published")
      .gte("debut", weekStart.toISOString())
      .lte("debut", weekEnd.toISOString())
      .order("debut", { ascending: true });

    if (sData) setShifts(sData as Shift[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  const filteredEmps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return emps;
    return emps.filter(
      (e) =>
        (e.nom || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q)
    );
  }, [emps, search]);

  function shiftListFor(empId: string, day: Date) {
    return shifts.filter(
      (s) => s.employe_id === empId && isSameDay(parseISO(s.debut), day)
    );
  }

  function nextWeek() {
    setAnchor(addDays(anchor, 7));
  }
  function prevWeek() {
    setAnchor(addDays(anchor, -7));
  }
  function thisWeek() {
    setAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }

  async function addOrUpdateShift(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!formEmp || !formDay) {
      setErr("Sélectionne un employé et un jour.");
      return;
    }

    const day = new Date(formDay);
    const [sh, sm] = formStart.split(":").map(Number);
    const [eh, em] = formEnd.split(":").map(Number);
    const debut = new Date(day);
    debut.setHours(sh, sm, 0, 0);
    const fin = new Date(day);
    fin.setHours(eh, em, 0, 0);
    if (fin <= debut) {
      setErr("L'heure de fin doit être après l'heure de début.");
      return;
    }

    setSaving(true);
    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("plannings")
        .update({
          employe_id: formEmp,
          debut: debut.toISOString(),
          fin: fin.toISOString(),
        })
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("plannings").insert({
        employe_id: formEmp,
        debut: debut.toISOString(),
        fin: fin.toISOString(),
      }));
    }
    setSaving(false);

    if (error) setErr(error.message);
    else {
      setMsg(editingId ? "Shift mis à jour ✅" : "Shift ajouté ✅");
      setEditingId(null);
      // reset léger
      // setFormEmp(""); setFormDay("");
      load();
    }
  }

  async function deleteShift(id: string) {
    if (!confirm("Supprimer ce shift ?")) return;
    setErr(null);
    setMsg(null);
    setSaving(true);
    const { error } = await supabase.from("plannings").delete().eq("id", id);
    setSaving(false);
    if (error) setErr(error.message);
    else {
      setMsg("Shift supprimé ✅");
      load();
    }
  }

  async function duplicatePreviousWeek() {
    setErr(null);
    setMsg(null);
    setSaving(true);
    try {
      const prevStart = addDays(weekStart, -7);
      const prevEnd = addDays(weekEnd, -7);
      const { data: prev, error } = await supabase
        .from("plannings")
        .select("employe_id, debut, fin")
        .gte("debut", prevStart.toISOString())
        .lte("debut", prevEnd.toISOString());

      if (error) throw error;
      if (!prev || prev.length === 0) {
        setErr("Aucun shift la semaine précédente.");
        setSaving(false);
        return;
      }

      const toInsert = prev.map((p) => {
        const d = addDays(new Date(p.debut), 7).toISOString();
        const f = addDays(new Date(p.fin), 7).toISOString();
        return { employe_id: p.employe_id, debut: d, fin: f };
      });

      const { error: insErr } = await supabase.from("plannings").insert(toInsert);
      if (insErr) throw insErr;

      setMsg("Semaine dupliquée ✅");
      await load();
    } catch (e: any) {
      setErr(e.message || "Erreur duplication");
    } finally {
      setSaving(false);
    }
  }

  async function publishWeek() {
    setErr(null);
    setMsg(null);
    setSaving(true);
    const { error } = await supabase
      .from("plannings")
      .update({ published: true })
      .gte("debut", weekStart.toISOString())
      .lte("debut", weekEnd.toISOString());
    setSaving(false);
    if (error) setErr(error.message);
    else {
      setMsg("Semaine publiée ✅");
      load();
    }
  }

  function startEditing(s: Shift, empId: string, day: Date) {
    setEditingId(s.id);
    setFormEmp(empId);
    setFormDay(format(day, "yyyy-MM-dd"));
    setFormStart(format(new Date(s.debut), "HH:mm", { locale: fr }));
    setFormEnd(format(new Date(s.fin), "HH:mm", { locale: fr }));
    setMsg("Édition du shift en cours…");
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl font-semibold">
          Semaine du {format(weekStart, "dd/MM", { locale: fr })} au{" "}
          {format(weekEnd, "dd/MM", { locale: fr })}
        </h1>
        <div className="flex gap-2">
          <button className="border rounded px-3 py-1" onClick={prevWeek}>
            ◀ Semaine -1
          </button>
          <button className="border rounded px-3 py-1" onClick={thisWeek}>
            Cette semaine
          </button>
          <button className="border rounded px-3 py-1" onClick={nextWeek}>
            Semaine +1 ▶
          </button>
          <button className="border rounded px-3 py-1" onClick={publishWeek}>
            Publier la semaine
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Grille semaine */}
        <div className="flex-1 overflow-x-auto border rounded">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b w-64">
                  Employés
                  <div className="mt-2">
                    <input
                      className="border rounded px-2 py-1 w-full"
                      placeholder="Rechercher…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </th>
                {days.map((d) => (
                  <th key={d.toISOString()} className="text-left p-2 border-b">
                    {format(d, "EEE dd/MM", { locale: fr })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmps.map((emp) => (
                <tr
                  key={emp.id}
                  className="odd:bg-white even:bg-gray-50 align-top"
                >
                  <td className="p-2 border-b">
                    <div className="font-medium">{emp.nom}</div>
                    <div className="text-gray-500 text-xs">{emp.email}</div>
                  </td>
                  {days.map((d) => (
                    <td
                      key={emp.id + d.toISOString()}
                      className="p-2 border-b align-top"
                    >
                      <div className="space-y-1">
                        {shiftListFor(emp.id, d).map((s) => (
                          <div
                            key={s.id}
                            className={`px-2 py-1 rounded border flex items-center justify-between gap-2 ${
                              s.published ? "opacity-70" : ""
                            }`}
                            title={s.published ? "Publié" : "Brouillon"}
                          >
                            <span>
                              {format(new Date(s.debut), "HH:mm", {
                                locale: fr,
                              })}
                              –
                              {format(new Date(s.fin), "HH:mm", {
                                locale: fr,
                              })}
                            </span>
                            <span className="flex items-center gap-2">
                              <button
                                className="text-xs underline disabled:opacity-40"
                                onClick={() => startEditing(s, emp.id, d)}
                                disabled={s.published}
                              >
                                éditer
                              </button>
                              <button
                                className="text-xs text-rose-700 underline disabled:opacity-40"
                                onClick={() => deleteShift(s.id)}
                                disabled={s.published}
                              >
                                supprimer
                              </button>
                            </span>
                          </div>
                        ))}
                        {/* bouton d'ajout rapide */}
                        <button
                          className="text-xs underline"
                          onClick={() => {
                            setEditingId(null);
                            setFormEmp(emp.id);
                            setFormDay(format(d, "yyyy-MM-dd"));
                            setFormStart("09:00");
                            setFormEnd("17:00");
                            setMsg(null);
                          }}
                        >
                          + ajouter
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {filteredEmps.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-3 text-gray-500">
                    Aucun employé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Panneau ajout/édition */}
        <form
          onSubmit={addOrUpdateShift}
          className="w-full md:w-80 border rounded p-3 space-y-2"
        >
          <div className="font-medium mb-1">
            {editingId ? "Modifier un shift" : "Ajouter un shift"}
          </div>
          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
              {err}
            </p>
          )}
          {msg && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
              {msg}
            </p>
          )}

          <label className="block text-xs text-gray-600">Employé</label>
          <select
            className="border rounded px-2 py-2 w-full"
            value={formEmp}
            onChange={(e) => setFormEmp(e.target.value)}
          >
            <option value="">— Choisir —</option>
            {emps.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nom} ({e.email})
              </option>
            ))}
          </select>

          <label className="block text-xs text-gray-600">Jour</label>
          <input
            type="date"
            className="border rounded px-2 py-2 w-full"
            value={formDay}
            onChange={(e) => setFormDay(e.target.value)}
            min={format(weekStart, "yyyy-MM-dd")}
            max={format(weekEnd, "yyyy-MM-dd")}
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600">Début</label>
              <input
                type="time"
                className="border rounded px-2 py-2 w-full"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Fin</label>
              <input
                type="time"
                className="border rounded px-2 py-2 w-full"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={saving}
              className="bg-black text-white px-3 py-2 rounded"
            >
              {saving ? "Enregistrement…" : editingId ? "Mettre à jour" : "Ajouter"}
            </button>
            {editingId && (
              <button
                type="button"
                className="text-xs underline"
                onClick={() => {
                  setEditingId(null);
                  setMsg(null);
                }}
              >
                Annuler l’édition
              </button>
            )}
          </div>

          <hr className="my-2" />

          <button
            type="button"
            onClick={duplicatePreviousWeek}
            disabled={saving}
            className="border rounded px-3 py-2 w-full hover:bg-gray-50"
          >
            Dupliquer la semaine précédente
          </button>
        </form>
      </div>
    </div>
  );
}

async function publishWeek() {
  setErr(null); setMsg(null); setSaving(true);
  const { error } = await supabase
    .from("plannings")
    .update({ published: true })
    .gte("debut", weekStart.toISOString())
    .lte("debut", weekEnd.toISOString());
  setSaving(false);
  if (error) setErr(error.message); else { setMsg("Semaine publiée ✅"); load(); }
}

