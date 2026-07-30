"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onSnapshot, collection } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Commission, Document, User, Reunion, AccesCommissions, DroitsSuppression, NiveauSuppression, Absence } from "@/types"
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
  addReunion as firestoreAddReunion,
  deleteReunion as firestoreDeleteReunion,
  updateReunionPresences,
  updateReunion as firestoreUpdateReunion,
  addAbsence as firestoreAddAbsence,
  deleteAbsence as firestoreDeleteAbsence,
  updateAbsence as firestoreUpdateAbsence,
  getAcces,
  saveAcces,
  getComptesRendus,
  supprimerCompteRenduFirestore,
} from "@/lib/firebase/firestore"

const MAX_TENTATIVES = 3

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
  connexionEchouee: boolean
  documents: Document[]
  ajouterDocument: (doc: Document) => Promise<void>
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
  modifierReunion: (reunion: Reunion) => void
  marquerPresence: (reunionId: string, statut: "present" | "absent") => void
  absences: Absence[]
  ajouterAbsence: (absence: Absence) => void
  supprimerAbsence: (id: string) => void
  modifierAbsence: (absence: Absence) => void
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
  const [absences, setAbsences] = useState<Absence[]>([])
  const [accesCommissions, setAccesCommissionsState] = useState<AccesCommissions>({})
  const [droitsSuppression, setDroitsSuppression] = useState<DroitsSuppression>({})
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("Connexion à Firebase…")
  const [connexionEchouee, setConnexionEchouee] = useState(false)

  useEffect(() => {
    let cancelled = false
    let tentative = 0

    async function chargerDonnees() {
      tentative += 1
      try {
        if (tentative === 1) {
          setLoading(true)
          setLoadingMessage("Connexion à Firebase…")
        }

        const commissionsData = await getCommissions()
        if (cancelled) return

        setLoadingMessage("Chargement des données…")

        const [usersData, acces, docsData] = await Promise.all([
          getUsers(), getAcces(), getDocuments(),
        ])
        if (cancelled) return

        const sortedCommissions = commissionsData.sort((a, b) => Number(a.id) - Number(b.id))
        setCommissions(sortedCommissions)
        setUsers(usersData)
        setDroitsSuppression(getDroitsDefaut(usersData))
        setAccesCommissionsState(acces)

        // ── MIGRATION : s'exécute à chaque démarrage — vérifie par compteRenduId ──
        let allDocs = docsData
        try {
          const comptesRendus = await getComptesRendus()
          const valides = comptesRendus.filter(cr => cr.statut === "valide")

          // Index des compteRenduId déjà présents dans la collection documents
          const existingCrIds = new Set(
            docsData.map(d => d.compteRenduId).filter((id): id is string => !!id)
          )

          const commissionMap = new Map(sortedCommissions.map(c => [c.id, c.nom]))

          const missingDocs: Document[] = valides
            .filter(cr => {
              const deja = existingCrIds.has(cr.id)
              if (!deja) console.log(`[Migration] CR manquant : "${cr.titre}" (id=${cr.id}, commission=${cr.commissionId}, date=${cr.date})`)
              return !deja
            })
            .map(cr => {
              const annexes = cr.annexes ?? []
              return {
                id: `doc-cr-${cr.id}`,
                titre: cr.titre ?? "Sans titre",
                commissionId: cr.commissionId,
                commission: commissionMap.get(cr.commissionId) ?? "",
                annee: cr.annee,
                mois: cr.mois,
                date: cr.date,
                auteur: cr.redacteur,
                fichiers: annexes,
                type: "compte_rendu",
                statut: "validé",
                compteRenduId: cr.id,
                nbAnnexes: annexes.length || 0,
                ...(cr.sousDossier ? { sousDossier: cr.sousDossier } : {}),
              }
            })

          console.log(`[Migration] ${valides.length} CRs validés | ${existingCrIds.size} documents existants | ${missingDocs.length} à créer`)

          if (missingDocs.length > 0) {
            for (const doc of missingDocs) {
              await firestoreAddDocument(doc)
              console.log(`[Migration] ✓ Créé : "${doc.titre}" → commissionId=${doc.commissionId} (${doc.date})`)
            }
            allDocs = [...docsData, ...missingDocs]
            console.log(`[Migration] ✓ ${missingDocs.length} document(s) créé(s)`)
          } else {
            console.log("[Migration] ✓ Aucun document manquant")
          }
        } catch (migErr) {
          console.error("[Migration] Erreur (non bloquante) :", migErr)
        }

        if (cancelled) return

        setDocuments(allDocs.filter(d => !d.dateMiseCorbeille))
        setCorbeilleDocuments(allDocs.filter(d => !!d.dateMiseCorbeille))
        const userId = typeof window !== "undefined" ? localStorage.getItem("bvap_user_id") : null
        const found = userId ? usersData.find(u => u.id === userId) : null
        setCurrentUser(found ?? usersData[0] ?? null)

        // Succès — réinitialiser l'indicateur d'échec
        setConnexionEchouee(false)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        console.error(`[Firebase] Tentative ${tentative} échouée :`, err)

        // Afficher l'indicateur discret seulement après MAX_TENTATIVES échecs
        if (tentative >= MAX_TENTATIVES) {
          setConnexionEchouee(true)
          setLoading(false)
        }

        // Réessayer silencieusement toutes les 5 secondes
        setTimeout(() => {
          if (!cancelled) chargerDonnees()
        }, 5000)
      }
    }

    chargerDonnees()
    return () => { cancelled = true }
  }, [])

  // Écoute temps réel des réunions
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "reunions"),
      snap => { setReunions(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Reunion)) },
      err => { console.error("onSnapshot réunions :", err) }
    )
    return () => unsubscribe()
  }, [])

  // Écoute temps réel des absences
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "absences"),
      snap => { setAbsences(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Absence)) },
      err => { console.error("onSnapshot absences :", err) }
    )
    return () => unsubscribe()
  }, [])

  function aCommissionAcces(commissionId: string): boolean {
    if (commissionId === "20") {
      return currentUser?.role === "maire" || currentUser?.role === "adjoint" || currentUser?.role === "secretaire"
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
    if (currentUser.role === "conseiller") return false
    const droits: NiveauSuppression = droitsSuppression[currentUser.id] ?? "aucun"
    if (droits === "aucun") return false
    if (droits === "documents_mois") return niveau === "document" || niveau === "mois"
    return true
  }

  async function ajouterDocument(doc: Document): Promise<void> {
    setDocuments(prev => {
      const exists = prev.some(d => d.id === doc.id)
      if (exists) return prev.map(d => d.id === doc.id ? doc : d)
      return [...prev, doc]
    })
    await firestoreAddDocument(doc)
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
      // Si c'est un compte rendu validé, supprimer aussi dans comptes_rendus
      if (d.type === "compte_rendu" && d.compteRenduId) {
        supprimerCompteRenduFirestore(d.compteRenduId).catch(console.error)
      }
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
    firestoreAddReunion(reunion).catch(console.error)
  }

  function supprimerReunion(id: string) {
    firestoreDeleteReunion(id).catch(console.error)
  }

  function modifierReunion(reunion: Reunion) {
    const { id, ...data } = reunion
    firestoreUpdateReunion(id, data).catch(console.error)
  }

  function marquerPresence(reunionId: string, statut: "present" | "absent") {
    if (!currentUser) return
    const reunion = reunions.find(r => r.id === reunionId)
    const updatedPresences = { ...(reunion?.presences ?? {}), [currentUser.id]: statut }
    updateReunionPresences(reunionId, updatedPresences).catch(console.error)
  }

  function ajouterAbsence(absence: Absence) {
    firestoreAddAbsence(absence).catch(console.error)
  }

  function supprimerAbsence(id: string) {
    firestoreDeleteAbsence(id).catch(console.error)
  }

  function modifierAbsence(absence: Absence) {
    const { id, ...data } = absence
    firestoreUpdateAbsence(id, data).catch(console.error)
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
    if (currentUser?.id === user.id) setCurrentUser(user)
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
      connexionEchouee,
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
      modifierReunion,
      marquerPresence,
      absences,
      ajouterAbsence,
      supprimerAbsence,
      modifierAbsence,
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
