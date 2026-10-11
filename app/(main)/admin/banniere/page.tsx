"use client"

import { useState, useEffect, useRef } from "react"
import { useApp } from "@/lib/app-context"
import { getBanniere, saveBanniere, type BanniereConfig } from "@/lib/firebase/firestore"
import { uploadFichier } from "@/lib/supabase-storage"
import { CALENDRIER_THEMES, getThemeActif } from "@/lib/calendrier-themes"

const COULEURS_CALENDRIER: Record<string, string> = {
  rose:              "bg-pink-200",
  bleu:              "bg-blue-200",
  vert:              "bg-green-200",
  rouge:             "bg-red-200",
  violet:            "bg-purple-200",
  dore:              "bg-amber-200",
  pastel:            "bg-lime-200",
  multicolore:       "bg-violet-200",
  orange:            "bg-orange-200",
  "bleu-blanc-rouge":"bg-blue-100",
  "rouge-vert":      "bg-green-100",
}

const COULEURS: Array<{ id: string; label: string; preview: string }> = [
  { id: "rose",   label: "Rose",   preview: "bg-pink-200" },
  { id: "bleu",   label: "Bleu",   preview: "bg-blue-200" },
  { id: "vert",   label: "Vert",   preview: "bg-green-200" },
  { id: "jaune",  label: "Jaune",  preview: "bg-yellow-200" },
  { id: "rouge",  label: "Rouge",  preview: "bg-red-200" },
  { id: "violet", label: "Violet", preview: "bg-purple-200" },
]

const EMOJIS_RAPIDES = ["🎀", "⚠️", "📢", "ℹ️", "🎉", "🌸", "🔔", "🏛️", "⭐", "❄️"]

const previewClasses: Record<string, string> = {
  rose:   "bg-pink-100 border-pink-300 text-pink-800",
  bleu:   "bg-blue-100 border-blue-300 text-blue-800",
  vert:   "bg-green-100 border-green-300 text-green-800",
  jaune:  "bg-yellow-100 border-yellow-300 text-yellow-800",
  rouge:  "bg-red-100 border-red-300 text-red-800",
  violet: "bg-purple-100 border-purple-300 text-purple-800",
}

function formatDateFR(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function formatMMDD(mmdd: string): string {
  const [m, d] = mmdd.split("-")
  return `${d}/${m}`
}

function CalendrierThemes() {
  const themeActif = getThemeActif()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[#1A1A1A]">Calendrier des thèmes automatiques</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          S'affiche automatiquement dans la bannière (toutes les pages) et sur la page d'accueil lorsqu'aucune bannière manuelle n'est active.
          Les dates mobiles (Nouvel An chinois, Carnaval, Pâques) sont à mettre à jour chaque année dans <code className="bg-gray-100 px-1 rounded text-[11px]">lib/calendrier-themes.ts</code>.
        </p>
      </div>

      <div className="divide-y divide-gray-50">
        {CALENDRIER_THEMES.map(t => {
          const estActif = themeActif?.id === t.id
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 py-2.5 ${estActif ? "bg-[#FFF8E8] -mx-2 px-2 rounded-lg" : ""}`}
            >
              <span
                className={`w-3 h-3 rounded-full flex-shrink-0 ${COULEURS_CALENDRIER[t.couleur] ?? "bg-gray-200"}`}
              />
              <span className="text-base w-6 text-center flex-shrink-0">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-[#1A1A1A]">{t.nom}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {formatMMDD(t.debut)} → {formatMMDD(t.fin)}
                </span>
              </div>
              <span className="text-xs text-gray-400 truncate max-w-[180px] hidden sm:block">
                {t.texteBanniere}
              </span>
              {estActif && (
                <span className="flex-shrink-0 text-xs font-semibold bg-[#B4432E] text-white px-2 py-0.5 rounded-full">
                  Actif aujourd'hui
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function BannierePage() {
  const { currentUser } = useApp()
  const isAdmin = currentUser?.identifiant === "ArnaudP"

  const [config, setConfig] = useState<BanniereConfig>({
    active: false,
    texte: "",
    emoji: "🎀",
    couleur: "rose",
    imageUrl: "",
    dateFin: "",
  })
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [uploadEnCours, setUploadEnCours] = useState(false)
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const today = new Date().toISOString().slice(0, 10)
  const estExpiree = !!config.dateFin && config.dateFin < today

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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadEnCours(true)
    setMessage("")
    try {
      const { url } = await uploadFichier(file, "banniere")
      setConfig(prev => ({ ...prev, imageUrl: url }))
    } catch (err) {
      console.error(err)
      setMessage("Erreur lors du téléversement de l'image.")
    } finally {
      setUploadEnCours(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function handleRetirerImage() {
    setConfig(prev => ({ ...prev, imageUrl: "" }))
  }

  const hasContent = config.texte.trim() || config.imageUrl

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
          {hasContent && (
            <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${previewClasses[config.couleur] ?? previewClasses.rose}`}>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-60 block mb-2 text-center">Aperçu</span>
              <div className="flex items-center justify-center gap-3">
                {config.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.imageUrl}
                    alt=""
                    style={{ height: "48px", width: "auto", objectFit: "contain", borderRadius: "4px" }}
                  />
                )}
                {config.texte.trim() && (
                  <span>
                    {config.emoji && <span className="mr-1.5">{config.emoji}</span>}
                    {config.texte}
                    {config.emoji && <span className="ml-1.5">{config.emoji}</span>}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Alerte expiration */}
          {estExpiree && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
              <span className="text-lg">⏰</span>
              <span>
                Bannière expirée le <strong>{formatDateFR(config.dateFin!)}</strong>. Elle n'est plus affichée même si l'interrupteur est actif.
              </span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">

            {/* Interrupteur */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Bannière active</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {config.active && !estExpiree
                    ? "Visible par tous les élus connectés."
                    : estExpiree
                    ? "Expirée — non affichée."
                    : "Non affichée sur le site."}
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

            <hr className="border-gray-100" />

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Image (optionnelle)
              </label>
              {config.imageUrl ? (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={config.imageUrl}
                    alt="Aperçu"
                    style={{ height: "56px", width: "auto", objectFit: "contain", borderRadius: "6px" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">Image téléversée</p>
                  </div>
                  <button
                    onClick={handleRetirerImage}
                    className="text-sm text-[#B4432E] hover:underline font-medium shrink-0"
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="banniere-image-input"
                  />
                  <label
                    htmlFor="banniere-image-input"
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-[#B4432E] text-sm text-gray-500 hover:text-[#B4432E] cursor-pointer transition-colors ${
                      uploadEnCours ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {uploadEnCours ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Téléversement…
                      </>
                    ) : (
                      <>
                        <span>🖼️</span>
                        Choisir une image (JPG, PNG…)
                      </>
                    )}
                  </label>
                  <p className="text-xs text-gray-400">Affichée à côté du texte dans la bannière</p>
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Date de fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date de fin (optionnelle)
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="date"
                  value={config.dateFin ?? ""}
                  onChange={e => setConfig(prev => ({ ...prev, dateFin: e.target.value }))}
                  min={today}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
                />
                {config.dateFin && (
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, dateFin: "" }))}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                  >
                    Supprimer la date
                  </button>
                )}
              </div>
              {config.dateFin && !estExpiree && (
                <p className="text-xs text-gray-400 mt-1.5">
                  La bannière se masquera automatiquement après le <strong>{formatDateFR(config.dateFin)}</strong>.
                </p>
              )}
              {estExpiree && (
                <p className="text-xs text-amber-600 font-medium mt-1.5">
                  ⏰ Expirée le {formatDateFR(config.dateFin!)} — non affichée sur le site.
                </p>
              )}
              {!config.dateFin && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Sans date de fin, la bannière reste affichée tant que l'interrupteur est actif.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSauvegarder}
              disabled={sauvegarde || uploadEnCours}
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

          {/* Calendrier des thèmes automatiques */}
          <CalendrierThemes />
        </>
      )}
    </div>
  )
}
