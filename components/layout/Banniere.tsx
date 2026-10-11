"use client"

import { useEffect, useState } from "react"
import { onSnapshot, doc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { BanniereConfig } from "@/lib/firebase/firestore"

const couleurClasses: Record<string, string> = {
  rose:   "bg-pink-100 border-pink-300 text-pink-800",
  bleu:   "bg-blue-100 border-blue-300 text-blue-800",
  vert:   "bg-green-100 border-green-300 text-green-800",
  jaune:  "bg-yellow-100 border-yellow-300 text-yellow-800",
  rouge:  "bg-red-100 border-red-300 text-red-800",
  violet: "bg-purple-100 border-purple-300 text-purple-800",
}

export default function Banniere() {
  const [config, setConfig] = useState<BanniereConfig | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "banniere"),
      (snap) => {
        if (snap.exists()) {
          setConfig(snap.data() as BanniereConfig)
        } else {
          setConfig({ active: false, texte: "", emoji: "🎀", couleur: "rose" })
        }
      },
      (err) => console.error("banniere snapshot:", err)
    )
    return () => unsub()
  }, [])

  if (!config || !config.active || !config.texte.trim()) return null

  const classes = couleurClasses[config.couleur] ?? couleurClasses.rose

  return (
    <div className={`border-b px-4 py-2.5 text-sm font-medium text-center ${classes}`}>
      {config.emoji && <span className="mr-1.5">{config.emoji}</span>}
      {config.texte}
      {config.emoji && <span className="ml-1.5">{config.emoji}</span>}
    </div>
  )
}
