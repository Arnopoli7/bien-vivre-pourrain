"use client"

import { useState, useEffect, useRef } from "react"
import { useApp } from "@/lib/app-context"
import type { User, AccesCommissions, NiveauSuppression } from "@/types"

type Onglet = "utilisateurs" | "acces"

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

const droitsLabels: Record<NiveauSuppression, string> = {
  aucun:           "Non",
  documents_mois:  "Documents et mois",
  tout:            "Tout",
}

function ModifierUtilisateurModal({
  user,
  onClose,
  onSave,
}: {
  user: User
  onClose: () => void
  onSave: (u: User) => void
}) {
  const [nom, setNom] = useState(user.nom)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState<User["role"]>(user.role)
  const [erreur, setErreur] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) { setErreur("Le nom est obligatoire."); return }
    if (!email.trim()) { setErreur("L'email est obligatoire."); return }
    onSave({ ...user, nom: nom.trim(), email: email.trim(), role })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Modifier l'utilisateur</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse e-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
            <select value={role} onChange={e => setRole(e.target.value as User["role"])}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E]">
              <option value="maire">Maire</option>
              <option value="adjoint">Adjoint au Maire</option>
              <option value="conseiller">Conseiller Municipal</option>
            </select>
          </div>
          {erreur && <p className="text-sm text-[#B4432E]">{erreur}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Annuler
            </button>
            <button type="submit"
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#B4432E] hover:bg-[#8B3222] rounded-xl transition-colors">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { currentUser, commissions, users, accesCommissions, setAccesCommissions, droitsSuppression, setDroitsSuppression, updateUser: ctxUpdateUser, deleteUser: ctxDeleteUser } = useApp()
  const allUserIds = users.map(u => u.id)

  const [onglet, setOnglet] = useState<Onglet>("utilisateurs")
  const [userEnEdition, setUserEnEdition] = useState<User | null>(null)

  // Matrice locale : commissionId → liste des userId autorisés (forme étendue)
  const [localAcces, setLocalAcces] = useState<Record<string, string[]>>({})
  const localAccesInitialized = useRef(false)

  useEffect(() => {
    if (commissions.length === 0 || users.length === 0 || localAccesInitialized.current) return
    localAccesInitialized.current = true
    const ids = users.map(u => u.id)
    setLocalAcces(
      Object.fromEntries(
        commissions.map(c => [c.id, accesCommissions[c.id] ?? [...ids]])
      )
    )
  }, [commissions, users, accesCommissions])
  const [messageSauvegarde, setMessageSauvegarde] = useState("")

  // Seul le maire peut accéder à cette page (après tous les hooks)
  if (currentUser && currentUser.role !== "maire") {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Accès restreint</h2>
        <p className="text-gray-500 text-sm">Cette page est réservée au Maire.</p>
      </div>
    )
  }

  function handleModifier(updated: User) {
    ctxUpdateUser(updated)
  }

  function handleSupprimer(id: string) {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      ctxDeleteUser(id)
    }
  }

  function handleChangerDroits(userId: string, niveau: NiveauSuppression) {
    setDroitsSuppression({ ...droitsSuppression, [userId]: niveau })
  }

  function isChecked(commissionId: string, userId: string): boolean {
    return (localAcces[commissionId] ?? allUserIds).includes(userId)
  }

  function toggleAcces(commissionId: string, userId: string) {
    setLocalAcces(prev => {
      const current = prev[commissionId] ?? [...allUserIds]
      const newListe = current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId]
      return { ...prev, [commissionId]: newListe }
    })
  }

  function toggleTouteCommission(commissionId: string, cocheTous: boolean) {
    setLocalAcces(prev => ({
      ...prev,
      [commissionId]: cocheTous ? [...allUserIds] : [],
    }))
  }

  function toggleToutUtilisateur(userId: string, cocheTous: boolean) {
    setLocalAcces(prev => {
      const next = { ...prev }
      for (const c of commissions) {
        const current = next[c.id] ?? [...allUserIds]
        next[c.id] = cocheTous
          ? current.includes(userId) ? current : [...current, userId]
          : current.filter(id => id !== userId)
      }
      return next
    })
  }

  function sauvegarderAcces() {
    const newAcces: AccesCommissions = {}
    for (const c of commissions) {
      const liste = localAcces[c.id] ?? allUserIds
      if (liste.length < allUserIds.length) {
        newAcces[c.id] = liste
      }
    }
    setAccesCommissions(newAcces)
    setMessageSauvegarde("Accès enregistrés.")
    setTimeout(() => setMessageSauvegarde(""), 2500)
  }

  const peutModifierAcces = currentUser?.role === "maire"

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#B4432E]">Administration</h1>
        <p className="text-sm text-gray-500 mt-1">Gestion des utilisateurs et des accès</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setOnglet("utilisateurs")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            onglet === "utilisateurs"
              ? "border-[#B4432E] text-[#B4432E]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Utilisateurs
        </button>
        {peutModifierAcces && (
          <button
            onClick={() => setOnglet("acces")}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              onglet === "acces"
                ? "border-[#B4432E] text-[#B4432E]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Accès aux commissions
          </button>
        )}
      </div>

      {/* ── ONGLET UTILISATEURS ── */}
      {onglet === "utilisateurs" && (
        <>
          <div className="flex justify-end">
            <button className="flex items-center gap-2 bg-[#B4432E] hover:bg-[#8B3222] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
              <span>+</span>
              Ajouter un utilisateur
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">E-mail</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Peut supprimer</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const niveauActuel: NiveauSuppression = droitsSuppression[user.id] ?? "aucun"
                  const estMaire = user.role === "maire"
                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#B4432E]/10 flex items-center justify-center text-[#B4432E] font-bold text-sm">
                            {user.nom.charAt(0)}
                          </div>
                          <span className="font-medium text-[#1A1A1A] text-sm">{user.nom}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">{user.email}</td>
                      <td className="py-4 px-6">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleBadgeColors[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {estMaire ? (
                          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-full">
                            {droitsLabels.tout}
                          </span>
                        ) : (
                          <select
                            value={niveauActuel}
                            onChange={e => handleChangerDroits(user.id, e.target.value as NiveauSuppression)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#B4432E]/20 focus:border-[#B4432E] bg-white"
                          >
                            <option value="aucun">Non</option>
                            <option value="documents_mois">Documents et mois</option>
                            <option value="tout">Tout</option>
                          </select>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setUserEnEdition(user)}
                            className="p-1.5 text-gray-400 hover:text-[#B4432E] hover:bg-[#FAF8F5] rounded-lg transition-colors" title="Modifier">✏️</button>
                          <button onClick={() => handleSupprimer(user.id)}
                            className="p-1.5 text-gray-400 hover:text-[#B4432E] hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── ONGLET ACCÈS AUX COMMISSIONS ── */}
      {onglet === "acces" && peutModifierAcces && (
        <>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Case cochée</span> = accès autorisé.{" "}
            <span className="font-semibold">Case décochée</span> = accès interdit.
            Les commissions restreintes affichent un 🔒 sur leur carte.
            La ligne de cases en haut de chaque colonne coche/décoche toute la colonne.
          </p>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="border-collapse w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {/* Col commission */}
                    <th
                      className="sticky left-0 z-20 bg-gray-50 py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      style={{ minWidth: "230px" }}
                    >
                      Commission
                    </th>
                    {/* Cols users */}
                    {users.map(user => {
                      const prenom = user.nom.split(" ")[0]
                      const allChecked = commissions.every(c => isChecked(c.id, user.id))
                      return (
                        <th key={user.id} className="py-2 px-0.5 text-center" style={{ width: "42px", minWidth: "42px" }}>
                          <div className="flex flex-col items-center gap-1.5 px-1">
                            <span
                              title={user.nom}
                              className="text-[9px] font-medium text-gray-500 leading-none select-none"
                              style={{
                                writingMode: "vertical-rl",
                                transform: "rotate(180deg)",
                                height: "68px",
                                overflow: "hidden",
                                display: "block",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {prenom}
                            </span>
                            <input
                              type="checkbox"
                              checked={allChecked}
                              onChange={e => toggleToutUtilisateur(user.id, e.target.checked)}
                              title={`Tout cocher/décocher pour ${user.nom}`}
                              className="w-3.5 h-3.5 accent-[#B4432E]"
                            />
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission, idx) => {
                    const nbCoches = (localAcces[commission.id] ?? allUserIds).length
                    const tousCoches = nbCoches === allUserIds.length
                    const restreinte = nbCoches < allUserIds.length
                    const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"

                    return (
                      <tr key={commission.id} className={`border-b border-gray-100 hover:bg-[#FFF8E8]/60 transition-colors ${rowBg}`}>
                        {/* Commission name — sticky */}
                        <td className={`sticky left-0 z-10 py-2.5 px-4 border-r border-gray-200 ${rowBg}`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={tousCoches}
                              onChange={e => toggleTouteCommission(commission.id, e.target.checked)}
                              title="Tout cocher/décocher pour cette commission"
                              className="w-3.5 h-3.5 accent-[#B4432E] shrink-0"
                            />
                            <span
                              className="text-xs font-medium text-[#1A1A1A] truncate"
                              style={{ maxWidth: "170px" }}
                              title={commission.nom}
                            >
                              {commission.nom}
                            </span>
                            {restreinte && (
                              <span className="text-[#B4432E] text-xs shrink-0" title="Accès restreint">🔒</span>
                            )}
                          </div>
                        </td>
                        {/* Checkboxes */}
                        {users.map(user => (
                          <td key={user.id} className="py-2.5 px-0.5 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked(commission.id, user.id)}
                              onChange={() => toggleAcces(commission.id, user.id)}
                              title={`${user.nom} — ${commission.nom}`}
                              className="w-4 h-4 accent-[#B4432E]"
                            />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bouton enregistrer */}
          <div className="flex items-center gap-4">
            <button
              onClick={sauvegarderAcces}
              className="px-6 py-3 bg-[#B4432E] hover:bg-[#8B3222] text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Enregistrer les accès
            </button>
            {messageSauvegarde && (
              <span className="text-sm text-[#5FAF5A] font-medium">✓ {messageSauvegarde}</span>
            )}
          </div>
        </>
      )}

      {userEnEdition && (
        <ModifierUtilisateurModal
          user={userEnEdition}
          onClose={() => setUserEnEdition(null)}
          onSave={(updated) => { handleModifier(updated); setUserEnEdition(null) }}
        />
      )}
    </div>
  )
}
