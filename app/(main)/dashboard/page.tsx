"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useApp } from "@/lib/app-context"
import { commissionColors } from "@/lib/commission-colors"
import { getComptesRendus } from "@/lib/firebase/firestore"
import ChangePasswordModal from "@/components/ui/ChangePasswordModal"
import type { CompteRendu } from "@/types"

const roleLabels: Record<string, string> = {
  maire:      "Maire",
  adjoint:    "Adjoint au Maire",
  conseiller: "Conseiller Municipal",
}

export default function DashboardPage() {
  const { currentUser, commissions, reunions, aCommissionAcces, updateUser } = useApp()
  const commissionsVisibles = commissions.filter(c => aCommissionAcces(c.id))
  const [comptesRendus, setComptesRendus] = useState<CompteRendu[]>([])
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    getComptesRendus().then(setComptesRendus).catch(console.error)
  }, [])

  useEffect(() => {
    if (currentUser?.motDePasseTemporaire) {
      setShowPasswordModal(true)
    }
  }, [currentUser])

  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const prenom = currentUser?.nom.split(" ")[0] ?? ""

  const allProchainesReunions = [...reunions]
    .filter(r => r.date >= todayISO && aCommissionAcces(r.commissionId))
    .sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure))

  const prochainesReunions = allProchainesReunions.slice(0, 3)

  const reunionsProches48h = allProchainesReunions.filter(r => {
    const dt = new Date(`${r.date}T${r.heure}:00`)
    return dt <= in48h
  })

  const comptesRendusValides = comptesRendus.filter(cr => cr.statut === "valide" && aCommissionAcces(cr.commissionId)).length

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Modal changement de mot de passe (1ère connexion) */}
      {showPasswordModal && currentUser && (
        <ChangePasswordModal
          user={currentUser}
          onClose={() => setShowPasswordModal(false)}
          onUpdate={updateUser}
        />
      )}

      {/* Bannières réunions dans moins de 48h */}
      {reunionsProches48h.map(r => {
        const commission = commissions.find(c => c.id === r.commissionId)
        const [rYear, rMonth, rDay] = r.date.split("-").map(Number)
        return (
          <div
            key={r.id}
            className="rounded-xl px-5 py-3 text-sm font-medium text-[#1A1A1A] flex items-center gap-2"
            style={{ backgroundColor: "#F2C94C" }}
          >
            ⚠️ Réunion dans moins de 48h — {commission?.nom ?? "—"} le{" "}
            {String(rDay).padStart(2, "0")}/{String(rMonth).padStart(2, "0")}/{rYear} à {r.heure} — {r.lieu}
          </div>
        )
      })}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">
          Bonjour {prenom} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Vous êtes connecté en tant que{" "}
          <span className="font-medium text-[#B4432E]">
            {currentUser ? roleLabels[currentUser.role] : ""}
          </span>
        </p>
      </div>

      {/* Logo */}
      <img
        src="/logo.jpg"
        alt="Bien Vivre à Pourrain"
        style={{ width: "150px", margin: "16px auto", display: "block" }}
      />

      {/* LIGNE 1 — 3 compteurs cliquables */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/commissions" className="block">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-[#B4432E]/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#B4432E]/10 flex items-center justify-center text-2xl">🏛️</div>
              <div className="flex-1 min-w-0">
                <p className="text-3xl font-bold text-[#1A1A1A]">{commissionsVisibles.length}</p>
                <p className="text-sm text-gray-500">Commissions</p>
              </div>
              <span className="text-gray-300 group-hover:text-[#B4432E] transition-colors text-lg">→</span>
            </div>
          </div>
        </Link>

        <Link href="/calendrier" className="block">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-[#B4432E]/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl">📅</div>
              <div className="flex-1 min-w-0">
                <p className="text-3xl font-bold text-[#1A1A1A]">{allProchainesReunions.length}</p>
                <p className="text-sm text-gray-500">Prochaines réunions</p>
              </div>
              <span className="text-gray-300 group-hover:text-[#B4432E] transition-colors text-lg">→</span>
            </div>
          </div>
        </Link>

        <Link href="/notes" className="block">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-[#B4432E]/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#5FAF5A]/10 flex items-center justify-center text-2xl">📝</div>
              <div className="flex-1 min-w-0">
                <p className="text-3xl font-bold text-[#1A1A1A]">{comptesRendusValides}</p>
                <p className="text-sm text-gray-500">Comptes rendus validés</p>
              </div>
              <span className="text-gray-300 group-hover:text-[#B4432E] transition-colors text-lg">→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* LIGNE 2 — Prochaines réunions pleine largeur */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Prochaines réunions</h2>
          <Link href="/calendrier" className="text-sm text-[#B4432E] hover:underline font-medium">
            Calendrier →
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {prochainesReunions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-gray-400 text-sm">Aucune réunion programmée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {prochainesReunions.map(r => {
                const commission = commissions.find(c => c.id === r.commissionId)
                const borderColor = commissionColors[r.commissionId] ?? "#E0E0E0"
                const [rYear, rMonth, rDay] = r.date.split("-").map(Number)
                return (
                  <div key={r.id} className="flex items-stretch p-5">
                    <div className="w-1 rounded-full shrink-0 mr-4" style={{ backgroundColor: borderColor }} />
                    <div className="min-w-0">
                      {r.titre && (
                        <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">{r.titre}</p>
                      )}
                      <p className={`leading-snug ${r.titre ? "text-xs text-gray-500 mt-0.5" : "text-sm font-semibold text-[#1A1A1A]"}`}>
                        {commission?.nom ?? "—"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        {String(rDay).padStart(2, "0")}/{String(rMonth).padStart(2, "0")}/{rYear} à {r.heure}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {r.lieu}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
