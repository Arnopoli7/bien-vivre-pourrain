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

function getInitiales(nom: string) {
  return nom.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
}

function getRoleStyle(role: string): { bg: string; text: string } {
  if (role === "maire")    return { bg: "bg-[#B4432E]",  text: "text-white" }
  if (role === "adjoint")  return { bg: "bg-orange-400", text: "text-white" }
  return                          { bg: "bg-green-500",  text: "text-white" }
}

// ── Carte d'absence ───────────────────────────────────────────────────────────

interface AbsenceCardProps {
  absence: Absence
  role: string
  badgeType: "today" | "upcoming"
  canEdit: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
}

function AbsenceCard({ absence, role, badgeType, canEdit, canDelete, onEdit, onDelete }: AbsenceCardProps) {
  const { bg, text } = getRoleStyle(role)
  return (
    <div className="bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${bg} ${text}`}>
        {getInitiales(absence.nomUtilisateur)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[#1A1A1A]">{absence.nomUtilisateur}</p>
          {badgeType === "today" ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              Absent aujourd&apos;hui
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
              Absent à partir du {formatDate(absence.dateDebut)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Du {formatDate(absence.dateDebut)} au {formatDate(absence.dateFin)}
        </p>
        {absence.motif && (
          <p className="text-xs text-gray-400 mt-0.5 italic">{absence.motif}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {canEdit && (
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Modifier"
            aria-label="Modifier cette absence"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => {
              if (window.confirm("Supprimer cette absence ?")) onDelete()
            }}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
            aria-label="Supprimer cette absence"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function PresenceElusPage() {
  const { currentUser, absences, ajouterAbsence, supprimerAbsence, modifierAbsence, users } = useApp()

  const [formOuvert, setFormOuvert] = useState(false)
  const [dateDebut, setDateDebut]   = useState("")
  const [dateFin, setDateFin]       = useState("")
  const [motif, setMotif]           = useState("")
  const [erreur, setErreur]         = useState("")

  // État du modal d'édition
  const [absenceEnEdition, setAbsenceEnEdition] = useState<Absence | null>(null)
  const [editDateDebut, setEditDateDebut] = useState("")
  const [editDateFin, setEditDateFin]     = useState("")
  const [editMotif, setEditMotif]         = useState("")
  const [editErreur, setEditErreur]       = useState("")

  const today   = new Date().toISOString().slice(0, 10)
  const isMaire = currentUser?.role === "maire"

  // Suppression silencieuse des absences expirées au chargement
  // L'absence disparaît le LENDEMAIN de sa date de fin (fin de journée écoulée)
  useEffect(() => {
    absences.forEach(a => {
      const endOfDay = new Date(a.dateFin)
      endOfDay.setHours(23, 59, 59, 999)
      if (endOfDay.getTime() < Date.now()) supprimerAbsence(a.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Calculs dérivés ────────────────────────────────────────────────────────

  const absencesActives    = absences.filter(a => a.dateFin >= today)
  const absentsAujourdhui  = absencesActives.filter(a => a.dateDebut <= today)
  const absencesAVenir     = absencesActives
    .filter(a => a.dateDebut > today)
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))

  const userIdsAbsentsAujourdhui = new Set(absentsAujourdhui.map(a => a.userId))
  const elusDisponibles = users
    .filter(u => u.role !== "secretaire" && !userIdsAbsentsAujourdhui.has(u.id))
    .sort((a, b) => {
      const order: Record<string, number> = { maire: 0, adjoint: 1, conseiller: 2, redacteur: 2 }
      return (order[a.role] ?? 3) - (order[b.role] ?? 3)
    })

  const statusRouge = absentsAujourdhui.length > 0

  function getUserRole(userId: string) {
    return users.find(u => u.id === userId)?.role ?? "conseiller"
  }

  function canEditOrDelete(absence: Absence) {
    if (isMaire) return true
    return absence.userId === currentUser?.id
  }

  // ── Formulaire d'ajout ─────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dateDebut) { setErreur("La date de début est obligatoire."); return }
    if (!dateFin)   { setErreur("La date de fin est obligatoire."); return }
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

  function fermerModal() {
    setFormOuvert(false)
    setErreur("")
  }

  // ── Formulaire d'édition ───────────────────────────────────────────────────

  function ouvrirEdition(absence: Absence) {
    setAbsenceEnEdition(absence)
    setEditDateDebut(absence.dateDebut)
    setEditDateFin(absence.dateFin)
    setEditMotif(absence.motif ?? "")
    setEditErreur("")
  }

  function fermerEdition() {
    setAbsenceEnEdition(null)
    setEditErreur("")
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editDateDebut) { setEditErreur("La date de début est obligatoire."); return }
    if (!editDateFin)   { setEditErreur("La date de fin est obligatoire."); return }
    if (editDateFin < editDateDebut) { setEditErreur("La date de fin doit être après la date de début."); return }
    if (!absenceEnEdition) return

    modifierAbsence({
      ...absenceEnEdition,
      dateDebut: editDateDebut,
      dateFin: editDateFin,
      motif: editMotif.trim() || undefined,
    })
    fermerEdition()
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Présence des élus</h1>
          <p className={`text-sm mt-1 font-medium ${statusRouge ? "text-red-600" : "text-orange-500"}`}>
            {absentsAujourdhui.length} absent{absentsAujourdhui.length > 1 ? "s" : ""} aujourd&apos;hui
            {" · "}
            {absencesAVenir.length} absence{absencesAVenir.length > 1 ? "s" : ""} à venir
          </p>
        </div>
        <button
          onClick={() => setFormOuvert(true)}
          className="shrink-0 flex items-center gap-2 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <span className="text-base leading-none">+</span>
          <span className="hidden sm:inline">Déclarer mon absence</span>
          <span className="sm:hidden">Absence</span>
        </button>
      </div>

      {/* Section 1 — Absents aujourd'hui */}
      {absentsAujourdhui.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">
            Absents aujourd&apos;hui
          </h2>
          <div className="bg-[#FFF0EE] rounded-2xl p-4 space-y-3">
            {absentsAujourdhui.map(absence => (
              <AbsenceCard
                key={absence.id}
                absence={absence}
                role={getUserRole(absence.userId)}
                badgeType="today"
                canEdit={canEditOrDelete(absence)}
                canDelete={canEditOrDelete(absence)}
                onEdit={() => ouvrirEdition(absence)}
                onDelete={() => supprimerAbsence(absence.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 2 — Absences à venir */}
      {absencesAVenir.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-3">
            Absences à venir
          </h2>
          <div className="bg-[#FFF8EE] rounded-2xl p-4 space-y-3">
            {absencesAVenir.map(absence => (
              <AbsenceCard
                key={absence.id}
                absence={absence}
                role={getUserRole(absence.userId)}
                badgeType="upcoming"
                canEdit={canEditOrDelete(absence)}
                canDelete={canEditOrDelete(absence)}
                onEdit={() => ouvrirEdition(absence)}
                onDelete={() => supprimerAbsence(absence.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* État vide */}
      {absencesActives.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-gray-500 text-sm font-medium">Aucune absence déclarée</p>
        </div>
      )}

      {/* Section 3 — Élus disponibles aujourd'hui */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Élus disponibles aujourd&apos;hui
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          {elusDisponibles.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Tous les élus sont absents aujourd&apos;hui</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {elusDisponibles.map(user => {
                const { bg, text } = getRoleStyle(user.role)
                return (
                  <div key={user.id} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${bg} ${text}`}>
                      {getInitiales(user.nom)}
                    </div>
                    <span className="text-sm text-gray-700">{user.nom}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal — Déclarer mon absence */}
      {formOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Déclarer mon absence</h2>
              <button
                onClick={fermerModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
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
                  onClick={fermerModal}
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

      {/* Modal — Modifier l'absence */}
      {absenceEnEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Modifier l&apos;absence</h2>
              <button
                onClick={fermerEdition}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date de début <span className="text-[#B4432E]">*</span>
                  </label>
                  <input
                    type="date"
                    value={editDateDebut}
                    onChange={e => setEditDateDebut(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date de fin <span className="text-[#B4432E]">*</span>
                  </label>
                  <input
                    type="date"
                    value={editDateFin}
                    onChange={e => setEditDateFin(e.target.value)}
                    min={editDateDebut}
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
                  value={editMotif}
                  onChange={e => setEditMotif(e.target.value)}
                  placeholder="Ex : Congés, déplacement…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
                />
              </div>
              {editErreur && <p className="text-sm text-[#B4432E]">{editErreur}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={fermerEdition}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[#B4432E] hover:bg-[#8B3222] rounded-xl transition-colors"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
