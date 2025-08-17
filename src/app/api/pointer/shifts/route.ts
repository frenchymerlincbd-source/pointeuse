import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET /api/shifts?from=2025-08-18&to=2025-08-24
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")!;
  const to   = searchParams.get("to")!;

  const { data, error } = await supabase
    .from("shifts")
    .select("id, boutique, start_at, end_at, employes:employe_id(id,nom,email)")
    .gte("start_at", from).lt("start_at", to)
    .order("start_at", { ascending: true });

  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 });
  return NextResponse.json({ ok:true, data });
}

// POST /api/shifts  body: { items: [{email,boutique,start_at,end_at}] }
export async function POST(req: Request) {
  const { items } = await req.json() as { items: Array<{ email:string; boutique?:string; start_at:string; end_at:string }> };

  // 1) map emails -> employe_id
  const emails = Array.from(new Set(items.map(i=>i.email)));
  const { data:emps, error:empErr } = await supabase.from("employes")
    .select("id,email").in("email", emails);
  if (empErr) return NextResponse.json({ ok:false, message:empErr.message }, { status:500 });

  const byEmail = new Map(emps!.map(e=>[e.email, e.id]));
  const rows = items.map(i => ({
    employe_id: byEmail.get(i.email),
    boutique: i.boutique ?? null,
    start_at: i.start_at,
    end_at:   i.end_at,
  })).filter(r => !!r.employe_id);

  if (!rows.length) return NextResponse.json({ ok:false, message:"Aucun employé correspondant" }, { status:400 });

  const { error:insErr } = await supabase.from("shifts").insert(rows);
  if (insErr) return NextResponse.json({ ok:false, message:insErr.message }, { status:500 });

  return NextResponse.json({ ok:true });
}
