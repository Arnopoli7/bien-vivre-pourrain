"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import DocumentCard from "@/components/ui/DocumentCard"
import AjouterDocumentModal from "@/components/ui/AjouterDocumentModal"

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]

export default function DocumentsPage() {
  const { commissions, documents, aCommissionAcces } = useApp()
  const [filterCommission, setFilterCommission] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [modalOuvert, setModalOuvert] = useState(false)

  const commissionsVisibles = commissions.filter(c => aCommissionAcces(c.id))
  const documentsAccessibles = documents.filter(d => aCommissionAcces(d.commissionId))

  const filtered = documentsAccessibles.filter(doc => {
    const matchCommission = !filterCommission || doc.commissionId === filterCommission
    const matchYear = !filterYear || doc.annee === parseInt(filterYear)
    return matchCommission && matchYear
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#B4432E]">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            {filtered.length !== documentsAccessibles.length && ` (sur ${documentsAccessibles.length})`}
          </p>
        </div>
        <button
          onClick={() => setModalOuvert(true)}
          className="flex items-center gap-2 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <span>+</span>
          Ajouter un document
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Commission :</label>
          <select
            value={filterCommission}
            onChange={(e) => setFilterCommission(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E] min-w-[200px]"
          >
            <option value="">Toutes</option>
            {commissionsVisibles.map(c => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Année :</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
          >
            <option value="">Toutes</option>
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {(filterCommission || filterYear) && (
          <button
            onClick={() => { setFilterCommission(""); setFilterYear("") }}
            className="text-sm text-gray-500 hover:text-[#B4432E] underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500 text-sm">
              {documentsAccessibles.length === 0
                ? "Aucun document. Cliquez sur « Ajouter un document » pour commencer."
                : "Aucun document ne correspond aux filtres"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Titre & fichiers</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Auteur</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <DocumentCard key={doc.id} document={doc} showCommission={true} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOuvert && (
        <AjouterDocumentModal onClose={() => setModalOuvert(false)} />
      )}
    </div>
  )
}
