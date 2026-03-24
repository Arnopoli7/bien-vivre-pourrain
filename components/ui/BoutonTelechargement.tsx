"use client"

import type { Fichier } from "@/types"
import { lireFichier, telechargerDepuisBase64 } from "@/lib/fichier-storage"

export function telechargerFichier(f: Fichier) {
  if (f.url) {
    window.open(f.url, "_blank")
    return
  }
  if (f.storageKey) {
    const data = lireFichier(f.storageKey)
    if (data) {
      telechargerDepuisBase64(f.nom, f.type, data)
      return
    }
  }
  if (f.base64) {
    telechargerDepuisBase64(f.nom, f.type, f.base64)
    return
  }
  if (f.blobUrl) {
    const a = document.createElement("a")
    a.href = f.blobUrl
    a.download = f.nom
    a.click()
    return
  }
  alert("Ce fichier n'est plus disponible.\nVeuillez le déposer à nouveau.")
}

interface Props {
  fichier?: Fichier
  onTelecharger?: () => void
  className?: string
}

export default function BoutonTelechargement({ fichier, onTelecharger, className = "" }: Props) {
  function handleClick() {
    if (onTelecharger) {
      onTelecharger()
    } else if (fichier) {
      telechargerFichier(fichier)
    }
  }

  return (
    <button
      onClick={handleClick}
      title={fichier ? `Télécharger ${fichier.nom}` : "Télécharger"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B4432E] hover:bg-[#8B3222] text-white text-xs font-medium rounded-lg transition-colors ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Télécharger
    </button>
  )
}
