"use client"

import { useState } from "react"
import { notFound } from "next/navigation"
import { useApp } from "@/lib/app-context"
import DocumentCard from "@/components/ui/DocumentCard"
import AjouterDocumentModal from "@/components/ui/AjouterDocumentModal"
import { getMembresCommission } from "@/lib/commission-membres"
import { COMMISSION_COMCOM_ID, SOUS_DOSSIERS_COMCOM } from "@/lib/sous-dossiers-comcom"
import { rangerCompteRenduSousDossier } from "@/lib/firebase/firestore"

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]
const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

interface PageProps {
  params: { id: string }
}

export default function CommissionDetailPage({ params }: PageProps) {
  const { currentUser, commissions, documents, mettreALaCorbeille, peutSupprimer, modifierDocument } = useApp()
  const commission = commissions.find(c => c.id === params.id)
  if (!commission) notFound()
  const membresCommission = getMembresCommission(params.id)
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMois, setSelectedMois] = useState<number | null>(null)
  const [modalOuvert, setModalOuvert] = useState(false)
  const [selectedSousDossier, setSelectedSousDossier] = useState<string | null>(null)
  const [rangerMap, setRangerMap] = useState<Record<string, string>>({})
  const [rangerEnCours, setRangerEnCours] = useState<string | null>(null)

  const isComCom = params.id === COMMISSION_COMCOM_ID

  const peutSupprimerMois = peutSupprimer("mois")
  const peutSupprimerAnnee = peutSupprimer("annee")

  const canWrite = currentUser?.role === "maire" || currentUser?.role === "adjoint" || currentUser?.role === "secretaire"

  // Docs filtrés selon le contexte
  const docsCommission = isComCom
    ? selectedSousDossier
      ? documents.filter(d => d.commissionId === params.id && d.sousDossier === selectedSousDossier)
      : []
    : documents.filter(d => d.commissionId === params.id)

  const docsAnnee = docsCommission.filter(d => d.annee === selectedYear)

  const countParMois = Array.from({ length: 12 }, (_, i) =>
    docsAnnee.filter(d => d.mois === i + 1).length
  )

  const docsMois = selectedMois !== null
    ? docsAnnee.filter(d => d.mois === selectedMois)
    : []

  function handleSuccess(annee: number, mois: number) {
    setSelectedYear(annee)
    setSelectedMois(mois)
  }

  function handleCorbeilleAnnee(annee: number) {
    const docs = docsCommission.filter(d => d.annee === annee)
    if (docs.length === 0) return
    if (window.confirm(`Voulez-vous mettre tous les documents de l'année ${annee} à la corbeille ?`)) {
      mettreALaCorbeille(docs.map(d => d.id))
      if (selectedYear === annee) setSelectedMois(null)
    }
  }

  function handleCorbeilleMois(mois: number) {
    const docs = docsAnnee.filter(d => d.mois === mois)
    if (docs.length === 0) return
    if (window.confirm(`Voulez-vous mettre tous les documents de ce mois à la corbeille ?`)) {
      mettreALaCorbeille(docs.map(d => d.id))
      setSelectedMois(null)
    }
  }

  const docsAClasser = isComCom
    ? documents.filter(d => d.commissionId === params.id && !d.sousDossier)
    : []

  async function handleRanger(doc: import("@/types").Document) {
    const sousDossierId = rangerMap[doc.id]
    if (!sousDossierId) return
    setRangerEnCours(doc.id)
    modifierDocument({ ...doc, sousDossier: sousDossierId })
    if (doc.type === "compte_rendu" && doc.compteRenduId) {
      await rangerCompteRenduSousDossier(doc.compteRenduId, sousDossierId).catch(console.error)
    }
    setRangerEnCours(null)
  }

  const sousDossierCourant = selectedSousDossier
    ? SOUS_DOSSIERS_COMCOM.find(sd => sd.id === selectedSousDossier)
    : null
  const sousDossierLabel = sousDossierCourant?.nom ?? ""
  const sousDossierEmoji = sousDossierCourant?.emoji ?? "📁"

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Commission</p>
          <h1 className="text-2xl font-bold text-[#B4432E]">{commission.nom}</h1>
          {isComCom && selectedSousDossier && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="mr-1">{sousDossierEmoji}</span>{sousDossierLabel}
            </p>
          )}
        </div>
        {canWrite && (!isComCom || selectedSousDossier !== null) && (
          <button
            onClick={() => setModalOuvert(true)}
            className="flex items-center gap-2 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <span>+</span>
            Ajouter un document
          </button>
        )}
      </div>

      {/* Members */}
      {membresCommission.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">⭐</span>
            <h2 className="text-sm font-semibold text-gray-700">Membres de la commission</h2>
            <span className="ml-auto text-xs text-gray-400">{membresCommission.length} membre{membresCommission.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {membresCommission.map(nom => (
              <span key={nom} className="text-xs px-2.5 py-1 bg-green-50 text-green-800 border border-green-200 rounded-full font-medium">
                {nom}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ComCom : grille des sous-dossiers */}
      {isComCom && selectedSousDossier === null && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
            Commissions thématiques
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SOUS_DOSSIERS_COMCOM.map(sd => {
              const n = documents.filter(d => d.commissionId === params.id && d.sousDossier === sd.id).length
              return (
                <button
                  key={sd.id}
                  onClick={() => { setSelectedSousDossier(sd.id); setSelectedMois(null) }}
                  className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#B4432E]/40 hover:bg-[#FFF8E8] transition-all text-left group"
                >
                  <span className="text-xl mt-0.5 shrink-0">{sd.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-[#B4432E] leading-snug">{sd.nom}</p>
                    <p className="text-xs text-gray-400 mt-1">{n} document{n !== 1 ? "s" : ""}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ComCom : documents sans sous-dossier à classer */}
      {isComCom && selectedSousDossier === null && docsAClasser.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-200 flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <h2 className="text-sm font-semibold text-amber-800">
              À classer — {docsAClasser.length} document{docsAClasser.length !== 1 ? "s" : ""} sans sous-dossier
            </h2>
          </div>
          <div className="divide-y divide-amber-100">
            {docsAClasser.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
                <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">{doc.titre}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">{doc.date}</span>
                <select
                  value={rangerMap[doc.id] ?? ""}
                  onChange={e => setRangerMap(prev => ({ ...prev, [doc.id]: e.target.value }))}
                  className="text-sm px-3 py-1.5 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
                >
                  <option value="">— Choisir un sous-dossier —</option>
                  {SOUS_DOSSIERS_COMCOM.map(sd => (
                    <option key={sd.id} value={sd.id}>{sd.nom}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleRanger(doc)}
                  disabled={!rangerMap[doc.id] || rangerEnCours === doc.id}
                  className="text-sm px-3 py-1.5 rounded-lg bg-[#B4432E] hover:bg-[#8B3222] text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {rangerEnCours === doc.id ? "…" : "Ranger"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vue année/mois/documents — pour les autres commissions OU dans un sous-dossier comcom */}
      {(!isComCom || selectedSousDossier !== null) && (
        <>
          {/* Bouton retour (comcom seulement) */}
          {isComCom && (
            <button
              onClick={() => { setSelectedSousDossier(null); setSelectedMois(null) }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#B4432E] transition-colors"
            >
              ← Retour aux commissions thématiques
            </button>
          )}

          {/* Onglets années */}
          <div className="flex items-center gap-2 flex-wrap">
            {YEARS.map(year => {
              const n = docsCommission.filter(d => d.annee === year).length
              return (
                <div key={year} className="relative group">
                  <button
                    onClick={() => { setSelectedYear(year); setSelectedMois(null) }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedYear === year
                        ? "bg-[#B4432E] text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-[#B4432E]/30 hover:text-[#B4432E]"
                    }`}
                  >
                    {year}
                    {n > 0 && (
                      <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                        selectedYear === year ? "bg-white/20 text-white" : "bg-[#B4432E]/10 text-[#B4432E]"
                      }`}>
                        {n}
                      </span>
                    )}
                  </button>
                  {peutSupprimerAnnee && n > 0 && (
                    <button
                      onClick={() => handleCorbeilleAnnee(year)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-100 hover:bg-red-200 text-red-500 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title={`Mettre l'année ${year} à la corbeille`}
                    >×</button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Grille des mois */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              {selectedYear} — Sélectionnez un mois
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {MOIS_FR.map((moisLabel, i) => {
                const moisNum = i + 1
                const n = countParMois[i]
                const isActive = selectedMois === moisNum
                return (
                  <div key={moisNum} className="relative group">
                    <button
                      onClick={() => setSelectedMois(isActive ? null : moisNum)}
                      className={`w-full flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-sm font-medium ${
                        isActive
                          ? "bg-[#FFF8E8] border-[#F2C94C] text-[#B4432E]"
                          : n > 0
                            ? "bg-white border-gray-200 text-gray-800 hover:border-[#F2C94C] hover:bg-[#FFF8E8]"
                            : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      <span>{moisLabel}</span>
                      <span className={`mt-1 text-[10px] font-semibold rounded-full px-1.5 ${
                        n > 0 ? "text-[#B4432E] bg-[#B4432E]/10" : "text-gray-400"
                      }`}>
                        {n} doc{n !== 1 ? "s" : ""}
                      </span>
                    </button>
                    {peutSupprimerMois && n > 0 && (
                      <button
                        onClick={() => handleCorbeilleMois(moisNum)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-100 hover:bg-red-200 text-red-500 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title={`Mettre ${moisLabel} à la corbeille`}
                      >×</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Documents du mois sélectionné */}
          {selectedMois !== null && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-[#1A1A1A]">
                  {MOIS_FR[selectedMois - 1]} {selectedYear}
                </h2>
                <span className="text-sm text-gray-500">
                  {docsMois.length} document{docsMois.length !== 1 ? "s" : ""}
                </span>
              </div>
              {docsMois.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-500 text-sm">
                    Aucun document pour {MOIS_FR[selectedMois - 1]} {selectedYear}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Titre & fichiers</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Auteur</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docsMois.map(doc => (
                        <DocumentCard key={doc.id} document={doc} showCommission={false} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalOuvert && (
        <AjouterDocumentModal
          onClose={() => setModalOuvert(false)}
          commissionId={params.id}
          annee={selectedYear}
          mois={selectedMois ?? new Date().getMonth() + 1}
          sousDossierId={selectedSousDossier ?? undefined}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
