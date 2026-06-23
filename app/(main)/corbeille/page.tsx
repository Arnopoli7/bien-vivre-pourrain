"use client"

import { useApp } from "@/lib/app-context"
import { formatDate } from "@/lib/utils"
import type { Document } from "@/types"

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

type GroupedDocs = Record<string, Record<number, Record<number, Document[]>>>

export default function CorbeillePage() {
  const { currentUser, commissions, corbeilleDocuments, restaurerDocuments, supprimerDefinitivement, viderCorbeille } = useApp()
  const isMaire = currentUser?.role === "maire"
  const canDeleteDefinitively = isMaire

  // Exclure les documents de plus de 30 jours (auto-suppression)
  const today = new Date()
  const docsAffichés = corbeilleDocuments.filter(d => {
    if (!d.dateMiseCorbeille) return true
    const dateMise = new Date(d.dateMiseCorbeille)
    const diffJours = (today.getTime() - dateMise.getTime()) / (1000 * 60 * 60 * 24)
    return diffJours <= 30
  })

  // Grouper par commission > année > mois
  const grouped: GroupedDocs = {}
  for (const doc of docsAffichés) {
    if (!grouped[doc.commissionId]) grouped[doc.commissionId] = {}
    if (!grouped[doc.commissionId][doc.annee]) grouped[doc.commissionId][doc.annee] = {}
    if (!grouped[doc.commissionId][doc.annee][doc.mois]) grouped[doc.commissionId][doc.annee][doc.mois] = []
    grouped[doc.commissionId][doc.annee][doc.mois].push(doc)
  }

  function handleRestorer(id: string) {
    restaurerDocuments([id])
  }

  function handleSupprimerDef(id: string) {
    if (window.confirm("Supprimer définitivement ce document ? Cette action est irréversible.")) {
      supprimerDefinitivement([id])
    }
  }

  function handleVider() {
    if (window.confirm("Vider définitivement toute la corbeille ? Cette action est irréversible.")) {
      viderCorbeille()
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#B4432E]">Corbeille</h1>
          <p className="text-sm text-gray-500 mt-1">
            {docsAffichés.length} document{docsAffichés.length !== 1 ? "s" : ""} —{" "}
            Les éléments sont supprimés automatiquement après 30 jours.
          </p>
        </div>
        {isMaire && docsAffichés.length > 0 && (
          <button
            onClick={handleVider}
            className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            🗑️ Vider la corbeille
          </button>
        )}
      </div>

      {docsAffichés.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">
          <p className="text-4xl mb-3">🗑️</p>
          <p className="text-gray-500 text-sm">La corbeille est vide.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([commissionId, annees]) => {
            const commission = commissions.find(c => c.id === commissionId)
            return (
              <div key={commissionId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Commission header */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <h2 className="font-semibold text-[#1A1A1A] text-sm">
                    {commission?.nom ?? "Commission inconnue"}
                  </h2>
                </div>

                {Object.entries(annees)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([annee, mois]) => (
                    <div key={annee}>
                      {/* Année header */}
                      <div className="px-6 py-2 bg-gray-50/60 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {annee}
                        </span>
                      </div>

                      {Object.entries(mois)
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .map(([moisNum, docs]) => (
                          <div key={moisNum}>
                            {/* Mois header */}
                            <div className="px-6 py-2 border-b border-gray-50">
                              <span className="text-xs font-medium text-gray-400">
                                {MOIS_FR[Number(moisNum) - 1]}
                              </span>
                            </div>

                            {/* Documents */}
                            {docs.map(doc => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between px-6 py-3 border-b border-gray-50 hover:bg-[#FAF8F5] transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                                    {doc.titre}
                                  </p>
                                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    <span className="text-[11px] text-gray-400">{doc.auteur}</span>
                                    {doc.dateMiseCorbeille && (
                                      <span className="text-[11px] text-gray-400">
                                        Mis à la corbeille le {formatDate(doc.dateMiseCorbeille)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4 shrink-0">
                                  <button
                                    onClick={() => handleRestorer(doc.id)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium transition-colors whitespace-nowrap"
                                  >
                                    ↩ Restaurer
                                  </button>
                                  {canDeleteDefinitively && (
                                    <button
                                      onClick={() => handleSupprimerDef(doc.id)}
                                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors whitespace-nowrap"
                                    >
                                      ✕ Supprimer définitivement
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
