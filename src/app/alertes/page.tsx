'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Row = {
  id: string;
  created_at: string;
  minutes_late: number;
  threshold: number;
  seen: boolean;
  employes: { nom: string; email: string } | null;
};

export default function AlertesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('alerts')
      .select('id, created_at, minutes_late, threshold, seen, employes:employe_id(nom,email)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) setRows(data as any);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel('rt-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function markSeen(id: string) {
    const { error } = await supabase.from('alerts').update({ seen: true }).eq('id', id);
    if (!error) load();
  }

  return (
    <section>
      <h2>🚨 Alertes de retard</h2>
      {loading && <p>Chargement…</p>}
      {!loading && rows.length === 0 && <p>Rien à signaler ✅</p>}
      <ul style={{ marginTop: 12 }}>
        {rows.map(a => (
          <li key={a.id} style={{ marginBottom: 8 }}>
            <b>{a.employes?.nom ?? '—'}</b> ({a.employes?.email ?? '—'}) — retard de <b>{a.minutes_late} min</b>
            {' '} (seuil {a.threshold} min) — {new Date(a.created_at).toLocaleString('fr-FR')}
            {!a.seen && (
              <button onClick={() => markSeen(a.id)} style={{ marginLeft: 8 }}>
                Marquer vu
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
