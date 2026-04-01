"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import { commissionColors } from "@/lib/commission-colors"
import type { Reunion } from "@/types"
import { getMembresCommission } from "@/lib/commission-membres"

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]
const JOURS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function formatDateISO(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function formatDateLong(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

// Seuls les élus (pas les secrétaires) participent aux présences
function useElus() {
  const { users } = useApp()
  return users.filter(u => u.role !== "secretaire")
}

function presenceCounts(reunion: Reunion, totalElus: number) {
  const p = reunion.presences ?? {}
  const nbP = Object.values(p).filter(v => v === "present").length
  const nbA = Object.values(p).filter(v => v === "absent").length
  return { nbP, nbA, nbS: totalElus - nbP - nbA }
}

// ── MODAL DÉTAIL RÉUNION ──────────────────────────────────────────────────────

function ReunionDetailModal({
  reunion,
  onClose,
}: {
  reunion: Reunion
  onClose: () => void
}) {
  const { currentUser, commissions, marquerPresence, supprimerReunion } = useApp()
  const elus = useElus()
  const canEdit = currentUser?.role === "maire" || currentUser?.role === "adjoint"

  const commission = commissions.find(c => c.id === reunion.commissionId)
  const bg = commissionColors[reunion.commissionId] ?? "#F0F0F0"
  const presences = reunion.presences ?? {}
  const monStatut = currentUser ? presences[currentUser.id] : undefined

  const membresNoms = getMembresCommission(reunion.commissionId)
  const hasMembres = membresNoms.length > 0
  const membres = hasMembres ? elus.filter(u => membresNoms.includes(u.nom)) : elus
  const autresElus = hasMembres ? elus.filter(u => !membresNoms.includes(u.nom)) : []

  const membresPresents = membres.filter(u => presences[u.id] === "present")
  const membresAbsents = membres.filter(u => presences[u.id] === "absent")
  const membresSansReponse = membres.filter(u => !presences[u.id])
  const autresPresents = autresElus.filter(u => presences[u.id] === "present")

  function handleSupprimer() {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réunion ?")) {
      supprimerReunion(reunion.id)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── EN-TÊTE ── */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {reunion.titre && (
                <h2 className="text-xl font-bold text-[#1A1A1A] leading-snug mb-2">
                  {reunion.titre}
                </h2>
              )}
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-lg"
                style={{ backgroundColor: bg }}
              >
                {commission?.nom ?? "Commission inconnue"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <span>📅</span>
              <span className="capitalize">{formatDateLong(reunion.date)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span>🕐</span>
              <span>{reunion.heure}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span>📍</span>
              <span>{reunion.lieu}</span>
            </span>
          </div>
        </div>

        {/* ── MON STATUT ── */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-bold uppercase tracking-widest text-[#B4432E] mb-3">
            Mon statut
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => currentUser && marquerPresence(reunion.id, "present")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                monStatut === "present"
                  ? "bg-green-500 text-white shadow-md shadow-green-200 scale-[1.02]"
                  : "bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-400"
              }`}
            >
              <span className="text-lg">✅</span>
              Je serai présent
            </button>
            <button
              onClick={() => currentUser && marquerPresence(reunion.id, "absent")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                monStatut === "absent"
                  ? "bg-red-500 text-white shadow-md shadow-red-200 scale-[1.02]"
                  : "bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 hover:border-red-400"
              }`}
            >
              <span className="text-lg">❌</span>
              Je serai absent
            </button>
          </div>
          {monStatut && (
            <p className="text-xs text-center text-gray-400 mt-2.5">
              {monStatut === "present" ? "✅ Vous avez confirmé votre présence." : "❌ Vous avez déclaré votre absence."}
            </p>
          )}
        </div>

        {/* ── COMPTEURS ── */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 space-y-1">
          <p className="text-sm text-center font-medium text-gray-700">
            <span className="text-amber-600 font-semibold">⭐ Membres :</span>
            {" "}
            <span className="text-green-600 font-semibold">✅ {membresPresents.length} présent{membresPresents.length !== 1 ? "s" : ""}</span>
            <span className="text-gray-400 mx-1.5">·</span>
            <span className="text-red-500 font-semibold">❌ {membresAbsents.length} absent{membresAbsents.length !== 1 ? "s" : ""}</span>
            <span className="text-gray-400 mx-1.5">·</span>
            <span className="text-gray-500 font-semibold">⏳ {membresSansReponse.length} sans réponse</span>
          </p>
          {autresElus.length > 0 && (
            <p className="text-xs text-center text-gray-500">
              {"Autres élus : "}
              <span className="text-green-600 font-semibold">✅ {autresPresents.length} présent{autresPresents.length !== 1 ? "s" : ""}</span>
            </p>
          )}
        </div>

        {/* ── SECTION 1 : MEMBRES DE LA COMMISSION ── */}
        <div className="bg-green-50/40 border-b border-gray-100">
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <span className="text-sm">⭐</span>
            <span className="text-xs font-bold uppercase tracking-wider text-green-800">
              Membres de la commission
            </span>
            <span className="ml-auto text-[10px] font-semibold text-green-600">
              {membres.length} membre{membres.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-green-100">
            {/* Présents membres */}
            <div className="p-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs">✅</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">Présents</span>
                <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-100 px-1 py-0.5 rounded-full">{membresPresents.length}</span>
              </div>
              {membresPresents.length === 0 ? (
                <p className="text-[10px] text-green-300 italic">Aucun</p>
              ) : (
                <ul className="space-y-1.5">
                  {membresPresents.map(u => (
                    <li key={u.id} className="flex items-center gap-1.5 text-[11px] text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      {u.nom}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Absents membres */}
            <div className="p-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs">❌</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Absents</span>
                <span className="ml-auto text-[10px] font-bold text-red-500 bg-red-100 px-1 py-0.5 rounded-full">{membresAbsents.length}</span>
              </div>
              {membresAbsents.length === 0 ? (
                <p className="text-[10px] text-red-300 italic">Aucun</p>
              ) : (
                <ul className="space-y-1.5">
                  {membresAbsents.map(u => (
                    <li key={u.id} className="flex items-center gap-1.5 text-[11px] text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      {u.nom}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Sans réponse membres */}
            <div className="p-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs">⏳</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Sans rép.</span>
                <span className="ml-auto text-[10px] font-bold text-gray-500 bg-gray-200 px-1 py-0.5 rounded-full">{membresSansReponse.length}</span>
              </div>
              {membresSansReponse.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic">Tous ont répondu !</p>
              ) : (
                <ul className="space-y-1.5">
                  {membresSansReponse.map(u => (
                    <li key={u.id} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      {u.nom}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 2 : AUTRES ÉLUS ── */}
        {autresElus.length > 0 && (
          <div className="bg-gray-50/60 border-b border-gray-100">
            <div className="px-4 pt-3 pb-2 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Autres élus</span>
              <span className="ml-auto text-[10px] font-semibold text-gray-400">{autresElus.length}</span>
            </div>
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {autresElus.map(u => {
                const statut = presences[u.id]
                return (
                  <span
                    key={u.id}
                    className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      statut === "present"
                        ? "bg-green-100 text-green-700"
                        : statut === "absent"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {statut === "present" ? "✅" : statut === "absent" ? "❌" : "⏳"} {u.nom}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PIED DE PAGE ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {canEdit ? (
            <button
              onClick={handleSupprimer}
              className="text-sm font-medium text-red-400 hover:text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
            >
              🗑️ Supprimer
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MODAL AJOUT RÉUNION ───────────────────────────────────────────────────────

function AjouterReunionModal({
  onClose,
  defaultDate,
}: {
  onClose: () => void
  defaultDate: string
}) {
  const { commissions, ajouterReunion } = useApp()
  const [date, setDate] = useState(defaultDate)
  const [commissionId, setCommissionId] = useState(commissions[0]?.id ?? "")
  const [titre, setTitre] = useState("")
  const [heure, setHeure] = useState("18:00")
  const [lieu, setLieu] = useState("")
  const [erreur, setErreur] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titre.trim()) { setErreur("Le titre ou objet est obligatoire."); return }
    if (!lieu.trim()) { setErreur("Le lieu est obligatoire."); return }
    const r: Reunion = {
      id: `r-${Date.now()}`,
      commissionId,
      date,
      heure,
      lieu: lieu.trim(),
      titre: titre.trim(),
    }
    ajouterReunion(r)

    // Notification email (best-effort, sans bloquer la fermeture)
    const commission = commissions.find(c => c.id === commissionId)
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "reunion",
        commission: commission?.nom ?? "",
        titre: r.titre,
        date: r.date,
        heure: r.heure,
        lieu: r.lieu,
      }),
    }).catch(console.error)

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Ajouter une réunion</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission</label>
            <select
              value={commissionId}
              onChange={e => setCommissionId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
            >
              {commissions.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Titre ou objet de la réunion <span className="text-[#B4432E]">*</span>
            </label>
            <input
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex : Budget primitif 2026, Travaux voirie…"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure</label>
              <input
                type="time"
                value={heure}
                onChange={e => setHeure(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lieu</label>
            <input
              type="text"
              value={lieu}
              onChange={e => setLieu(e.target.value)}
              placeholder="Ex : Salle du conseil municipal"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
            />
          </div>
          {erreur && <p className="text-sm text-[#B4432E]">{erreur}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Annuler
            </button>
            <button type="submit"
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#B4432E] hover:bg-[#8B3222] rounded-xl transition-colors">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── PAGE CALENDRIER ───────────────────────────────────────────────────────────

export default function CalendrierPage() {
  const { currentUser, commissions, reunions, supprimerReunion, marquerPresence } = useApp()
  const elus = useElus()
  const canEditReunions = currentUser?.role === "maire" || currentUser?.role === "adjoint"
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [modalAjout, setModalAjout] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [reunionDetail, setReunionDetail] = useState<Reunion | null>(null)

  // Suppression automatique des réunions passées (le lendemain)
  useEffect(() => {
    const todayISO = new Date().toISOString().slice(0, 10)
    reunions.forEach(r => {
      if (r.date < todayISO) {
        supprimerReunion(r.id)
      }
    })
  }, [reunions]) // eslint-disable-line react-hooks/exhaustive-deps

  const days = buildCalendarDays(year, month)

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  function reunionsForDay(day: number) {
    const iso = formatDateISO(year, month, day)
    return reunions.filter(r => r.date === iso)
  }

  const todayISO = today.toISOString().slice(0, 10)
  const defaultModalDate = selectedDay
    ? formatDateISO(year, month, selectedDay)
    : formatDateISO(year, month, today.getDate())

  const prochaines = [...reunions]
    .filter(r => r.date >= todayISO)
    .sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure))
    .slice(0, 10)

  // Sync modal avec données temps réel
  const reunionDetailLive = reunionDetail
    ? reunions.find(r => r.id === reunionDetail.id) ?? reunionDetail
    : null

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#B4432E]">Calendrier des commissions</h1>
          <p className="text-sm text-gray-500 mt-1">Planifiez et consultez les réunions</p>
        </div>
        {canEditReunions && (
          <button
            onClick={() => { setSelectedDay(null); setModalAjout(true) }}
            className="flex items-center gap-2 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <span>+</span>
            Ajouter une réunion
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* ── PANNEAU DROITE (prochaines réunions + jour sélectionné) ──
            order-first sur mobile → apparaît en haut
            md:order-last sur desktop → reste à droite */}
        <div className="w-full md:w-72 md:shrink-0 space-y-3 order-first md:order-last">

          {/* Prochaines réunions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-[#FFF8E8]">
              <h3 className="font-semibold text-[#B4432E] text-sm">Prochaines réunions</h3>
            </div>
            {prochaines.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-2xl mb-2">📅</p>
                <p className="text-xs text-gray-400">Aucune réunion planifiée</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {prochaines.map(r => {
                  const c = commissions.find(c => c.id === r.commissionId)
                  const bg = commissionColors[r.commissionId] ?? "#F0F0F0"
                  const [rYear, rMonth, rDay] = r.date.split("-").map(Number)
                  const { nbP, nbA, nbS } = presenceCounts(r, elus.length)
                  const presences = r.presences ?? {}
                  const monStatut = currentUser ? presences[currentUser.id] : undefined
                  return (
                    <div key={r.id} className="p-3">
                      <div
                        onClick={() => setReunionDetail(r)}
                        className="hover:bg-[#FAF8F5] transition-colors cursor-pointer rounded-lg p-1 -m-1"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 shrink-0 self-stretch rounded-full mt-0.5" style={{ backgroundColor: bg }} />
                          <div className="min-w-0 flex-1">
                            {r.titre && (
                              <p className="text-xs font-semibold text-[#1A1A1A] truncate">{r.titre}</p>
                            )}
                            <p className={`truncate ${r.titre ? "text-[10px] text-gray-500" : "text-xs font-semibold text-[#1A1A1A]"}`}>
                              {c?.nom}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {String(rDay).padStart(2, "0")}/{String(rMonth).padStart(2, "0")}/{rYear} à {r.heure}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">📍 {r.lieu}</p>
                            <p className="text-[10px] mt-1 text-gray-500">
                              <span className="text-green-600 font-medium">✅ {nbP}</span>
                              {" · "}
                              <span className="text-red-500 font-medium">❌ {nbA}</span>
                              {" · "}
                              <span className="text-gray-400">⏳ {nbS}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Bouton présence rapide sur mobile */}
                      <div className="flex gap-2 mt-2 md:hidden">
                        <button
                          onClick={() => currentUser && marquerPresence(r.id, "present")}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                            monStatut === "present"
                              ? "bg-green-500 text-white"
                              : "bg-green-50 text-green-700 border border-green-200"
                          }`}
                        >
                          ✅ Présent
                        </button>
                        <button
                          onClick={() => currentUser && marquerPresence(r.id, "absent")}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                            monStatut === "absent"
                              ? "bg-red-500 text-white"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          ❌ Absent
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Détail du jour sélectionné */}
          {selectedDay !== null && (
            <div className="bg-white rounded-xl shadow-sm border border-[#F2C94C] overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-[#FFF8E8]">
                <h3 className="font-semibold text-[#B4432E] text-sm">
                  {String(selectedDay).padStart(2, "0")}/{String(month).padStart(2, "0")}/{year}
                </h3>
                {canEditReunions && (
                  <button
                    onClick={() => setModalAjout(true)}
                    className="text-xs bg-[#B4432E] text-white px-2 py-1 rounded-lg hover:bg-[#8B3222] transition-colors"
                  >
                    + Réunion
                  </button>
                )}
              </div>
              {reunionsForDay(selectedDay).length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-gray-400">Aucune réunion ce jour</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {reunionsForDay(selectedDay).map(r => {
                    const c = commissions.find(c => c.id === r.commissionId)
                    const bg = commissionColors[r.commissionId] ?? "#F0F0F0"
                    const { nbP, nbA, nbS } = presenceCounts(r, elus.length)
                    return (
                      <div
                        key={r.id}
                        onClick={() => setReunionDetail(r)}
                        className="p-3 hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        <div
                          className="text-xs font-semibold px-2 py-1 rounded-lg mb-1.5 truncate"
                          style={{ backgroundColor: bg }}
                        >
                          {c?.nom}
                        </div>
                        {r.titre && (
                          <p className="text-xs font-medium text-[#1A1A1A] mb-1">{r.titre}</p>
                        )}
                        <p className="text-[11px] text-gray-500">🕐 {r.heure} · 📍 {r.lieu}</p>
                        <p className="text-[10px] mt-1.5 text-gray-500">
                          <span className="text-green-600 font-medium">✅ {nbP}</span>
                          {" · "}
                          <span className="text-red-500 font-medium">❌ {nbA}</span>
                          {" · "}
                          <span className="text-gray-400">⏳ {nbS}</span>
                        </p>
                        <p className="text-[10px] text-[#B4432E] mt-1 font-medium">Cliquer pour les détails →</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── GRILLE CALENDRIER ──
            order-last sur mobile → apparaît en bas
            md:order-first sur desktop → reste à gauche */}
        <div className="flex-1 min-w-0 order-last md:order-first overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="min-w-[350px] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-[#FAF8F5] text-gray-600 hover:text-[#B4432E] transition-colors text-lg">
              ←
            </button>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">
              {MOIS_FR[month - 1]} {year}
            </h2>
            <button onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-[#FAF8F5] text-gray-600 hover:text-[#B4432E] transition-colors text-lg">
              →
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-100">
            {JOURS_FR.map(j => (
              <div key={j} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {j}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="min-h-[90px] border-b border-r border-gray-50" />
              }
              const iso = formatDateISO(year, month, day)
              const isToday = iso === todayISO
              const isSelected = selectedDay === day
              const dayReunions = reunionsForDay(day)

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[90px] p-1.5 border-b border-r border-gray-50 cursor-pointer transition-colors ${
                    isSelected ? "bg-[#FFF8E8]" : "hover:bg-[#FAF8F5]"
                  }`}
                >
                  <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-medium mb-1 ${
                    isToday
                      ? "bg-[#B4432E] text-white"
                      : isSelected
                        ? "bg-[#F2C94C] text-[#1A1A1A]"
                        : "text-gray-700"
                  }`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayReunions.slice(0, 3).map(r => {
                      const c = commissions.find(c => c.id === r.commissionId)
                      const bg = commissionColors[r.commissionId] ?? "#F0F0F0"
                      const { nbP, nbA, nbS } = presenceCounts(r, elus.length)
                      return (
                        <div
                          key={r.id}
                          onClick={e => { e.stopPropagation(); setReunionDetail(r) }}
                          className="rounded cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: bg }}
                          title={`${r.titre ?? c?.nom} — ${r.heure}`}
                        >
                          <div className="text-[9px] font-medium px-1.5 pt-0.5 truncate leading-tight">
                            {r.heure} {r.titre ?? c?.nom}
                          </div>
                          <div className="text-[8px] px-1.5 pb-0.5 text-[#1A1A1A]/60 leading-tight">
                            ✅{nbP} · ❌{nbA} · ⏳{nbS}
                          </div>
                        </div>
                      )
                    })}
                    {dayReunions.length > 3 && (
                      <div className="text-[9px] text-gray-400 px-1">+{dayReunions.length - 3} autres</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {modalAjout && canEditReunions && (
        <AjouterReunionModal
          onClose={() => setModalAjout(false)}
          defaultDate={defaultModalDate}
        />
      )}

      {reunionDetailLive && (
        <ReunionDetailModal
          reunion={reunionDetailLive}
          onClose={() => setReunionDetail(null)}
        />
      )}
    </div>
  )
}
