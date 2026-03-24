"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import CompteRenduForm from "@/components/ui/CompteRenduForm"

export default function NouveauCompteRenduPage() {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <Link
          href="/notes"
          className="text-sm text-gray-500 hover:text-[#B4432E] inline-flex items-center gap-1 mb-3"
        >
          ← Retour aux comptes rendus
        </Link>
        <h1 className="text-2xl font-bold text-[#B4432E]">Nouveau compte rendu</h1>
      </div>

      <CompteRenduForm
        onSaved={(_id, _statut) => router.push("/notes")}
      />
    </div>
  )
}
