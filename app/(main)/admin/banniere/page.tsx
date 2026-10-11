"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/app-context"
import { getBanniere, saveBanniere, type BanniereConfig } from "@/lib/firebase/firestore"

const COULEURS: Array<{ id: string; label: string; preview: string }> = [
  { id: "rose",   label: "Rose",   preview: "bg-pink-200" },
  { id: "bleu",   label: "Bleu",   preview: "bg-blue-200" },
  { id: "vert",   label: "Vert",   preview: "bg-green-200" },
  { id: "jaune",  label: "Jaune",  preview: "bg-yellow-200" },
  { id: "rouge",  label: "Rouge",  preview: "bg-red-200" },
  { id: "violet", label: "Violet", preview: "bg-purple-200" },
]

const EMOJIS_RAPIDES = ["🎀", "⚠️", "📢", "ℹ️", "🎉", "🌸", "🔔", "🏛️", "⭐", "❄️"]

export default function BannierePage() {
  const { currentUser } = useApp()
  const isAdmin = currentUser?.identifiant === "ArnaudP"

  const [config, setConfig] = useState<BanniereConfig>({
    active: false,
    texte: "",
    emoji: "🎀",
    couleur: "rose",
  })
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!isAdmin) return
    getBanniere()
      .then(setConfig)
      .catch(console.error)
      .finally(() => setChargement(false))
  }, [isAdmin])

  if (currentUser && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Accès restreint</h2>
        <p className="text-gray-500 text-sm">Cette page est réservée à l'administrateur.</p>
      </div>
    )
  }

  async function handleSauvegarder() {
    setSauvegarde(true)
    try {
      await saveBanniere(config)
      setMessage("Bannière enregistrée.")
      setTimeout(() => setMessage(""), 2500)
    } catch (err) {
      console.error(err)
      setMessage("Erreur lors de l'enregistrement.")
    } finally {
      setSauvegarde(false)
    }
  }

  const previewClasses: Record<string, string> = {
    rose:   "bg-pink-100 border-pink-300 text-pink-800",
    bleu:   "bg-blue-100 border-blue-300 text-blue-800",
    vert:   "bg-green-100 border-green-300 text-green-800",
    jaune:  "bg-yellow-100 border-yellow-300 text-yellow-800",
    rouge:  "bg-red-100 border-red-300 text-red-800",
    violet: "bg-purple-100 border-purple-300 text-purple-800",
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#B4432E]">Bannière provisoire</h1>
        <p className="text-sm text-gray-500 mt-1">
          Affichez un message en haut de toutes les pages pour tous les élus connectés.
        </p>
      </div>

      {chargement ? (
        <div className="py-16 text-center text-gray-400 text-sm">Chargement…</div>
      ) : (
        <>
          {/* Aperçu */}
          {config.texte.trim() && (
            <div className={`rounded-xl border px-4 py-3 text-sm font-medium text-center ${previewClasses[config.couleur] ?? previewClasses.rose}`}>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-1">Aperçu</span>
              {config.emoji && <span className="mr-1.5">{config.emoji}</span>}
              {config.texte}
              {config.emoji && <span className="ml-1.5">{config.emoji}</span>}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            {/* Interrupteur actif / inactif */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Bannière active</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {config.active ? "Visible par tous les élus connectés." : "Non affichée sur le site."}
                </p>
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, active: !prev.active }))}
                className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${
                  config.active ? "bg-[#B4432E]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    config.active ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <hr className="border-gray-100" />

            {/* Texte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Message
              </label>
              <input
                type="text"
                value={config.texte}
                onChange={e => setConfig(prev => ({ ...prev, texte: e.target.value }))}
                placeholder="Ex : Octobre Rose — sensibilisation au cancer du sein"
                maxLength={120}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{config.texte.length}/120</p>
            </div>

            {/* Emoji */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Emoji
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {EMOJIS_RAPIDES.map(e => (
                  <button
                    key={e}
                    onClick={() => setConfig(prev => ({ ...prev, emoji: e }))}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
                      config.emoji === e
                        ? "border-[#B4432E] bg-[#FFF8E8]"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    {e}
                  </button>
                ))}
                <input
                  type="text"
                  value={config.emoji}
                  onChange={e => setConfig(prev => ({ ...prev, emoji: e.target.value.slice(0, 2) }))}
                  placeholder="✏️"
                  className="w-16 px-2 py-2 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
                />
                <button
                  onClick={() => setConfig(prev => ({ ...prev, emoji: "" }))}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                >
                  Sans emoji
                </button>
              </div>
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Couleur
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COULEURS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setConfig(prev => ({ ...prev, couleur: c.id }))}
                    title={c.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      config.couleur === c.id
                        ? "border-[#B4432E] ring-2 ring-[#B4432E]/20 font-semibold"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full inline-block ${c.preview}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSauvegarder}
              disabled={sauvegarde}
              className="px-6 py-3 bg-[#B4432E] hover:bg-[#8B3222] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {sauvegarde ? "Enregistrement…" : "Enregistrer"}
            </button>
            {message && (
              <span className={`text-sm font-medium ${message.startsWith("Erreur") ? "text-[#B4432E]" : "text-[#5FAF5A]"}`}>
                {message.startsWith("Erreur") ? "" : "✓ "}{message}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
