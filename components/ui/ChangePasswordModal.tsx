"use client"

import { useState } from "react"
import type { User } from "@/types"

interface Props {
  user: User
  onClose: () => void
  onUpdate: (user: User) => void
}

export default function ChangePasswordModal({ user, onClose, onUpdate }: Props) {
  const [mode, setMode] = useState<"choix" | "changer">("choix")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [erreur, setErreur] = useState("")

  function handleKeep() {
    onUpdate({ ...user, motDePasseTemporaire: false })
    onClose()
  }

  function handleChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setErreur("Le mot de passe doit comporter au moins 6 caractères.")
      return
    }
    if (newPassword !== confirm) {
      setErreur("Les mots de passe ne correspondent pas.")
      return
    }
    onUpdate({ ...user, motDePasse: newPassword, motDePasseTemporaire: false })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 p-8">
        {mode === "choix" ? (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔑</div>
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Mot de passe temporaire</h2>
              <p className="text-sm text-gray-500 mt-2">
                Votre mot de passe actuel est temporaire (<span className="font-mono font-medium">Pourrain2026!</span>).
                Souhaitez-vous le conserver ou en choisir un nouveau ?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setMode("changer")}
                className="w-full bg-[#B4432E] hover:bg-[#8B3222] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
              >
                Changer mon mot de passe
              </button>
              <button
                onClick={handleKeep}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-colors"
              >
                Garder ce mot de passe
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => { setMode("choix"); setErreur("") }}
              className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
            >
              ← Retour
            </button>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-5">Nouveau mot de passe</h2>
            <form onSubmit={handleChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErreur("") }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setErreur("") }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E] transition-colors"
                />
              </div>
              {erreur && <p className="text-sm text-[#B4432E] font-medium">{erreur}</p>}
              <button
                type="submit"
                className="w-full bg-[#B4432E] hover:bg-[#8B3222] text-white font-semibold py-2.5 px-4 rounded-xl transition-colors mt-2"
              >
                Enregistrer
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
