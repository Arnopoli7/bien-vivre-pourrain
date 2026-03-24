"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { db } from "@/lib/firebase/config"
import type { Commission, Document, User, Reunion, AccesCommissions, DroitsSuppression, NiveauSuppression } from "@/types"
import {
  getCommissions,
  getUsers,
  getDocuments,
  addDocument as firestoreAddDocument,
  updateDocument as firestoreUpdateDocument,
  deleteDocument as firestoreDeleteDocument,
  restaurerDocumentFirestore,
  updateUser as firestoreUpdateUser,
  deleteUser as firestoreDeleteUser,
  getReunions,
  addReunion as firestoreAddReunion,
  deleteReunion as firestoreDeleteReunion,
  getAcces,
  saveAcces,
} from "@/lib/firebase/firestore"

function getDroitsDefaut(userList: User[]): DroitsSuppression {
  const droits: DroitsSuppression = {}
  for (const u of userList) {
    if (u.role === "maire") droits[u.id] = "tout"
    else if (u.role === "adjoint") droits[u.id] = "documents_mois"
    else droits[u.id] = "aucun"
  }
  return droits
}

interface AppContextType {
  currentUser: User | null
  commissions: Commission[]
  users: User[]
  loading: boolean
  loadingMessage: string
  error: string | null
  documents: Document[]
  ajouterDocument: (doc: Document) => void
  modifierDocument: (doc: Document) => void
  supprimerDocument: (id: string) => void
  corbeilleDocuments: Document[]
  mettreALaCorbeille: (ids: string[]) => void
  restaurerDocuments: (ids: string[]) => void
  supprimerDefinitivement: (ids: string[]) => void
  viderCorbeille: () => void
  reunions: Reunion[]
  ajouterReunion: (reunion: Reunion) => void
  supprimerReunion: (id: string) => void
  accesCommissions: AccesCommissions
  setAccesCommissions: (acces: AccesCommissions) => void
  aCommissionAcces: (commissionId: string) => boolean
  estRestreinte: (commissionId: string) => boolean
  droitsSuppression: DroitsSuppression
  setDroitsSuppression: (droits: DroitsSuppression) => void
  peutSupprimer: (niveau: "document" | "mois" | "annee" | "commission") => boolean
  loginUser: (user: User) => void
  updateUser: (user: User) => void
  deleteUser: (id: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [corbeilleDocuments, setCorbeilleDocuments] = useState<Document[]>([])
  const [reunions, setReunions] = useState<Reunion[]>([])
  const [accesCommissions, setAccesCommissionsState] = useState<AccesCommissions>({})
  const [droitsSuppression, setDroitsSuppression] = useState<DroitsSuppression>({})
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("Connexion à Firebase…")
  const [error, setError] = useState<string | null>(null)

  // Effect 1 : données statiques (commissions, users, réunions, accès)
  useEffect(() => {
    async function chargerDonnees() {
      try {
        setLoading(true)
        setLoadingMessage("Connexion à Firebase…")
        const commissionsData = await getCommissions()
        setLoadingMessage("Chargement des données…")

        const [usersData, reunionsData, acces, docsData] = await Promise.all([
          getUsers(),
          getReunions(),
          getAcces(),
          getDocuments(),
        ])

        setCommissions(commissionsData.sort((a, b) => Number(a.id) - Number(b.id)))
        setUsers(usersData)
        setDroitsSuppression(getDroitsDefaut(usersData))
        setReunions(reunionsData)
        setAccesCommissionsState(acces)
        setDocuments(docsData.filter(d => !d.dateMiseCorbeille))
        setCorbeilleDocuments(docsData.filter(d => !!d.dateMiseCorbeille))
        const userId = typeof window !== "undefined" ? localStorage.getItem("bvap_user_id") : null
        const found = userId ? usersData.find(u => u.id === userId) : null
        setCurrentUser(found ?? usersData[0] ?? null)
      } catch (err) {
        console.error("Erreur Firebase :", err)
        setError("Impossible de se connecter à la base de données. Vérifiez votre connexion internet.")
      } finally {
        setLoading(false)
      }
    }

    chargerDonnees()
  }, [])


  function aCommissionAcces(commissionId: string): boolean {
    // Commission 20 "Réunion Maire et Adjoints" réservée aux rôles maire/adjoint
    if (commissionId === "20") {
      return currentUser?.role === "maire" || currentUser?.role === "adjoint"
    }
    const liste = accesCommissions[commissionId]
    if (!liste) return true
    if (!currentUser) return false
    return liste.includes(currentUser.id)
  }

  function estRestreinte(commissionId: string): boolean {
    if (commissionId === "20") return true
    return commissionId in accesCommissions
  }

  function peutSupprimer(niveau: "document" | "mois" | "annee" | "commission"): boolean {
    if (!currentUser) return false
    const droits: NiveauSuppression = droitsSuppression[currentUser.id] ?? "aucun"
    if (droits === "aucun") return false
    if (droits === "documents_mois") return niveau === "document" || niveau === "mois"
    return true
  }

  function ajouterDocument(doc: Document) {
    setDocuments(prev => [...prev, doc])
    firestoreAddDocument(doc).catch(console.error)
  }

  function modifierDocument(doc: Document) {
    setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d))
    const { id, ...data } = doc
    firestoreUpdateDocument(id, data as Record<string, unknown>).catch(console.error)
  }

  function supprimerDocument(id: string) {
    setDocuments(prev => prev.filter(d => d.id !== id))
    firestoreDeleteDocument(id).catch(console.error)
  }

  function mettreALaCorbeille(ids: string[]) {
    const now = new Date().toISOString().slice(0, 10)
    const aDeplacer = documents.filter(d => ids.includes(d.id))
    setDocuments(prev => prev.filter(d => !ids.includes(d.id)))
    setCorbeilleDocuments(prev => [
      ...prev,
      ...aDeplacer.map(d => ({ ...d, dateMiseCorbeille: now })),
    ])
    aDeplacer.forEach(d => {
      firestoreUpdateDocument(d.id, { dateMiseCorbeille: now }).catch(console.error)
    })
  }

  function restaurerDocuments(ids: string[]) {
    const aRestorer = corbeilleDocuments.filter(d => ids.includes(d.id))
    setCorbeilleDocuments(prev => prev.filter(d => !ids.includes(d.id)))
    setDocuments(prev => [
      ...aRestorer.map(d => ({ ...d, dateMiseCorbeille: undefined })),
      ...prev,
    ])
    aRestorer.forEach(d => {
      restaurerDocumentFirestore(d.id).catch(console.error)
    })
  }

  function supprimerDefinitivement(ids: string[]) {
    setCorbeilleDocuments(prev => prev.filter(d => !ids.includes(d.id)))
    ids.forEach(id => firestoreDeleteDocument(id).catch(console.error))
  }

  function viderCorbeille() {
    const ids = corbeilleDocuments.map(d => d.id)
    setCorbeilleDocuments([])
    ids.forEach(id => firestoreDeleteDocument(id).catch(console.error))
  }

  function ajouterReunion(reunion: Reunion) {
    setReunions(prev => [...prev, reunion])
    firestoreAddReunion(reunion).catch(console.error)
  }

  function supprimerReunion(id: string) {
    setReunions(prev => prev.filter(r => r.id !== id))
    firestoreDeleteReunion(id).catch(console.error)
  }

  function setAccesCommissions(acces: AccesCommissions) {
    setAccesCommissionsState(acces)
    saveAcces(acces).catch(console.error)
  }

  function loginUser(user: User) {
    setCurrentUser(user)
    localStorage.setItem("bvap_user_id", user.id)
  }

  function updateUser(user: User) {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u))
    if (currentUser?.id === user.id) {
      setCurrentUser(user)
    }
    const { id, ...data } = user
    firestoreUpdateUser(id, data).catch(console.error)
  }

  function deleteUser(id: string) {
    setUsers(prev => prev.filter(u => u.id !== id))
    firestoreDeleteUser(id).catch(console.error)
  }

  return (
    <AppContext.Provider value={{
      currentUser,
      commissions,
      users,
      loading,
      loadingMessage,
      error,
      documents,
      ajouterDocument,
      modifierDocument,
      supprimerDocument,
      corbeilleDocuments,
      mettreALaCorbeille,
      restaurerDocuments,
      supprimerDefinitivement,
      viderCorbeille,
      reunions,
      ajouterReunion,
      supprimerReunion,
      accesCommissions,
      setAccesCommissions,
      aCommissionAcces,
      estRestreinte,
      droitsSuppression,
      setDroitsSuppression,
      peutSupprimer,
      loginUser,
      updateUser,
      deleteUser,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp doit être utilisé dans AppProvider")
  return ctx
}
