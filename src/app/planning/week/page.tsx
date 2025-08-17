'use client';

import { useEffect, useMemo, useState } from 'react';
import NewShiftForm from './NewShiftForm'; // ← le composant du formulaire (point 2)

// Types simples
type Emp = { id: string; nom: string; email: string; actif: boolean };
type Shift = {
  id: string;
  boutique?: string | null;
  start_at: string;
  end_at: string;
  employes: { id: string; nom: string; email: string };
};

// Utils semaine ISO (lundi = début)
function startOfISOWeek(d: Date) {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = copy.getUTCDay() || 7; // 1..7 (dimanche=7)
  copy.setUTCDate(copy.getUTCDate() - (day - 1));
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}
const fmtDay = (d: Date) => d.toISOString().slice(0, 10);

export default function WeekPlanningPage() {
  // Semaine affichée
  const [weekStart, setWeekStart] = useState<string>(fmtDay(startOfISOWeek(new Date())));
  // Données
  const [emps, setEmps] = useState<Emp[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  // UI
  const [boutiqueFilter, setBoutiqueFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Jours de la semaine courante
  const days = useMemo(() => {
    const base = new Date(weekStart + 'T00:00:00.000Z');
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() + i);
      return d;
    });
  }, [weekStart]);

  // Charge employés (pour affichage par lignes + pour le formulaire NewShiftForm)
  async function loadEmps() {
    const res = await fetch('/api/employes', { cache: 'no-store' });
    const json = await res.json();
    if (json.ok) setEmps(json.data as Emp[]);
  }

  // Charge shifts de la semaine (avec filtre boutique si renseigné)
  async function loadShifts() {
    setLoading(true);
    const from = days[0].toISOString();
    const to = new Date(days[6]); to.setUTCDate(to.getUTCDate() + 1);
    const params = new URLSearchParams({ from, to: to.toISOString() });
    if (boutiqueFilter) params.set('boutique', boutiqueFilter);
    const res = await fetch(`/api/shifts?${params.toString()}`, { cache: 'no-store' });
    const json = await res.json();
    if (json.ok) setShifts(json.data as Shift[]);
    setLoading(false);
  }

  useEffect(() => { loadEmps(); }, []);
  useEffect(() => { loadShifts(); /* à chaque changement de semaine */  // eslint-disable-next-line
  }, [weekStart, boutiqueFilter]);

  // Navigation semaine
  function goPrevWeek() {
    const d = new Date(weekStart + 'T00:00:00.000Z');
    d.setUTCDate(d.getUTCDate() - 7);
    setWeekStart(fmtDay(d));
  }
  function goNextWeek() {
    const d = new Date(weekStart + 'T00:00:00.000Z');
    d.setUTCDate(d.getUTCDate() + 7);
    setWeekStart(fmtDay(d));
  }

  // Rendu
  return (
    <section>
      <h2>Planning de la semaine</h2>

      {/* Barre d’outils */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={goPrevWeek}>&larr; Semaine -1</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>Début de semaine</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
        </div>
        <button onClick={goNextWeek}>Semaine +1 &rarr;</button>

        <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>Boutique</label>
          <input
            placeholder="(toutes)"
            value={boutiqueFilter}
            onChange={(e) => setBoutiqueFilter(e.target.value)}
            style={{ minWidth: 160 }}
          />
        </div>

        <button onClick={loadShifts}>Rafraîchir</button>
      </div>

      {/* Formulaire d’ajout */}
      <div style={{ marginTop: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
        <h3 style={{ marginBottom: 8 }}>Nouveau shift</h3>
        {/* Quand un shift est créé, on recharge la semaine via onCreated */}
        <NewShiftForm onCreated={loadShifts} />
      </div>

      {/* Tableau semaine */}
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 900, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Employé</th>
              {days.map((d) => (
                <th key={+d} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
                  {d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emps.map((emp) => (
              <tr key={emp.id}>
                <td style={{ borderBottom: '1px solid #f2f2f2', padding: 8 }}>
                  <b>{emp.nom}</b> <span style={{ color: '#777' }}>({emp.email})</span>
                </td>
                {days.map((d) => {
                  const dayISO = fmtDay(d);
                  const dayShifts = shifts.filter(
                    (s) => s.employes?.id === emp.id && s.start_at.slice(0, 10) === dayISO
                  );
                  return (
                    <td key={emp.id + dayISO} style={{ borderBottom: '1px solid #f9f9f9', padding: 8, verticalAlign: 'top' }}>
                      {dayShifts.length === 0 && <span style={{ color: '#bbb' }}>—</span>}
                      {dayShifts.map((s) => (
                        <div
                          key={s.id}
                          style={{ fontSize: 12, marginBottom: 6, background: '#f7f7f7', padding: '6px 8px', borderRadius: 6 }}
                        >
                          {new Date(s.start_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(s.end_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {s.boutique ? ` · ${s.boutique}` : ''}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!loading && emps.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 12, color: '#666' }}>
                  Aucun employé. Ajoute-en depuis la page <b>Employés</b>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <p style={{ marginTop: 8 }}>Chargement…</p>}
      </div>
    </section>
  );
}
