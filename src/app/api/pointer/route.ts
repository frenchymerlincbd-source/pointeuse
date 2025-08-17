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

    // 1) récupérer l'employé
    const { data: emp, error: empErr } = await supabase
      .from("employes")
      .select("id, email, nom, pin_hash, actif")
      .eq("email", email)
      .single();

    if (empErr || !emp) return NextResponse.json({ ok: false, message: "Employé introuvable" }, { status: 404 });
    if (!emp.actif)     return NextResponse.json({ ok: false, message: "Employé inactif" }, { status: 403 });

    // 2) comparer le PIN saisi au hash
    const ok = await bcrypt.compare(pin, emp.pin_hash);
    if (!ok) return NextResponse.json({ ok: false, message: "PIN incorrect" }, { status: 401 });

    // 3) insérer le pointage (avec employe_id)
    const { error: insErr } = await supabase
      .from("pointages")
      .insert({ employe_id: emp.id, type });

    if (insErr) return NextResponse.json({ ok: false, message: insErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, message: "Pointage enregistré" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? "Erreur" }, { status: 500 });
  }
}
