"use client"

import { useApp } from "@/lib/app-context"

export default function FirebaseLoadingGuard({ children }: { children: React.ReactNode }) {
  const { loading, loadingMessage, error } = useApp()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-4xl mb-4 animate-pulse">⏳</p>
          <p className="text-gray-500 text-sm font-medium">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md px-4">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-600 font-semibold text-lg mb-2">Erreur de connexion</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#B4432E] text-white text-sm font-medium rounded-xl hover:bg-[#8B3222] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
