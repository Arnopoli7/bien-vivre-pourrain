"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { getUserByCredentials } from "@/lib/firebase/firestore"
import { useApp } from "@/lib/app-context"

export default function LoginPage() {
  const router = useRouter()
  const { loginUser } = useApp()
  const [identifiant, setIdentifiant] = useState("")
  const [password, setPassword] = useState("")
  const [erreur, setErreur] = useState("")
  const [chargement, setChargement] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChargement(true)
    setErreur("")
    try {
      const user = await getUserByCredentials(identifiant.trim(), password)
      if (user) {
        localStorage.setItem("bvap_session", "true")
        loginUser(user)
        router.push("/dashboard")
      } else {
        setErreur("Identifiant ou mot de passe incorrect")
      }
    } catch {
      setErreur("Erreur de connexion. Vérifiez votre connexion internet.")
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.jpg"
            alt="Bien Vivre à Pourrain"
            width={200}
            height={80}
            style={{ maxWidth: "200px", height: "auto", background: "transparent" }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">Portail des commissions municipales</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-[#B4432E] p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Connexion</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Identifiant
            </label>
            <input
              type="text"
              value={identifiant}
              onChange={(e) => { setIdentifiant(e.target.value); setErreur("") }}
              placeholder="ex : PierreM"
              autoComplete="username"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErreur("") }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E] transition-colors"
            />
          </div>
          {erreur && (
            <p className="text-sm text-[#B4432E] font-medium">{erreur}</p>
          )}
          <button
            type="submit"
            disabled={chargement}
            className="w-full bg-[#B4432E] hover:bg-[#8B3222] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl transition-colors mt-2"
          >
            {chargement ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">
          Accès réservé aux élus municipaux
        </p>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Commune de Pourrain — Yonne (89)
      </p>
    </div>
  )
}
