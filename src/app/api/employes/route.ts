import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

// GET /api/employes -> liste
export async function GET() {
  const { data, error } = await supabase
    .from("employes")
    .select("id, nom, email, actif")
    .order("nom", { ascending: true });
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 });
  return NextResponse.json({ ok:true, data });
}

// POST /api/employes -> { nom, email, pin }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nom, email, pin } = body || {};
    if (!nom || !email || !pin) {
      return NextResponse.json({ ok:false, message:"nom, email, pin requis" }, { status:400 });
    }

    // existe déjà ?
    const { data: exists } = await supabase.from("employes").select("id").eq("email", email).maybeSingle();
    if (exists) {
      return NextResponse.json({ ok:false, message:"Email déjà utilisé" }, { status:409 });
    }

    const pin_hash = await bcrypt.hash(pin, 10);
    const { error } = await supabase
      .from("employes")
      .insert({ nom, email, pin_hash, actif: true });
    if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 });

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, message:e?.message ?? "Erreur" }, { status:500 });
  }
}
