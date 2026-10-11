"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import { getConnexions, type EntreeConnexion } from "@/lib/firebase/firestore"

export default function ConnexionsPage() {
  const { currentUser } = useApp()
  const [connexions, setConnexions] = useState<EntreeConnexion[]>([])
  const [chargement, setChargement] = useState(true)
  const [filtre, setFiltre] = useState("")

  const isAdmin = currentUser?.identifiant === "ArnaudP"

  useEffect(() => {
    if (!isAdmin) return
    getConnexions()
      .then(setConnexions)
      .catch(console.error)
      .finally(() => setChargement(false))
  }, [isAdmin])

  // Restriction : accessible uniquement par Arnaud Poli (après tous les hooks)
  if (currentUser && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Accès restreint</h2>
        <p className="text-gray-500 text-sm">Cette page est réservée à l'administrateur.</p>
      </div>
    )
  }

  const filtrees = filtre.trim().length === 0
    ? connexions
    : connexions.filter(c => c.nom.toLowerCase().includes(filtre.toLowerCase()))

  // Statistiques par utilisateur pour le graphique
  const statsParUser = connexions.reduce<Record<string, number>>((acc, c) => {
    acc[c.nom] = (acc[c.nom] ?? 0) + 1
    return acc
  }, {})
  const statsTriees = Object.entries(statsParUser).sort(([, a], [, b]) => b - a)
  const maxConnexions = statsTriees[0]?.[1] ?? 1

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#B4432E]">Journal des connexions</h1>
        <p className="text-sm text-gray-500 mt-1">
          {chargement ? "Chargement…" : `${connexions.length} connexion${connexions.length !== 1 ? "s" : ""} enregistrée${connexions.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Graphique en barres */}
      {!chargement && statsTriees.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
            Connexions par utilisateur
          </h2>
          <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{ minHeight: "160px" }}>
            {statsTriees.map(([nom, count]) => {
              const hauteurPct = Math.round((count / maxConnexions) * 100)
              const prenom = nom.split(" ")[0]
              return (
                <div
                  key={nom}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                  style={{ minWidth: "52px" }}
                >
                  {/* Chiffre au-dessus */}
                  <span className="text-xs font-bold text-[#B4432E]">{count}</span>
                  {/* Barre */}
                  <div
                    className="w-9 rounded-t-md bg-[#B4432E] transition-all"
                    style={{ height: `${Math.max(hauteurPct, 4)}px`, maxHeight: "120px", minHeight: "4px" }}
                    title={`${nom} : ${count} connexion${count > 1 ? "s" : ""}`}
                  />
                  {/* Nom */}
                  <span
                    className="text-[10px] text-gray-500 text-center leading-tight mt-0.5"
                    style={{ maxWidth: "52px", wordBreak: "break-word" }}
                  >
                    {prenom}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtre par nom */}
      <div className="relative">
        <input
          type="text"
          value={filtre}
          onChange={e => setFiltre(e.target.value)}
          placeholder="Filtrer par nom…"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
        />
        {filtre && (
          <button
            onClick={() => setFiltre("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {chargement ? (
          <div className="py-16 text-center text-gray-400 text-sm">Chargement…</div>
        ) : filtrees.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">🔌</p>
            <p className="text-gray-400 text-sm">Aucune connexion trouvée.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Heure</th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map(c => {
                const dt = new Date(c.dateHeure)
                const date = dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
                const heure = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1A1A1A]">{c.nom}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{date}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{heure}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
