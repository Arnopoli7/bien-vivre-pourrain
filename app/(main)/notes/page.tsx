"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useApp } from "@/lib/app-context"
import { lireComptesRendus, supprimerCompteRendu } from "@/lib/comptes-rendus"
import { supprimerDocumentsParCompteRenduId, toggleArchiveCompteRendu } from "@/lib/firebase/firestore"
import type { CompteRendu } from "@/types"
import { getMembresCommission, getSuppleantsCommission, getSuppleantCommissions } from "@/lib/commission-membres"

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function TableHead({ blue = false }: { blue?: boolean }) {
  return (
    <tr className={`border-b ${blue ? "border-blue-50 bg-blue-50/50" : "border-gray-100 bg-gray-50"}`}>
      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rédigé par</th>
      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
    </tr>
  )
}

export default function NotesPage() {
  const { currentUser, commissions, supprimerDocument } = useApp()
  const [crs, setCrs] = useState<CompteRendu[]>([])
  const [vue, setVue] = useState<"principale" | "archives">("principale")

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const isMaire = currentUser?.role === "maire"
  const isAdjoint = currentUser?.role === "adjoint"
  const isRedacteur = currentUser?.role === "redacteur"
  const userNom = currentUser?.nom ?? ""
  const hasSuppleantCommissions = getSuppleantCommissions(userNom).length > 0
  const canWrite = isMaire || isAdjoint || hasSuppleantCommissions || isRedacteur

  const REUNION_MA_ID = "20"
  const MEMBRES_REUNION_MA = ["Pierre Maison", "Pascal Bellanger", "Anne Virtel", "Arnaud Poli"]

  useEffect(() => {
    lireComptesRendus().then(async (data) => {
      // Auto-archiver les CRs des mois précédents dont le champ archive n'est pas encore défini
      const toAutoArchive = data.filter(cr =>
        cr.archive == null &&
        (cr.annee < currentYear || (cr.annee === currentYear && cr.mois < currentMonth))
      )
      if (toAutoArchive.length > 0) {
        await Promise.all(toAutoArchive.map(cr => toggleArchiveCompteRendu(cr.id, true)))
        const ids = new Set(toAutoArchive.map(cr => cr.id))
        setCrs(data.map(cr => ids.has(cr.id) ? { ...cr, archive: true } : cr))
      } else {
        setCrs(data)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleArchiver(id: string) {
    await toggleArchiveCompteRendu(id, true)
    setCrs(prev => prev.map(cr => cr.id === id ? { ...cr, archive: true } : cr))
  }

  async function handleRestaurer(id: string) {
    await toggleArchiveCompteRendu(id, false)
    setCrs(prev => prev.map(cr => cr.id === id ? { ...cr, archive: false } : cr))
  }

  async function handleSupprimer(id: string) {
    if (!window.confirm("Voulez-vous supprimer ce compte rendu ?")) return
    await supprimerCompteRendu(id)
    await supprimerDocumentsParCompteRenduId(id)
    supprimerDocument("doc-cr-" + id)
    setCrs(prev => prev.filter(c => c.id !== id))
  }

  function peutVoir(c: CompteRendu): boolean {
    if (c.statut === "brouillon") {
      if (isMaire) return true
      if (isAdjoint) return c.redacteur === userNom
      if (isRedacteur) return c.redacteur === userNom || getMembresCommission(c.commissionId).includes(userNom)
      if (getSuppleantsCommission(c.commissionId).includes(userNom)) return true
      return getMembresCommission(c.commissionId).includes(userNom)
    }
    if (c.statut === "en_attente") {
      if (isMaire) return true
      if (isAdjoint) return c.redacteur === userNom
      if (isRedacteur) return c.redacteur === userNom
      if (getSuppleantsCommission(c.commissionId).includes(userNom)) return c.redacteur === userNom
      return getMembresCommission(c.commissionId).includes(userNom)
    }
    // valide
    if (c.commissionId === REUNION_MA_ID) return MEMBRES_REUNION_MA.includes(userNom)
    return true
  }

  const crsVisibles = crs.filter(peutVoir)
  const principaux = crsVisibles.filter(c => c.archive !== true)
  const archivesList = crsVisibles.filter(c => c.archive === true)

  const brouillons = principaux.filter(c => c.statut === "brouillon")
  const enAttente = principaux.filter(c => c.statut === "en_attente")
  const valides = principaux.filter(c => c.statut === "valide")

  const archivesBrouillons = archivesList.filter(c => c.statut === "brouillon")
  const archivesEnAttente = archivesList.filter(c => c.statut === "en_attente")
  const archivesValides = archivesList.filter(c => c.statut === "valide")

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#B4432E]">Comptes rendus</h1>
          <p className="text-sm text-gray-500 mt-1">
            {vue === "principale"
              ? `${principaux.length} ce mois-ci${archivesList.length > 0 ? ` · ${archivesList.length} archivé${archivesList.length !== 1 ? "s" : ""}` : ""}`
              : `${archivesList.length} archivé${archivesList.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVue(v => v === "principale" ? "archives" : "principale")}
            className={`text-sm font-medium px-4 py-2.5 rounded-xl transition-colors border ${
              vue === "archives"
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {vue === "archives"
              ? "← Liste principale"
              : `Archives${archivesList.length > 0 ? ` (${archivesList.length})` : ""}`}
          </button>
          {canWrite && vue === "principale" && (
            <Link
              href="/notes/nouveau"
              className="flex items-center gap-2 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
            >
              <span>+</span>
              Nouveau compte rendu
            </Link>
          )}
        </div>
      </div>

      {/* ── Vue principale ─────────────────────────────────────────────────── */}
      {vue === "principale" && (
        <>
          {principaux.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-20 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500 text-sm mb-4">Aucun compte rendu ce mois-ci.</p>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><TableHead /></thead>
                  <tbody>
                    {brouillons.map(cr => {
                      const canDeleteThis =
                        isMaire ||
                        isAdjoint ||
                        (isRedacteur && cr.redacteur === userNom) ||
                        (getSuppleantsCommission(cr.commissionId).includes(userNom) && cr.redacteur === userNom)
                      return (
                        <CRRow
                          key={cr.id}
                          cr={cr}
                          commissions={commissions}
                          currentUser={currentUser}
                          onSupprimer={canDeleteThis ? handleSupprimer : undefined}
                          onArchiver={canWrite ? handleArchiver : undefined}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* En attente de validation */}
          {enAttente.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-blue-100 flex items-center gap-2">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  En attente de validation
                </span>
                <span className="text-sm text-gray-500">{enAttente.length} document{enAttente.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><TableHead blue /></thead>
                  <tbody>
                    {enAttente.map(cr => (
                      <CRRow
                        key={cr.id}
                        cr={cr}
                        commissions={commissions}
                        currentUser={currentUser}
                        onSupprimer={isMaire ? handleSupprimer : undefined}
                        onArchiver={canWrite ? handleArchiver : undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><TableHead /></thead>
                  <tbody>
                    {valides.map(cr => (
                      <CRRow
                        key={cr.id}
                        cr={cr}
                        commissions={commissions}
                        currentUser={currentUser}
                        onSupprimer={canWrite ? handleSupprimer : undefined}
                        onArchiver={canWrite ? handleArchiver : undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Vue archives ─────────────────────────────────────────────────────── */}
      {vue === "archives" && (
        <>
          {archivesList.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-20 text-center">
              <p className="text-4xl mb-3">🗂️</p>
              <p className="text-gray-500 text-sm">Aucun compte rendu archivé.</p>
            </div>
          )}

          {archivesBrouillons.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
                  Brouillon
                </span>
                <span className="text-xs text-amber-600 font-medium">· Archivé</span>
                <span className="text-sm text-gray-500">{archivesBrouillons.length} document{archivesBrouillons.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><TableHead /></thead>
                  <tbody>
                    {archivesBrouillons.map(cr => (
                      <CRRow
                        key={cr.id}
                        cr={cr}
                        commissions={commissions}
                        currentUser={currentUser}
                        onRestaurer={canWrite ? handleRestaurer : undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {archivesEnAttente.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-blue-100 flex items-center gap-2">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  En attente
                </span>
                <span className="text-xs text-amber-600 font-medium">· Archivé</span>
                <span className="text-sm text-gray-500">{archivesEnAttente.length} document{archivesEnAttente.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><TableHead blue /></thead>
                  <tbody>
                    {archivesEnAttente.map(cr => (
                      <CRRow
                        key={cr.id}
                        cr={cr}
                        commissions={commissions}
                        currentUser={currentUser}
                        onRestaurer={canWrite ? handleRestaurer : undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {archivesValides.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Validé
                </span>
                <span className="text-xs text-amber-600 font-medium">· Archivé</span>
                <span className="text-sm text-gray-500">{archivesValides.length} document{archivesValides.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><TableHead /></thead>
                  <tbody>
                    {archivesValides.map(cr => (
                      <CRRow
                        key={cr.id}
                        cr={cr}
                        commissions={commissions}
                        currentUser={currentUser}
                        onRestaurer={canWrite ? handleRestaurer : undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CRRow({
  cr,
  commissions,
  currentUser,
  onSupprimer,
  onArchiver,
  onRestaurer,
}: {
  cr: CompteRendu
  commissions: { id: string; nom: string }[]
  currentUser: { id: string; nom: string; role: string } | null
  onSupprimer?: (id: string) => void
  onArchiver?: (id: string) => void
  onRestaurer?: (id: string) => void
}) {
  const commission = commissions.find(c => c.id === cr.commissionId)
  const dateLabel = `${cr.date.slice(8, 10)}/${cr.date.slice(5, 7)}/${cr.date.slice(0, 4)}`
  const periode = `${MOIS_FR[cr.mois - 1]} ${cr.annee}`

  const isSuppleantRedacteur = getSuppleantsCommission(cr.commissionId).includes(cr.redacteur)

  // "Modifier" seulement pour brouillon (pas en_attente, pas valide)
  const canEdit =
    cr.statut === "brouillon" &&
    (currentUser?.role === "maire" ||
      (currentUser?.role === "adjoint" && cr.redacteur === currentUser.nom) ||
      (currentUser?.role === "redacteur" && cr.redacteur === currentUser.nom) ||
      (getSuppleantsCommission(cr.commissionId).includes(currentUser?.nom ?? "") && cr.redacteur === currentUser?.nom))

  const linkLabel = canEdit ? "Modifier" : "Consulter"

  return (
    <tr className="border-b border-gray-100 hover:bg-[#FAF8F5] transition-colors">
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-[#1A1A1A]">{cr.titre ?? "Sans titre"}</p>
        <p className="text-xs text-gray-400">{commission?.nom ?? "—"} — {periode}</p>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">{dateLabel}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-500">{cr.redacteur}</span>
          {isSuppleantRedacteur && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold shrink-0">
              Suppléant
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/notes/${cr.id}`}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            {linkLabel}
          </Link>
          {onRestaurer && (
            <button
              onClick={() => onRestaurer(cr.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium transition-colors"
              title="Restaurer dans la liste principale"
            >
              Restaurer
            </button>
          )}
          {onArchiver && (
            <button
              onClick={() => onArchiver(cr.id)}
              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Archiver"
            >
              🗂️
            </button>
          )}
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
