"use client"

import { useApp } from "@/lib/app-context"

export default function FirebaseLoadingGuard({ children }: { children: React.ReactNode }) {
  const { loading, loadingMessage, connexionEchouee } = useApp()

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

  return (
    <>
      {children}
      {connexionEchouee && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-gray-900/85 text-white text-xs rounded-full shadow-lg backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
          Reconnexion en cours…
        </div>
      )}
    </>
  )
}
