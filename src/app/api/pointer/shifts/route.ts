import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET /api/shifts?from=ISO&to=ISO&boutique=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")!;
  const to = searchParams.get("to")!;
  const boutique = searchParams.get("boutique");

  let q = supabase
    .from("shifts")
    .select("id, employe_id, boutique, start_at, end_at, employes:employe_id(id,nom,email)")
    .gte("start_at", from).lte("end_at", to)
    .order("start_at");

  if (boutique) q = q.eq("boutique", boutique);

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 });
  return NextResponse.json({ ok:true, data });
}

// POST /api/shifts { employe_id, start_at, end_at, boutique? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employe_id, start_at, end_at, boutique } = body || {};
    if (!employe_id || !start_at || !end_at) {
      return NextResponse.json({ ok:false, message:"employe_id, start_at, end_at requis" }, { status:400 });
    }
    const { error } = await supabase.from("shifts").insert({ employe_id, start_at, end_at, boutique });
    if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 });
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, message:e?.message ?? "Erreur" }, { status:500 });
  }
}
