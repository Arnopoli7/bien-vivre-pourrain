"use client"

import { useRouter } from "next/navigation"
import { useApp } from "@/lib/app-context"

const roleLabels: Record<string, string> = {
  maire:      "Maire",
  adjoint:    "Adjoint au Maire",
  conseiller: "Conseiller Municipal",
}

const roleBadgeColors: Record<string, string> = {
  maire:      "bg-[#B4432E] text-white",
  adjoint:    "bg-[#F2C94C] text-black",
  conseiller: "bg-[#5FAF5A] text-white",
}

export default function Navbar() {
  const router = useRouter()
  const { currentUser } = useApp()

  return (
    <header className="h-16 bg-white border-b-2 border-[#F2C94C] flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-gray-500">
          Commune de Pourrain — Yonne (89)
        </h2>
      </div>
      <div className="flex items-center gap-4">
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#B4432E] flex items-center justify-center text-white text-sm font-bold">
              {currentUser.nom.charAt(0)}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{currentUser.nom}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleBadgeColors[currentUser.role]}`}>
                  {roleLabels[currentUser.role]}
                </span>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            localStorage.removeItem("bvap_session")
            localStorage.removeItem("bvap_user_id")
            router.push("/login")
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </header>
  )
}
