import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { email, type } = await req.json() as { email?: string; type?: "ENTREE"|"SORTIE" };

    if (!email || !type) {
      return NextResponse.json({ ok:false, message:"email et type requis" }, { status:400 });
    }

    const { error } = await supabase.from("pointages").insert({
      email,
      type,
      horodatage: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ ok:false, message:error.message }, { status:500 });
    }

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, message:e?.message ?? "Erreur" }, { status:500 });
  }
}
