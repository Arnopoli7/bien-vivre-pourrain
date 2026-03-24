"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { formatDate, getFileColorClass } from "@/lib/utils"
import Link from "next/link"

export default function SearchPage() {
  const { commissions, documents, aCommissionAcces } = useApp()
  const [query, setQuery] = useState("")

  const documentsAccessibles = documents.filter(d => aCommissionAcces(d.commissionId))

  const results = query.trim().length < 2 ? [] : documentsAccessibles.filter(doc => {
    const q = query.toLowerCase()
    const commission = commissions.find(c => c.id === doc.commissionId)
    return (
      doc.titre.toLowerCase().includes(q) ||
      (commission?.nom.toLowerCase().includes(q) ?? false) ||
      doc.auteur.toLowerCase().includes(q) ||
      doc.fichiers.some(f => f.nom.toLowerCase().includes(q))
    )
  })

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#B4432E] mb-2">Recherche</h1>
        <p className="text-sm text-gray-500">
          Recherchez dans les titres, commissions, noms de fichiers et auteurs
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un document, une commission…"
          autoFocus
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E] shadow-sm bg-white text-[#1A1A1A] placeholder-gray-400 text-base"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      {query.trim().length >= 2 && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {results.length} résultat{results.length !== 1 ? "s" : ""} pour « {query} »
          </p>
          {results.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-12 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-gray-500 text-sm">Aucun résultat trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(doc => {
                const commission = commissions.find(c => c.id === doc.commissionId)
                return (
                  <Link key={doc.id} href={`/commissions/${doc.commissionId}`}>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-[#F2C94C] hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#1A1A1A] text-sm mb-1">{doc.titre}</h3>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                              {commission?.nom}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(doc.date)}</span>
                            <span className="text-xs text-gray-400">par {doc.auteur}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.fichiers.map((f, i) => (
                              <span
                                key={i}
                                className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getFileColorClass(f.type)}`}
                              >
                                {f.nom}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-[#B4432E] shrink-0">→</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {query.trim().length < 2 && (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-500 text-sm">Commencez à taper pour rechercher dans les documents</p>
        </div>
      )}
    </div>
  )
}
