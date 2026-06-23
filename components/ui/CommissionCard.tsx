"use client"

import Link from "next/link"
import type { Commission } from "@/types"
import { useApp } from "@/lib/app-context"
import { commissionColors } from "@/lib/commission-colors"
import { commissionEmojis } from "@/lib/commission-emojis"
import { formatDate } from "@/lib/utils"

interface CommissionCardProps {
  commission: Commission
}

export default function CommissionCard({ commission }: CommissionCardProps) {
  const { documents, estRestreinte, mettreALaCorbeille, peutSupprimer } = useApp()
  const restreinte = estRestreinte(commission.id)
  const commissionDocs = documents.filter(d => d.commissionId === commission.id)
  const lastDoc = [...commissionDocs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0]
  const bgColor = commissionColors[commission.id] ?? "#FFFFFF"
  const peutSupprimerCommission = peutSupprimer("commission")

  function handleCorbeille(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (commissionDocs.length === 0) {
      alert("Cette commission ne contient aucun document.")
      return
    }
    if (window.confirm(`Voulez-vous mettre tous les documents de cette commission à la corbeille ?`)) {
      mettreALaCorbeille(commissionDocs.map(d => d.id))
    }
  }

  return (
    <Link href={`/commissions/${commission.id}`} className="block">
      <div
        className="rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-[#B4432E]/20 transition-all cursor-pointer group"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: bgColor, filter: "brightness(0.91)" }}
          >
            <span
              className="text-[28px] sm:text-[32px] leading-none select-none"
              role="img"
              aria-label={commission.nom}
            >
              {commissionEmojis[commission.id] ?? commission.nom.charAt(0)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {restreinte && (
              <span title="Accès restreint" className="text-[#B4432E] text-sm leading-none">🔒</span>
            )}
            {peutSupprimerCommission && (
              <button
                onClick={handleCorbeille}
                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Mettre tous les documents à la corbeille"
              >🗑️</button>
            )}
            <span className="text-gray-400 group-hover:text-[#B4432E] transition-colors text-lg">→</span>
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-3 min-h-[36px]">
          {commission.nom}
        </h3>
        {lastDoc && (
          <p className="text-[11px] text-gray-400 mt-2">
            Dernier : {formatDate(lastDoc.date)}
          </p>
        )}
      </div>
    </Link>
  )
}
