"use client"

import { useApp } from "@/lib/app-context"
import CommissionCard from "@/components/ui/CommissionCard"

export default function CommissionsPage() {
  const { commissions, aCommissionAcces } = useApp()
  const commissionsVisibles = commissions.filter(c => aCommissionAcces(c.id))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#B4432E]">Commissions municipales</h1>
          <p className="text-sm text-gray-500 mt-1">
            {commissionsVisibles.length} commission{commissionsVisibles.length !== 1 ? "s" : ""} — Commune de Pourrain
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {commissionsVisibles.map((commission) => (
          <CommissionCard key={commission.id} commission={commission} />
        ))}
      </div>
    </div>
  )
}
