"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { commissionColors } from "@/lib/commission-colors"
import type { Reunion } from "@/types"

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
  const [heure, setHeure] = useState("18:00")
  const [lieu, setLieu] = useState("")
  const [erreur, setErreur] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!lieu.trim()) { setErreur("Le lieu est obligatoire."); return }
    const r: Reunion = {
      id: `r-${Date.now()}`,
      commissionId,
      date,
      heure,
      lieu: lieu.trim(),
    }
    ajouterReunion(r)
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

export default function CalendrierPage() {
  const { currentUser, commissions, reunions, supprimerReunion } = useApp()
  const canEditReunions = currentUser?.role === "maire" || currentUser?.role === "adjoint"
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#B4432E]">Calendrier des commissions</h1>
          <p className="text-sm text-gray-500 mt-1">Planifiez et consultez les réunions</p>
        </div>
        {canEditReunions && (
          <button
            onClick={() => { setSelectedDay(null); setModalOuvert(true) }}
            className="flex items-center gap-2 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <span>+</span>
            Ajouter une réunion
          </button>
        )}
      </div>

      <div className="flex gap-6 items-start">
        {/* Calendar */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-gray-50" />
              }
              const iso = formatDateISO(year, month, day)
              const isToday = iso === todayISO
              const isSelected = selectedDay === day
              const dayReunions = reunionsForDay(day)

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[80px] p-2 border-b border-r border-gray-50 cursor-pointer transition-colors ${
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
                      return (
                        <div
                          key={r.id}
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded truncate leading-tight"
                          style={{ backgroundColor: bg, color: "#1A1A1A" }}
                          title={`${c?.nom} — ${r.heure} — ${r.lieu}`}
                        >
                          {r.heure} {c?.nom}
                        </div>
                      )
                    })}
                    {dayReunions.length > 3 && (
                      <div className="text-[9px] text-gray-400">+{dayReunions.length - 3}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Prochaines réunions panel */}
        <div className="w-72 shrink-0 space-y-3">
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
                  return (
                    <div key={r.id} className="p-3 hover:bg-[#FAF8F5] transition-colors">
                      <div className="flex items-start gap-2">
                        <div
                          className="w-2 h-full min-h-[32px] rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: bg, minWidth: "6px" }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#1A1A1A] truncate">{c?.nom}</p>
                          <p className="text-[11px] text-gray-500">
                            {String(rDay).padStart(2, "0")}/{String(rMonth).padStart(2, "0")}/{rYear}
                            {" "}à {r.heure}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">📍 {r.lieu}</p>
                        </div>
                        {canEditReunions && (
                          <button
                            onClick={() => {
                              if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réunion ?"))
                                supprimerReunion(r.id)
                            }}
                            className="p-1 text-gray-300 hover:text-[#B4432E] hover:bg-red-50 rounded transition-colors shrink-0"
                            title="Supprimer"
                          >🗑️</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Selected day details */}
          {selectedDay !== null && (
            <div className="bg-white rounded-xl shadow-sm border border-[#F2C94C] overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-[#FFF8E8]">
                <h3 className="font-semibold text-[#B4432E] text-sm">
                  {String(selectedDay).padStart(2, "0")}/{String(month).padStart(2, "0")}/{year}
                </h3>
                {canEditReunions && (
                  <button
                    onClick={() => setModalOuvert(true)}
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
                    return (
                      <div key={r.id} className="p-3">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-xs font-semibold px-2 py-1 rounded-lg mb-1 truncate"
                              style={{ backgroundColor: bg }}
                            >
                              {c?.nom}
                            </div>
                            <p className="text-[11px] text-gray-500">🕐 {r.heure} · 📍 {r.lieu}</p>
                          </div>
                          {canEditReunions && (
                            <button
                              onClick={() => {
                                if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réunion ?"))
                                  supprimerReunion(r.id)
                              }}
                              className="p-1 text-gray-300 hover:text-[#B4432E] hover:bg-red-50 rounded transition-colors shrink-0"
                              title="Supprimer"
                            >🗑️</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOuvert && canEditReunions && (
        <AjouterReunionModal
          onClose={() => setModalOuvert(false)}
          defaultDate={defaultModalDate}
        />
      )}
    </div>
  )
}
