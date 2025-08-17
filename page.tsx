"use client";
import { useState } from "react";

export default function PointeusePage() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [action, setAction] = useState<"ENTREE"|"SORTIE">("ENTREE");
  const [msg, setMsg] = useState("");

  const pointer = async () => {
    setMsg("");
    const res = await fetch("/api/pointer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin, action })
    });
    const data = await res.json();
    setMsg(data.message || (res.ok ? "OK" : "Erreur"));
    if (res.ok) setPin("");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Borne de pointage (test)</h1>
      <div className="max-w-sm space-y-2">
        <input className="border p-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 w-full" placeholder="PIN" value={pin} onChange={e=>setPin(e.target.value)} inputMode="numeric" />
        <select className="border p-2 w-full" value={action} onChange={e=>setAction(e.target.value as any)}>
          <option value="ENTREE">Entrée</option>
          <option value="SORTIE">Sortie</option>
        </select>
        <button onClick={pointer} className="bg-black text-white px-4 py-2 rounded">Pointer</button>
        <p className="text-sm">{msg}</p>
      </div>
    </div>
  );
}
