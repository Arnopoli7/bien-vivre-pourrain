"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/app-context"
import { lireComptesRendus, supprimerCompteRendu } from "@/lib/comptes-rendus"
import type { CompteRendu } from "@/types"
import { deleteDocument } from "@/lib/firebase/firestore"

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

export default function NotesPage() {
  const { currentUser, commissions } = useApp()
  const router = useRouter()
  const [crs, setCrs] = useState<CompteRendu[]>([])

  const canWrite = currentUser?.role === "maire" || currentUser?.role === "adjoint"

  useEffect(() => {
    lireComptesRendus().then(setCrs)
  }, [])

  // Conseillers : accès refusé (après tous les hooks)
  if (currentUser && currentUser.role === "conseiller") {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Accès restreint</h2>
        <p className="text-gray-500 text-sm">
          Les comptes rendus sont accessibles aux adjoints et au maire uniquement.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 px-5 py-2.5 bg-[#B4432E] text-white text-sm font-medium rounded-xl hover:bg-[#8B3222] transition-colors"
        >
          Retour au tableau de bord
        </button>
      </div>
    )
  }

  async function handleSupprimer(id: string) {
    if (!window.confirm("Voulez-vous supprimer ce compte rendu ?")) return
    const cr = crs.find(c => c.id === id)
    await supprimerCompteRendu(id)
    if (cr?.statut === "valide") {
      deleteDocument("doc-cr-" + id).catch(console.error)
    }
    setCrs(prev => prev.filter(c => c.id !== id))
  }

  const brouillons = crs.filter(c => c.statut === "brouillon")
  const valides = crs.filter(c => c.statut === "valide")

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#B4432E]">Comptes rendus</h1>
          <p className="text-sm text-gray-500 mt-1">
            {crs.length} compte{crs.length !== 1 ? "s" : ""} rendu{crs.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canWrite && (
          <Link
            href="/notes/nouveau"
            className="flex items-center gap-2 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <span>+</span>
            Nouveau compte rendu
          </Link>
        )}
      </div>

      {crs.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-20 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm mb-4">Aucun compte rendu pour l'instant.</p>
          {canWrite && (
            <Link
              href="/notes/nouveau"
              className="inline-flex items-center gap-2 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              + Nouveau compte rendu
            </Link>
          )}
        </div>
      )}

      {/* Brouillons */}
      {brouillons.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
              Brouillon
            </span>
            <span className="text-sm text-gray-500">{brouillons.length} document{brouillons.length !== 1 ? "s" : ""}</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rédigé par</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brouillons.map(cr => (
                <CRRow key={cr.id} cr={cr} commissions={commissions} onSupprimer={canWrite ? handleSupprimer : undefined} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Validés */}
      {valides.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              Validé
            </span>
            <span className="text-sm text-gray-500">{valides.length} document{valides.length !== 1 ? "s" : ""}</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rédigé par</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {valides.map(cr => (
                <CRRow key={cr.id} cr={cr} commissions={commissions} onSupprimer={canWrite ? handleSupprimer : undefined} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CRRow({ cr, commissions, onSupprimer }: { cr: CompteRendu; commissions: { id: string; nom: string }[]; onSupprimer?: (id: string) => void }) {
  const commission = commissions.find(c => c.id === cr.commissionId)
  const dateLabel = `${cr.date.slice(8, 10)}/${cr.date.slice(5, 7)}/${cr.date.slice(0, 4)}`
  const periode = `${MOIS_FR[cr.mois - 1]} ${cr.annee}`

  return (
    <tr className="border-b border-gray-100 hover:bg-[#FAF8F5] transition-colors">
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-[#1A1A1A]">{cr.titre ?? "Sans titre"}</p>
        <p className="text-xs text-gray-400">{commission?.nom ?? "—"} — {periode}</p>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">{dateLabel}</td>
      <td className="py-3 px-4 text-sm text-gray-500">{cr.redacteur}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/notes/${cr.id}`}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            {cr.statut === "brouillon" ? "Modifier" : "Consulter"}
          </Link>
          {onSupprimer && (
            <button
              onClick={() => onSupprimer(cr.id)}
              className="p-1.5 text-gray-400 hover:text-[#B4432E] hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              🗑️
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
