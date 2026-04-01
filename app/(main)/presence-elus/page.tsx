"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import type { Absence } from "@/types"

const MOIS_FR = [
  "jan.", "fév.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sep.", "oct.", "nov.", "déc.",
]

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return `${String(d).padStart(2, "0")} ${MOIS_FR[m - 1]} ${y}`
}

export default function PresenceElusPage() {
  const { currentUser, absences, ajouterAbsence, supprimerAbsence } = useApp()
  const [formOuvert, setFormOuvert] = useState(false)
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [motif, setMotif] = useState("")
  const [erreur, setErreur] = useState("")

  const today = new Date().toISOString().slice(0, 10)
  const isMaire = currentUser?.role === "maire"

  // Suppression automatique des absences expirées au chargement
  useEffect(() => {
    absences.forEach(a => {
      if (a.dateFin < today) {
        supprimerAbsence(a.id)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Triées par date de début la plus proche en premier (ascendant)
  const absencesTri = [...absences]
    .filter(a => a.dateFin >= today) // on n'affiche pas les expirées avant qu'elles soient supprimées
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))

  const absentsAujourdhui = absences.filter(a => a.dateDebut <= today && a.dateFin >= today)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dateDebut) { setErreur("La date de début est obligatoire."); return }
    if (!dateFin) { setErreur("La date de fin est obligatoire."); return }
    if (dateFin < dateDebut) { setErreur("La date de fin doit être après la date de début."); return }
    if (!currentUser) return

    const absence: Absence = {
      id: `abs-${Date.now()}`,
      userId: currentUser.id,
      nomUtilisateur: currentUser.nom,
      dateDebut,
      dateFin,
      motif: motif.trim() || undefined,
      dateCreation: today,
    }
    ajouterAbsence(absence)
    setFormOuvert(false)
    setDateDebut("")
    setDateFin("")
    setMotif("")
    setErreur("")
  }

  function canDelete(absence: Absence) {
    if (isMaire) return true
    return absence.userId === currentUser?.id
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#B4432E]">Présence Élus</h1>
          <p className="text-sm text-gray-500 mt-1">
            Déclarez vos absences prévues et consultez celles des élus
          </p>
        </div>
        <button
          onClick={() => setFormOuvert(true)}
          className="shrink-0 flex items-center gap-2 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <span>+</span>
          <span className="hidden sm:inline">Déclarer une absence</span>
          <span className="sm:hidden">Absence</span>
        </button>
      </div>

      {/* Absences aujourd'hui */}
      {absentsAujourdhui.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3">
          <p className="text-sm font-semibold text-red-700 mb-1">
            🔴 {absentsAujourdhui.length} élu{absentsAujourdhui.length > 1 ? "s" : ""} absent{absentsAujourdhui.length > 1 ? "s" : ""} aujourd'hui
          </p>
          <p className="text-xs text-red-500">
            {absentsAujourdhui.map(a => a.nomUtilisateur).join(", ")}
          </p>
        </div>
      )}

      {/* Tableau des absences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-[#FAF8F5]">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">
            Absences déclarées
            <span className="ml-2 text-xs font-normal text-gray-400">({absencesTri.length})</span>
          </h2>
        </div>

        {absencesTri.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-gray-400 text-sm">Aucune absence déclarée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date début</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date fin</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Motif</th>
                  <th className="py-3 px-4 w-12" />
                </tr>
              </thead>
              <tbody>
                {absencesTri.map(absence => {
                  const estAbsentAujourdhui = absence.dateDebut <= today && absence.dateFin >= today
                  return (
                    <tr key={absence.id} className="border-b border-gray-100 hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium text-[#1A1A1A]">{absence.nomUtilisateur}</p>
                          {estAbsentAujourdhui && (
                            <span className="inline-block w-fit text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                              Absent aujourd'hui
                            </span>
                          )}
                          {/* Motif affiché sous le nom sur mobile */}
                          {absence.motif && (
                            <p className="text-xs text-gray-400 sm:hidden">{absence.motif}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(absence.dateDebut)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(absence.dateFin)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 hidden sm:table-cell">
                        {absence.motif ?? <span className="italic text-gray-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canDelete(absence) && (
                          <button
                            onClick={() => {
                              if (window.confirm("Supprimer cette absence ?"))
                                supprimerAbsence(absence.id)
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#B4432E] hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal déclaration d'absence */}
      {formOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Déclarer une absence</h2>
              <button onClick={() => { setFormOuvert(false); setErreur("") }}
                className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date de début <span className="text-[#B4432E]">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={e => setDateDebut(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date de fin <span className="text-[#B4432E]">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={e => setDateFin(e.target.value)}
                    min={dateDebut}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Motif <span className="text-xs text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                  placeholder="Ex : Congés, déplacement…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
                />
              </div>
              {erreur && <p className="text-sm text-[#B4432E]">{erreur}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setFormOuvert(false); setErreur("") }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[#B4432E] hover:bg-[#8B3222] rounded-xl transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
