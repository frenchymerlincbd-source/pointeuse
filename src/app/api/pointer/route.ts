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

    // 1) Cherche l'employé par email
    const { data: emp, error: empErr } = await supabase
      .from("employes")
      .select("id, nom, email, pin_hash, actif")
      .eq("email", email)
      .single();

    if (empErr || !emp) {
      return NextResponse.json({ ok: false, message: "Employé introuvable" }, { status: 404 });
    }
    if (!emp.actif) {
      return NextResponse.json({ ok: false, message: "Employé inactif" }, { status: 403 });
    }

    // 2) Vérifie le PIN
    const ok = await bcrypt.compare(pin, emp.pin_hash);
    if (!ok) {
      return NextResponse.json({ ok: false, message: "PIN incorrect" }, { status: 401 });
    }

    // 3) Insère le pointage (attention: employe_id)
    const { error: insErr } = await supabase
      .from("pointages")
      .insert({ employe_id: emp.id, type });

    if (insErr) {
      return NextResponse.json({ ok: false, message: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Pointage enregistré" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
