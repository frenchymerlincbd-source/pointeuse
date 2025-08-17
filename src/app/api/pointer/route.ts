import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

type Body = { email?: string; pin?: string; type?: "ENTREE" | "SORTIE" };

export async function POST(req: Request) {
  try {
    const { email, pin, type } = (await req.json()) as Body;
    if (!email || !pin || !type) {
      return NextResponse.json({ ok: false, message: "email, pin, type requis" }, { status: 400 });
    }

    // 1) employé
    const { data: emp, error: empErr } = await supabase
      .from("employes")
      .select("id, email, nom, pin_hash, actif")
      .eq("email", email)
      .single();
    if (empErr || !emp) return NextResponse.json({ ok: false, message: "Employé introuvable" }, { status: 404 });
    if (!emp.actif)     return NextResponse.json({ ok: false, message: "Employé inactif" }, { status: 403 });

    // 2) PIN
    const ok = await bcrypt.compare(pin, emp.pin_hash);
    if (!ok) return NextResponse.json({ ok: false, message: "PIN incorrect" }, { status: 401 });

    // 3) insert pointage
    const nowISO = new Date().toISOString();
    const { data: inserted, error: insErr } = await supabase
      .from("pointages")
      .insert({ employe_id: emp.id, type, horodatage: nowISO })
      .select("id, horodatage")
      .single();
    if (insErr) return NextResponse.json({ ok: false, message: insErr.message }, { status: 500 });

    // 4) RETARD : uniquement pour ENTREE
    if (type === "ENTREE") {
      const threshold = 5; // minutes

      // Cherche le shift du jour (fenêtre 00:00–23:59 UTC sur la date du pointage)
      const pointDate = new Date(inserted.horodatage);
      const dayStart = new Date(pointDate); dayStart.setUTCHours(0,0,0,0);
      const dayEnd   = new Date(dayStart); dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const { data: shifts, error: shiftErr } = await supabase
        .from("shifts")
        .select("id, start_at, end_at")
        .eq("employe_id", emp.id)
        .gte("start_at", dayStart.toISOString())
        .lt("start_at", dayEnd.toISOString())
        .order("start_at", { ascending: true });

      if (!shiftErr && shifts && shifts.length) {
        // on prend le premier shift dont l'heure de début est la plus proche après 00:00
        const shift = shifts[0];
        const start = new Date(shift.start_at);
        const diffMin = Math.round((pointDate.getTime() - start.getTime()) / 60000);

        if (diffMin > threshold) {
          await supabase.from("alerts").insert({
            employe_id: emp.id,
            pointage_id: inserted.id,
            shift_id: shift.id,
            minutes_late: diffMin,
            threshold
          });
        }
      }
    }

    return NextResponse.json({ ok: true, message: "Pointage enregistré" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? "Erreur" }, { status: 500 });
  }
}
