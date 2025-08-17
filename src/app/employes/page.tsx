import { supabase } from "@/lib/supabaseClient"

export default async function EmployesPage() {
  const { data: employes, error } = await supabase
    .from("employes")
    .select("id, nom, email, boutique_id")

  if (error) {
    return <div>Erreur : {error.message}</div>
  }

  return (
    <div>
      <h1>Liste des employés</h1>
      <ul>
        {employes?.map((emp) => (
          <li key={emp.id}>
            {emp.nom} — {emp.email} — {emp.boutique_id}
          </li>
        ))}
      </ul>
    </div>
  )
}
