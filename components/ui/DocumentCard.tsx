"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import type { Document, Fichier } from "@/types"
import { useApp } from "@/lib/app-context"
import { formatDate, formatFileSize, getFileColorClass } from "@/lib/utils"
import BoutonTelechargement, { telechargerFichier } from "@/components/ui/BoutonTelechargement"

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]
const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

interface ModifierModalProps {
  document: Document
  onClose: () => void
  onSave: (doc: Document) => void
}

function ModifierDocumentModal({ document: doc, onClose, onSave }: ModifierModalProps) {
  const { currentUser, commissions } = useApp()
  const [titre, setTitre] = useState(doc.titre)
  const [date, setDate] = useState(doc.date)
  const [selectedCommission, setSelectedCommission] = useState(doc.commissionId)
  const [selectedYear, setSelectedYear] = useState(doc.annee)
  const [selectedMois, setSelectedMois] = useState(doc.mois)
  const [erreur, setErreur] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titre.trim()) { setErreur("Le titre est obligatoire."); return }
    onSave({
      ...doc,
      titre: titre.trim(),
      date,
      commissionId: selectedCommission,
      annee: selectedYear,
      mois: selectedMois,
      auteur: currentUser?.nom ?? doc.auteur,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Modifier le document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre</label>
            <input
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mois</label>
              <select
                value={selectedMois}
                onChange={e => setSelectedMois(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
              >
                {MOIS_FR.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Année</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Commission</label>
            <select
              value={selectedCommission}
              onChange={e => setSelectedCommission(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
            >
              {commissions.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400">Les fichiers joints ne peuvent pas être modifiés ici.</p>
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

interface DocumentCardProps {
  document: Document
  showCommission?: boolean
}

function ConfirmCorbeilleModal({ titre, onConfirm, onCancel }: {
  titre: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-xl shrink-0">🗑️</div>
          <h2 className="text-base font-semibold text-[#1A1A1A]">Mettre à la corbeille</h2>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Voulez-vous mettre ce document à la corbeille ?
        </p>
        <p className="text-sm font-medium text-[#1A1A1A] mb-5 truncate">« {titre} »</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
          >
            Mettre à la corbeille
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DocumentCard({ document, showCommission = true }: DocumentCardProps) {
  const { commissions, modifierDocument, mettreALaCorbeille, peutSupprimer } = useApp()
  const commission = commissions.find(c => c.id === document.commissionId)
  const [editOuvert, setEditOuvert] = useState(false)
  const [corbeilleOuvert, setCorbeilleOuvert] = useState(false)

  const peutSupprimerDoc = peutSupprimer("document")
  const isCompteRendu = document.type === "compte_rendu"
  const crId = isCompteRendu ? document.id.replace("doc-cr-", "") : null

  function handleCorbeille() {
    mettreALaCorbeille([document.id])
    setCorbeilleOuvert(false)
  }

  function handleTelechargerTous() {
    if (document.fichiers.length === 0) return
    document.fichiers.forEach(f => telechargerFichier(f))
  }

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-[#FAF8F5] transition-colors">
        <td className="py-3 px-4">
          <div>
            <p className="text-sm font-medium text-[#1A1A1A]">{document.titre}</p>
            {isCompteRendu ? (
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded border font-medium bg-green-50 border-green-200 text-green-700">
                  Validé
                </span>
                <span className="text-[10px] text-gray-400">Compte rendu</span>
                {document.nbAnnexes != null && document.nbAnnexes > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded border font-medium bg-blue-50 border-blue-200 text-blue-600">
                    📎 {document.nbAnnexes} annexe{document.nbAnnexes > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {document.fichiers.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => telechargerFichier(f)}
                    title={`Télécharger ${f.nom}`}
                    className={`text-[10px] px-2 py-0.5 rounded border font-medium transition-opacity hover:opacity-70 cursor-pointer ${getFileColorClass(f.type)}`}
                  >
                    {f.type.toUpperCase()} · {formatFileSize(f.taille)} ⬇
                  </button>
                ))}
                {document.fichiers.length === 0 && (
                  <span className="text-[10px] text-gray-400 italic">Aucun fichier joint</span>
                )}
              </div>
            )}
          </div>
        </td>
        {showCommission && (
          <td className="py-3 px-4">
            <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
              {commission?.nom || "—"}
            </span>
          </td>
        )}
        <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">
          {formatDate(document.date)}
        </td>
        <td className="py-3 px-4 text-sm text-gray-500">{document.auteur}</td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-1">
            {isCompteRendu ? (
              <Link
                href={`/notes/${crId}`}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Consulter
              </Link>
            ) : (
              <>
                <BoutonTelechargement onTelecharger={handleTelechargerTous} />
                <button
                  onClick={() => setEditOuvert(true)}
                  className="p-1.5 text-gray-400 hover:text-[#B4432E] hover:bg-[#FAF8F5] rounded-lg transition-colors"
                  title="Modifier"
                >✏️</button>
              </>
            )}
            {peutSupprimerDoc && (
              <button
                onClick={() => setCorbeilleOuvert(true)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Mettre à la corbeille"
              >🗑️</button>
            )}
          </div>
        </td>
      </tr>

      {editOuvert && typeof window !== "undefined" && createPortal(
        <ModifierDocumentModal
          document={document}
          onClose={() => setEditOuvert(false)}
          onSave={(updated) => { modifierDocument(updated); setEditOuvert(false) }}
        />,
        window.document.body
      )}

      {corbeilleOuvert && typeof window !== "undefined" && createPortal(
        <ConfirmCorbeilleModal
          titre={document.titre}
          onConfirm={handleCorbeille}
          onCancel={() => setCorbeilleOuvert(false)}
        />,
        window.document.body
      )}
    </>
  )
}
