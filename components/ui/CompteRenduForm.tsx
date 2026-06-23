"use client"

import { useState } from "react"
import Image from "next/image"
import { useApp } from "@/lib/app-context"
import { sauvegarderCompteRendu } from "@/lib/comptes-rendus"
import { documentExistePourCompteRendu } from "@/lib/firebase/firestore"
import type { CompteRendu, CorpsSection, Fichier } from "@/types"
import { uploadFichier } from "@/lib/supabase-storage"
import { getSuppleantsCommission, getSuppleantCommissions } from "@/lib/commission-membres"

const MOIS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

interface Props {
  initialCR?: CompteRendu
  onSaved: (crId: string, statut: "brouillon" | "en_attente" | "valide") => void
}

export default function CompteRenduForm({ initialCR, onSaved }: Props) {
  const { currentUser, commissions, users, ajouterDocument } = useApp()
  const today = new Date().toISOString().slice(0, 10)
  const isNew = !initialCR

  // Commissions accessibles : toutes pour maire/adjoint/rédacteur, seulement suppléantes pour conseillers suppléants
  const commissionsAccessibles =
    (currentUser?.role === "maire" || currentUser?.role === "adjoint" || currentUser?.role === "redacteur")
      ? commissions
      : commissions.filter(c => getSuppleantsCommission(c.id).includes(currentUser?.nom ?? ""))

  const [titre, setTitre] = useState(initialCR?.titre ?? "")
  const [commissionId, setCommissionId] = useState(
    initialCR?.commissionId ?? commissionsAccessibles[0]?.id ?? commissions[0]?.id ?? ""
  )
  const [date, setDate] = useState(initialCR?.date ?? today)
  const [presents, setPresents] = useState<string[]>(initialCR?.presents ?? [])
  const [absentsExcuses, setAbsentsExcuses] = useState<string[]>(initialCR?.absentsExcuses ?? [])
  const [ordresDuJour, setOrdresDuJour] = useState<string[]>(
    initialCR?.ordresDuJour.length ? initialCR.ordresDuJour : [""]
  )
  const [corps, setCorps] = useState<CorpsSection[]>(initialCR?.corps ?? [])
  const [annexes, setAnnexes] = useState<Fichier[]>(initialCR?.annexes ?? [])
  const [personnesExterieures, setPersonnesExterieures] = useState<string[]>(
    initialCR?.personnesExterieures ?? []
  )
  const [nomExterne, setNomExterne] = useState("")
  const [message, setMessage] = useState("")
  const [erreurFichier, setErreurFichier] = useState("")

  const dateObj = new Date(date + "T12:00:00")
  const mois = dateObj.getMonth() + 1
  const annee = dateObj.getFullYear()

  const isSuppleantForSelected = getSuppleantsCommission(commissionId).includes(currentUser?.nom ?? "")
  const canSaveDraft = currentUser?.role === "maire" || currentUser?.role === "adjoint" || currentUser?.role === "redacteur" || isSuppleantForSelected
  const canValidate = currentUser?.role === "maire"

  function togglePresent(nom: string) {
    if (presents.includes(nom)) {
      setPresents(prev => prev.filter(n => n !== nom))
    } else {
      setPresents(prev => [...prev, nom])
      setAbsentsExcuses(prev => prev.filter(n => n !== nom))
    }
  }

  function toggleAbsent(nom: string) {
    if (absentsExcuses.includes(nom)) {
      setAbsentsExcuses(prev => prev.filter(n => n !== nom))
    } else {
      setAbsentsExcuses(prev => [...prev, nom])
      setPresents(prev => prev.filter(n => n !== nom))
    }
  }

  function ajouterPersonneExterne() {
    const nom = nomExterne.trim()
    if (!nom || personnesExterieures.includes(nom)) return
    setPersonnesExterieures(prev => [...prev, nom])
    setPresents(prev => [...prev, nom])
    setNomExterne("")
  }

  function supprimerPersonneExterne(nom: string) {
    setPersonnesExterieures(prev => prev.filter(n => n !== nom))
    setPresents(prev => prev.filter(n => n !== nom))
    setAbsentsExcuses(prev => prev.filter(n => n !== nom))
  }

  function ajouterPoint() {
    setOrdresDuJour(prev => [...prev, ""])
  }

  function modifierPoint(i: number, val: string) {
    setOrdresDuJour(prev => prev.map((p, j) => j === i ? val : p))
  }

  function supprimerPoint(i: number) {
    setOrdresDuJour(prev => prev.filter((_, j) => j !== i))
  }

  function monterPoint(i: number) {
    if (i === 0) return
    setOrdresDuJour(prev => {
      const next = [...prev]
      ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
      return next
    })
  }

  function descendrePoint(i: number) {
    if (i === ordresDuJour.length - 1) return
    setOrdresDuJour(prev => {
      const next = [...prev]
      ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
      return next
    })
  }

  function genererCorps() {
    const points = ordresDuJour.filter(p => p.trim())
    setCorps(points.map(titre => {
      const existing = corps.find(c => c.titre === titre)
      return { titre, contenu: existing?.contenu ?? "" }
    }))
  }

  const FORMATS_ACCEPTES = [".doc", ".docx", ".pdf", ".xls", ".xlsx"]
  const TAILLE_MAX: Record<string, number> = {
    ".pdf": 20 * 1024 * 1024,
    ".doc": 10 * 1024 * 1024,
    ".docx": 10 * 1024 * 1024,
    ".xls": 10 * 1024 * 1024,
    ".xlsx": 10 * 1024 * 1024,
  }

  async function handleAjouterAnnexes(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setErreurFichier("")

    for (const f of files) {
      const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "")
      if (!FORMATS_ACCEPTES.includes(ext)) {
        setErreurFichier("Format non accepté.\nFormats autorisés : PDF, Word (.docx), Excel (.xlsx)")
        e.target.value = ""
        return
      }
      const tailleMax = TAILLE_MAX[ext]
      if (tailleMax && f.size > tailleMax) {
        setErreurFichier("Fichier trop volumineux.\nTaille maximale : PDF 20 Mo, Word 10 Mo, Excel 10 Mo")
        e.target.value = ""
        return
      }
    }

    e.target.value = ""

    for (const f of files) {
      try {
        const result = await uploadFichier(f)
        setAnnexes(prev => [...prev, {
          nom: f.name,
          type: f.type || f.name.split(".").pop()?.toLowerCase() || "fichier",
          taille: f.size,
          ...result,
        }])
      } catch (err) {
        setMessage(`Erreur: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  function supprimerAnnexe(index: number) {
    setAnnexes(prev => prev.filter((_, i) => i !== index))
  }

  function buildCR(statut: "brouillon" | "en_attente" | "valide"): CompteRendu {
    return {
      id: initialCR?.id ?? `cr-${Date.now()}`,
      titre: titre.trim() || "Sans titre",
      commissionId,
      date,
      mois,
      annee,
      presents,
      absentsExcuses,
      ordresDuJour: ordresDuJour.filter(p => p.trim()),
      corps,
      statut,
      redacteur: initialCR?.redacteur ?? currentUser?.nom ?? "",
      dateRedaction: initialCR?.dateRedaction ?? today,
      annexes,
      personnesExterieures,
    }
  }

  async function enregistrerBrouillon() {
    const cr = buildCR("brouillon")
    await sauvegarderCompteRendu(cr)
    setMessage("Brouillon enregistré.")
    setTimeout(() => onSaved(cr.id, "brouillon"), 800)
  }

  async function envoyerPourValidation() {
    const cr = buildCR("en_attente")
    await sauvegarderCompteRendu(cr)
    const commissionNom = commissions.find(c => c.id === commissionId)?.nom ?? ""
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "validation_requise",
          titre: cr.titre,
          commission: commissionNom,
          auteur: currentUser?.nom ?? "",
          id: cr.id,
        }),
      })
    } catch {
      // L'email est secondaire, on continue même en cas d'erreur
    }
    setMessage("Compte rendu envoyé pour validation.")
    setTimeout(() => onSaved(cr.id, "en_attente"), 800)
  }

  async function validerEtClasser() {
    try {
      const cr = buildCR("valide")
      await sauvegarderCompteRendu(cr)
      const dejaExiste = await documentExistePourCompteRendu(cr.id)
      if (!dejaExiste) {
        const annexesCr = cr.annexes ?? []
        const auteurUser = users.find(u => u.nom === cr.redacteur)
        await ajouterDocument({
          id: `doc-cr-${cr.id}`,
          titre: cr.titre || "Sans titre",
          commissionId: cr.commissionId || "",
          commission: commission?.nom || "",
          annee: cr.annee,
          mois: cr.mois,
          date: cr.date || "",
          auteur: cr.redacteur || "",
          auteurId: auteurUser?.id || "",
          fichiers: annexesCr,
          type: "compte_rendu",
          statut: "valide",
          compteRenduId: cr.id || "",
          nbAnnexes: annexesCr.length || 0,
          validepar: currentUser?.nom || "",
          valideAt: new Date().toISOString(),
        })
      }
      setMessage(`Compte rendu validé et classé dans ${commission?.nom ?? "la commission"}.`)
      setTimeout(() => onSaved(cr.id, "valide"), 800)
    } catch (err) {
      console.error("Erreur validation CR :", err)
      setMessage(`Erreur lors de la validation : ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const commission = commissions.find(c => c.id === commissionId)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Document card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* ── ENTÊTE ── */}
        <div className="border-b border-gray-100 p-8 text-center space-y-5">
          <div className="flex justify-center">
            <Image
              src="/logo.jpg"
              alt="Bien Vivre à Pourrain"
              width={110}
              height={110}
              style={{ height: "auto" }}
            />
          </div>
          <h2 className="text-xl font-bold tracking-widest text-[#1A1A1A] uppercase">
            Compte rendu de réunion
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto text-left">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Commission
              </label>
              <select
                value={commissionId}
                onChange={e => setCommissionId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
              >
                {commissionsAccessibles.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Date de réunion
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
              />
              {date && (
                <p className="text-xs text-gray-400 mt-1">
                  {MOIS_FR[mois - 1]} {annee}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── PRÉSENCES ── */}
        <div className="border-b border-gray-100 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#B4432E]">Présences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Présents */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Présents{" "}
                <span className="text-xs font-normal text-gray-400">({presents.length})</span>
              </p>
              <div className="space-y-1.5">
                {users.map(user => (
                  <label key={user.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={presents.includes(user.nom)}
                      onChange={() => togglePresent(user.nom)}
                      className="w-4 h-4 accent-[#5FAF5A]"
                    />
                    <span className={`text-sm ${presents.includes(user.nom) ? "text-[#1A1A1A] font-medium" : "text-gray-500"}`}>
                      {user.nom}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      user.role === "maire"
                        ? "bg-[#B4432E]/10 text-[#B4432E]"
                        : user.role === "adjoint"
                        ? "bg-[#F2C94C]/40 text-[#7A5C00]"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {user.role === "maire" ? "Maire" : user.role === "adjoint" ? "Adjoint" : user.role === "redacteur" ? "Rédacteur" : "Conseiller"}
                    </span>
                  </label>
                ))}
                {/* Personnes externes dans la colonne Présents */}
                {personnesExterieures.map(nom => (
                  <div key={nom} className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={presents.includes(nom)}
                      onChange={() => togglePresent(nom)}
                      className="w-4 h-4 accent-[#5FAF5A]"
                    />
                    <span className={`text-sm ${presents.includes(nom) ? "text-[#1A1A1A] font-medium" : "text-gray-500"}`}>
                      {nom}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Externe
                    </span>
                    <button
                      type="button"
                      onClick={() => supprimerPersonneExterne(nom)}
                      className="p-0.5 text-gray-300 hover:text-[#B4432E] rounded transition-colors text-xs ml-auto"
                      title="Retirer"
                    >✕</button>
                  </div>
                ))}
              </div>
              {/* Ajout personne externe */}
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={nomExterne}
                  onChange={e => setNomExterne(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && ajouterPersonneExterne()}
                  placeholder="Ajouter une personne extérieure…"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
                />
                <button
                  type="button"
                  onClick={ajouterPersonneExterne}
                  disabled={!nomExterne.trim()}
                  className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  Ajouter
                </button>
              </div>
            </div>
            {/* Absents excusés */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Absents excusés{" "}
                <span className="text-xs font-normal text-gray-400">({absentsExcuses.length})</span>
              </p>
              <div className="space-y-1.5">
                {users.map(user => (
                  <label key={user.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={absentsExcuses.includes(user.nom)}
                      onChange={() => toggleAbsent(user.nom)}
                      className="w-4 h-4 accent-[#F2C94C]"
                    />
                    <span className={`text-sm ${absentsExcuses.includes(user.nom) ? "text-[#1A1A1A] font-medium" : "text-gray-500"}`}>
                      {user.nom}
                    </span>
                  </label>
                ))}
                {/* Personnes externes dans la colonne Absents */}
                {personnesExterieures.map(nom => (
                  <div key={nom} className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={absentsExcuses.includes(nom)}
                      onChange={() => toggleAbsent(nom)}
                      className="w-4 h-4 accent-[#F2C94C]"
                    />
                    <span className={`text-sm ${absentsExcuses.includes(nom) ? "text-[#1A1A1A] font-medium" : "text-gray-500"}`}>
                      {nom}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Externe
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TITRE DU COMPTE RENDU ── */}
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#B4432E] mb-3">
            Titre du compte rendu <span className="text-[#B4432E]">*</span>
          </h3>
          <input
            type="text"
            value={titre}
            onChange={e => setTitre(e.target.value)}
            placeholder="Ex: Réunion budgétaire mars 2026..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E] transition-colors"
          />
        </div>

        {/* ── ORDRE DU JOUR ── */}
        <div className="border-b border-gray-100 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#B4432E]">Ordre du jour</h3>
          <div className="space-y-2">
            {ordresDuJour.map((point, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-400 w-6 shrink-0 text-right">{i + 1}.</span>
                <input
                  type="text"
                  value={point}
                  onChange={e => modifierPoint(i, e.target.value)}
                  placeholder={`Point ${i + 1}…`}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]"
                />
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => monterPoint(i)}
                    disabled={i === 0}
                    title="Monter"
                    className="p-1.5 text-gray-400 hover:text-[#B4432E] disabled:opacity-25 hover:bg-gray-100 rounded-lg transition-colors text-xs"
                  >▲</button>
                  <button
                    type="button"
                    onClick={() => descendrePoint(i)}
                    disabled={i === ordresDuJour.length - 1}
                    title="Descendre"
                    className="p-1.5 text-gray-400 hover:text-[#B4432E] disabled:opacity-25 hover:bg-gray-100 rounded-lg transition-colors text-xs"
                  >▼</button>
                  <button
                    type="button"
                    onClick={() => supprimerPoint(i)}
                    title="Supprimer"
                    className="p-1.5 text-gray-400 hover:text-[#B4432E] hover:bg-red-50 rounded-lg transition-colors text-xs"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <button
              type="button"
              onClick={ajouterPoint}
              className="text-sm text-[#B4432E] border border-[#B4432E]/30 hover:bg-[#B4432E]/5 px-4 py-2 rounded-xl transition-colors font-medium"
            >
              + Ajouter un point
            </button>
            <button
              type="button"
              onClick={genererCorps}
              disabled={ordresDuJour.filter(p => p.trim()).length === 0}
              className="text-sm bg-[#B4432E] hover:bg-[#8B3222] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors font-medium"
            >
              Générer le corps du compte rendu
            </button>
          </div>
        </div>

        {/* ── CORPS ── */}
        {corps.length > 0 && (
          <div className="border-b border-gray-100 p-6 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#B4432E]">Corps du compte rendu</h3>
            {corps.map((section, i) => (
              <div key={i} className="space-y-2">
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  {i + 1}. {section.titre}
                </h4>
                <textarea
                  value={section.contenu}
                  onChange={e => setCorps(prev => prev.map((s, j) => j === i ? { ...s, contenu: e.target.value } : s))}
                  placeholder="Rédigez ici ce qui a été dit, discuté et décidé pour ce point…"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E] resize-none leading-relaxed"
                />
              </div>
            ))}
          </div>
        )}

        {/* ── ANNEXES ── */}
        <div className="border-b border-gray-100 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#B4432E]">Annexes</h3>
          {annexes.length > 0 && (
            <ul className="space-y-2">
              {annexes.map((f, i) => (
                <li key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                  <span className="text-sm flex-1 min-w-0 truncate font-medium text-[#1A1A1A]">{f.nom}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {f.taille < 1024 ? `${f.taille} o`
                      : f.taille < 1024 * 1024 ? `${Math.round(f.taille / 1024)} Ko`
                      : `${(f.taille / (1024 * 1024)).toFixed(1)} Mo`}
                  </span>
                  <button
                    type="button"
                    onClick={() => supprimerAnnexe(i)}
                    className="p-1 text-gray-400 hover:text-[#B4432E] hover:bg-red-50 rounded-lg transition-colors text-xs shrink-0"
                    title="Supprimer"
                  >✕</button>
                </li>
              ))}
            </ul>
          )}
          <div>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[#B4432E] border border-[#B4432E]/30 hover:bg-[#B4432E]/5 px-4 py-2 rounded-xl transition-colors font-medium">
              <span>📎 Ajouter une annexe</span>
              <input
                type="file"
                multiple
                accept=".doc,.docx,.pdf,.xls,.xlsx"
                onChange={handleAjouterAnnexes}
                className="hidden"
              />
            </label>
            <p className="mt-1.5 text-xs text-gray-400">Formats : PDF (20 Mo max), Word (10 Mo max), Excel (10 Mo max)</p>
          </div>
          {erreurFichier && (
            <p className="text-sm text-[#B4432E]" style={{ whiteSpace: "pre-line" }}>{erreurFichier}</p>
          )}
          {annexes.length === 0 && (
            <p className="text-xs text-gray-400">Aucune annexe ajoutée</p>
          )}
        </div>

        {/* ── PIED DE PAGE ── */}
        <div className="p-6 bg-[#FAF8F5] flex items-center justify-between text-sm text-gray-500 flex-wrap gap-4">
          <span className="font-semibold text-[#1A1A1A]">
            Mairie de Pourrain — Bien Vivre à Pourrain
          </span>
          <div className="text-right text-xs">
            <p className="flex items-center justify-end gap-1.5">
              Rédigé par :{" "}
              <span className="font-semibold text-[#1A1A1A]">{currentUser?.nom ?? ""}</span>
              {isSuppleantForSelected && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  Suppléant
                </span>
              )}
            </p>
            <p>Date de rédaction : <span className="font-semibold text-[#1A1A1A]">{new Date().toLocaleDateString("fr-FR")}</span></p>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {message && (
        <div className="bg-[#5FAF5A]/10 border border-[#5FAF5A]/30 text-[#5FAF5A] text-sm font-medium px-4 py-3 rounded-xl">
          ✓ {message}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {canSaveDraft && (
          <button
            type="button"
            onClick={enregistrerBrouillon}
            className="px-6 py-3 bg-white border-2 border-[#F2C94C] text-[#1A1A1A] font-semibold rounded-xl hover:bg-[#FFF8E8] transition-colors text-sm"
          >
            Enregistrer en brouillon
          </button>
        )}
        {canSaveDraft && (
          <button
            type="button"
            onClick={envoyerPourValidation}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Envoyer pour validation
          </button>
        )}
        {canValidate && (
          <button
            type="button"
            onClick={validerEtClasser}
            className="px-6 py-3 bg-[#B4432E] hover:bg-[#8B3222] text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Valider et classer
          </button>
        )}
        {!canSaveDraft && !canValidate && (
          <p className="text-sm text-gray-400 italic">
            Seuls le Maire, les Adjoints et les Suppléants (pour leur commission) peuvent enregistrer un compte rendu.
          </p>
        )}
      </div>
    </div>
  )
}
