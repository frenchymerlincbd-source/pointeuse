import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
// import relatif (lib est à la racine du projet)
import { supabase } from "../../..//lib/supabaseClient"; // <-- ajuste si besoin

// Si tu n'as pas encore lib/supabaseClient.ts à la racine, crée-le :
/*
   // lib/supabaseClient.ts
   import { createClient } from "@supabase/supabase-js";
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
*/

export async function POST(req: Request) {
  try {
    const { email, pin, action } = await req.json() as {
      email: string; pin: string; action?: "ENTREE" | "SORTIE";
    };
    const type = action ?? "ENTREE";

    // 1) chercher l’employé
    const { data: employe, error } = await supabase
      .from("employes")
      .select("id, nom, pin")
      .eq("email", email)
      .single();

    if (error || !employe) {
      return NextResponse.json({ success:false, message:"Employé introuvable" }, { status:404 });
    }

    // 2) vérifier le PIN
    const ok = bcrypt.compareSync(pin, employe.pin);
    if (!ok) {
      return NextResponse.json({ success:false, message:"PIN incorrect" }, { status:401 });
    }

    // 3) insérer le pointage
    const { error: insErr } = await supabase
      .from("pointages")
      .insert({ employe_id: employe.id, type });

    if (insErr) {
      return NextResponse.json({ success:false, message:insErr.message }, { status:500 });
    }

    return NextResponse.json({ success:true, message:`Pointage ${type} OK — ${employe.nom}` });
  } catch (e:any) {
    return NextResponse.json({ success:false, message:e.message }, { status:500 });
  }
}
