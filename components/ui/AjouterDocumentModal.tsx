"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import type { Document, Fichier } from "@/types"
import { uploadFichier } from "@/lib/supabase-storage"

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]
const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]
const FORMATS_ACCEPTES = [".doc", ".docx", ".pdf", ".xls", ".xlsx"]
const TAILLE_MAX: Record<string, number> = {
  ".pdf": 20 * 1024 * 1024,
  ".doc": 10 * 1024 * 1024,
  ".docx": 10 * 1024 * 1024,
  ".xls": 10 * 1024 * 1024,
  ".xlsx": 10 * 1024 * 1024,
}

interface Props {
  onClose: () => void
  commissionId?: string
  annee?: number
  mois?: number
  onSuccess?: (annee: number, mois: number) => void
}

export default function AjouterDocumentModal({ onClose, commissionId, annee, mois, onSuccess }: Props) {
  const { currentUser, commissions, ajouterDocument } = useApp()
  const today = new Date()

  const [titre, setTitre] = useState("")
  const [date, setDate] = useState(today.toISOString().slice(0, 10))
  const [selectedCommission, setSelectedCommission] = useState(commissionId ?? commissions[0]?.id ?? "")
  const [selectedYear, setSelectedYear] = useState(annee ?? today.getFullYear())
  const [selectedMois, setSelectedMois] = useState(mois ?? today.getMonth() + 1)
  const [fichiers, setFichiers] = useState<FileList | null>(null)
  const [erreur, setErreur] = useState("")
  const [progression, setProgression] = useState<{ actuel: number; total: number } | null>(null)

  function handleFichiersChange(e: React.ChangeEvent<HTMLInputElement>) {
    setErreur("")
    const files = e.target.files
    if (files) {
      for (const file of Array.from(files)) {
        const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "")
        if (!FORMATS_ACCEPTES.includes(ext)) {
          setErreur("Format non accepté.\nFormats autorisés : PDF, Word (.docx), Excel (.xlsx)")
          e.target.value = ""
          setFichiers(null)
          return
        }
        const tailleMax = TAILLE_MAX[ext]
        if (tailleMax && file.size > tailleMax) {
          setErreur("Fichier trop volumineux.\nTaille maximale : PDF 20 Mo, Word 10 Mo, Excel 10 Mo")
          e.target.value = ""
          setFichiers(null)
          return
        }
      }
    }
    setFichiers(files)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titre.trim()) { setErreur("Le titre est obligatoire."); return }
    if (!date) { setErreur("La date est obligatoire."); return }

    const liste = fichiers ? Array.from(fichiers) : []

    if (liste.length > 0) setProgression({ actuel: 0, total: liste.length })

    const fichiersData: Fichier[] = []
    for (let i = 0; i < liste.length; i++) {
      const f = liste[i]
      setProgression({ actuel: i, total: liste.length })
      try {
        const result = await uploadFichier(f)
        fichiersData.push({
          nom: f.name,
          type: f.type || f.name.split(".").pop()?.toLowerCase() || "fichier",
          taille: f.size,
          ...result,
        })
      } catch (err) {
        setErreur(err instanceof Error ? err.message : `Erreur lors de l'upload de ${f.name}`)
        setProgression(null)
        return
      }
    }

    setProgression(null)

    const newDoc: Document = {
      id: `d-${Date.now()}`,
      titre: titre.trim(),
      commissionId: selectedCommission,
      annee: selectedYear,
      mois: selectedMois,
      date,
      auteur: currentUser?.nom ?? "",
      fichiers: fichiersData,
    }

    ajouterDocument(newDoc)

    // Notification email (best-effort, sans bloquer la fermeture)
    const commission = commissions.find(c => c.id === selectedCommission)
    console.log("Appel notify...")
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "document",
        titre: newDoc.titre,
        commission: commission?.nom ?? "",
        date: newDoc.date,
        auteur: newDoc.auteur,
      }),
    }).catch(console.error)

    onSuccess?.(selectedYear, selectedMois)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Ajouter un document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre</label>
            <input
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              placeholder="Ex : Compte rendu — Commission finances"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
            />
          </div>

          {/* Date + Année + Mois */}
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

          {/* Commission - masquée si commissionId fourni */}
          {!commissionId && (
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
          )}

          {/* Fichiers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fichiers joints
            </label>
            <input
              type="file"
              multiple
              accept=".doc,.docx,.pdf,.xls,.xlsx"
              onChange={handleFichiersChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#B4432E]/10 file:text-[#B4432E] hover:file:bg-[#B4432E]/20"
            />
            <p className="mt-1.5 text-xs text-gray-400">Formats : PDF (20 Mo max), Word (10 Mo max), Excel (10 Mo max)</p>
          </div>

          {/* Barre de progression */}
          {progression && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                Envoi du fichier {progression.actuel + 1} sur {progression.total}…
              </p>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B4432E] transition-all duration-300"
                  style={{ width: `${Math.round((progression.actuel / progression.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {erreur && <p className="text-sm text-[#B4432E]" style={{ whiteSpace: "pre-line" }}>{erreur}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={!!progression}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!!progression}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#B4432E] hover:bg-[#8B3222] rounded-xl transition-colors disabled:opacity-50"
            >
              {progression ? "Envoi en cours…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
