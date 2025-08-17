import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// util: début/fin de journée en UTC à partir de l'heure locale Europe/Paris
function dayBoundsParis(date = new Date()) {
  const paris = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const y = paris.find(p=>p.type==="year")!.value;
  const m = paris.find(p=>p.type==="month")!.value;
  const d = paris.find(p=>p.type==="day")!.value;

  // 00:00:00 Europe/Paris -> ISO UTC
  const startLocal = new Date(`${y}-${m}-${d}T00:00:00+01:00`); // +01:00 (ignorer DST finement pour simplicité)
  const endLocal   = new Date(startLocal.getTime() + 24*3600*1000);

  return { from: startLocal.toISOString(), to: endLocal.toISOString() };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const thresholdMin = Number(searchParams.get("threshold") ?? "5"); // seuil retard
    const boutiqueFilter = searchParams.get("boutique") || undefined;

    const { from, to } = dayBoundsParis();

    // 1) Shifts du jour (+ employé) — filtre par boutique si fourni
    let query = supabase
      .from("shifts")
      .select("id, boutique, start_at, end_at, employes:employe_id (id, nom, email)")
      .gte("start_at", from).lt("start_at", to)
      .order("start_at", { ascending: true });
    if (boutiqueFilter) query = query.eq("boutique", boutiqueFilter);
    const { data: shifts, error: shiftsErr } = await query;
    if (shiftsErr) throw new Error(shiftsErr.message);

    const empIds = Array.from(new Set((shifts ?? []).map(s => s.employes?.id).filter(Boolean))) as string[];

    // 2) Derniers pointages du jour par employé (on prend le plus récent)
    //    on récupère tous les pointages du jour pour ces employés (plus simple côté client)
    const { data: pts, error: ptsErr } = await supabase
      .from("pointages")
      .select("id, employe_id, type, horodatage")
      .in("employe_id", empIds.length ? empIds : ["00000000-0000-0000-0000-000000000000"]) // fallback si vide
      .gte("horodatage", from).lt("horodatage", to)
      .order("horodatage", { ascending: true });
    if (ptsErr) throw new Error(ptsErr.message);

    // index par employé -> dernier pointage
    const lastByEmp = new Map<string, { id:string; type:"ENTREE"|"SORTIE"; horodatage:string }>();
    for (const p of pts ?? []) {
      lastByEmp.set(p.employe_id, { id: p.id, type: p.type as any, horodatage: p.horodatage });
    }

    // 3) Calcul des statuts par shift
    const now = new Date();
    const rows = (shifts ?? []).map(s => {
      const empId = s.employes?.id as string;
      const last = lastByEmp.get(empId);
      const start = new Date(s.start_at);
      const end   = new Date(s.end_at);

      // par défaut
      let statut: "A_LHEURE" | "EN_RETARD" | "PRESENT" | "ABSENT" | "TERMINE" = "ABSENT";
      let minutesLate = 0;

      // si shift terminé
      if (now > end) {
        // présent s'il y a eu une ENTREE avant fin, sinon absent
        statut = last ? "TERMINE" : "ABSENT";
      } else {
        // shift en cours ou pas encore commencé
        if (last?.type === "ENTREE") {
          // présent (il est entré)
          statut = "PRESENT";
          const entryTime = new Date(last.horodatage);
          const diff = Math.round((entryTime.getTime() - start.getTime()) / 60000);
          if (diff > thresholdMin) {
            statut = "EN_RETARD";
            minutesLate = diff;
          } else if (diff >= 0) {
            statut = "A_LHEURE";
          }
        } else {
          // pas de ENTREE encore
          statut = (now >= start) ? "ABSENT" : "A_LHEURE";
        }
      }

      return {
        shift_id: s.id,
        boutique: s.boutique,
        start_at: s.start_at,
        end_at: s.end_at,
        employe: { id: empId, nom: s.employes?.nom, email: s.employes?.email },
        dernier_pointage: last ?? null,
        statut,
        minutesLate,
      };
    });

    // 4) Liste des boutiques pour filtre
    const boutiques = Array.from(new Set((shifts ?? []).map(s => s.boutique).filter(Boolean)));

    return NextResponse.json({ ok: true, data: rows, boutiques, from, to, thresholdMin });
  } catch (e:any) {
    return NextResponse.json({ ok: false, message: e.message ?? "Erreur" }, { status: 500 });
  }
}
