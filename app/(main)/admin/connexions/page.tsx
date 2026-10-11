"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import { getConnexions, type EntreeConnexion } from "@/lib/firebase/firestore"

type FiltreType = "tous" | "connexion" | "visite"

export default function ConnexionsPage() {
  const { currentUser } = useApp()
  const [connexions, setConnexions] = useState<EntreeConnexion[]>([])
  const [chargement, setChargement] = useState(true)
  const [filtreNom, setFiltreNom] = useState("")
  const [filtreType, setFiltreType] = useState<FiltreType>("tous")

  const isAdmin = currentUser?.identifiant === "ArnaudP"

  useEffect(() => {
    if (!isAdmin) return
    getConnexions()
      .then(setConnexions)
      .catch(console.error)
      .finally(() => setChargement(false))
  }, [isAdmin])

  if (currentUser && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Accès restreint</h2>
        <p className="text-gray-500 text-sm">Cette page est réservée à l'administrateur.</p>
      </div>
    )
  }

  const nbConnexions = connexions.filter(c => (c.type ?? "connexion") === "connexion").length
  const nbVisites = connexions.filter(c => c.type === "visite").length

  const filtrees = connexions.filter(c => {
    const nomOk = filtreNom.trim().length === 0 || c.nom.toLowerCase().includes(filtreNom.toLowerCase())
    const typeReel = c.type ?? "connexion"
    const typeOk = filtreType === "tous" || typeReel === filtreType
    return nomOk && typeOk
  })

  // Graphique : jours de présence par utilisateur (toutes entrées confondues)
  const joursPresentParUser = connexions.reduce<Record<string, Set<string>>>((acc, c) => {
    if (!acc[c.nom]) acc[c.nom] = new Set()
    acc[c.nom].add(c.dateHeure.slice(0, 10))
    return acc
  }, {})
  const statsTriees = Object.entries(joursPresentParUser)
    .map(([nom, jours]) => [nom, jours.size] as [string, number])
    .sort(([, a], [, b]) => b - a)
  const maxJours = statsTriees[0]?.[1] ?? 1

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#B4432E]">Journal d'activité</h1>
        {!chargement && (
          <p className="text-sm text-gray-500 mt-1">
            {nbConnexions} connexion{nbConnexions !== 1 ? "s" : ""} · {nbVisites} visite{nbVisites !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Graphique jours de présence */}
      {!chargement && statsTriees.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
            Jours de présence par utilisateur
          </h2>
          <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{ minHeight: "160px" }}>
            {statsTriees.map(([nom, count]) => {
              const hauteurPct = Math.round((count / maxJours) * 100)
              const prenom = nom.split(" ")[0]
              return (
                <div
                  key={nom}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                  style={{ minWidth: "52px" }}
                >
                  <span className="text-xs font-bold text-[#B4432E]">{count}</span>
                  <div
                    className="w-9 rounded-t-md bg-[#B4432E] transition-all"
                    style={{ height: `${Math.max(hauteurPct, 4)}px`, maxHeight: "120px", minHeight: "4px" }}
                    title={`${nom} : ${count} jour${count > 1 ? "s" : ""} de présence`}
                  />
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
          <p className="text-[11px] text-gray-400 mt-2">
            Nombre de jours distincts avec au moins une connexion ou une visite enregistrée.
          </p>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <input
            type="text"
            value={filtreNom}
            onChange={e => setFiltreNom(e.target.value)}
            placeholder="Filtrer par nom…"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
          />
          {filtreNom && (
            <button
              onClick={() => setFiltreNom("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
          {(["tous", "connexion", "visite"] as FiltreType[]).map(t => (
            <button
              key={t}
              onClick={() => setFiltreType(t)}
              className={`px-3 py-2 transition-colors ${
                filtreType === t
                  ? "bg-[#B4432E] text-white font-medium"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "tous" ? "Tous" : t === "connexion" ? "🔑 Connexions" : "👁️ Visites"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {chargement ? (
          <div className="py-16 text-center text-gray-400 text-sm">Chargement…</div>
        ) : filtrees.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-2">🔌</p>
            <p className="text-gray-400 text-sm">Aucune entrée trouvée.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Heure</th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map(c => {
                const dt = new Date(c.dateHeure)
                const date = dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
                const heure = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                const typeReel = c.type ?? "connexion"
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1A1A1A]">{c.nom}</td>
                    <td className="py-3 px-4 text-sm">
                      {typeReel === "connexion" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          🔑 Connexion
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          👁️ Visite
                        </span>
                      )}
                    </td>
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
