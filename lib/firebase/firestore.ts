import {
  collection,
  getDocs,
  doc as firestoreDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  deleteField,
  getDoc,
} from "firebase/firestore"
import { db } from "./config"
import type { Commission, Document, User, CompteRendu, Reunion, AccesCommissions } from "@/types"
import { USERS_AUTH } from "@/lib/auth-data"

// ── COMMISSIONS ──────────────────────────────────────────────────────────────

const COMMISSIONS_INITIALES: Array<{ id: string; nom: string }> = [
  { id: "1",  nom: "Finances" },
  { id: "2",  nom: "Ressources humaines" },
  { id: "3",  nom: "Appel d'offres" },
  { id: "4",  nom: "Impôts directs" },
  { id: "5",  nom: "Délégation S.I.V.U. Belles Vallées" },
  { id: "6",  nom: "Bâtiments — Gros travaux" },
  { id: "7",  nom: "Voirie" },
  { id: "8",  nom: "Bâtiments — Entretien courant" },
  { id: "9",  nom: "Assainissement — Développement durable" },
  { id: "10", nom: "Délégation SDEY" },
  { id: "11", nom: "Délégation Fédération Eaux Puisaye Forterre" },
  { id: "12", nom: "Cimetière" },
  { id: "13", nom: "C.C.A.S." },
  { id: "14", nom: "Communication" },
  { id: "15", nom: "Fêtes — Manifestations — Cérémonies" },
  { id: "16", nom: "Vie associative" },
  { id: "17", nom: "Enfance — Jeunesse — Écoles" },
  { id: "18", nom: "Solidarité — Entraide" },
  { id: "19", nom: "Cadre de vie et économie" },
  { id: "20", nom: "Réunion Maire et Adjoints" },
]

export async function getCommissions(): Promise<Commission[]> {
  const snap = await getDocs(collection(db, "commissions"))
  if (snap.empty) {
    await Promise.all(
      COMMISSIONS_INITIALES.map(({ id, ...data }) =>
        setDoc(firestoreDoc(db, "commissions", id), data)
      )
    )
    return COMMISSIONS_INITIALES as Commission[]
  }
  const existingIds = new Set(snap.docs.map(d => d.id))
  const manquantes = COMMISSIONS_INITIALES.filter(c => !existingIds.has(c.id))
  if (manquantes.length > 0) {
    await Promise.all(
      manquantes.map(({ id, ...data }) =>
        setDoc(firestoreDoc(db, "commissions", id), data)
      )
    )
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Commission).concat(manquantes as Commission[])
}

// ── USERS ─────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, "users"))
  // Si vide ou si les identifiants ne sont pas encore migrés → re-seeder
  const needsMigration = snap.empty || snap.docs.some(d => !d.data().identifiant)
  if (needsMigration) {
    await Promise.all(
      USERS_AUTH.map(({ id, ...data }) =>
        setDoc(firestoreDoc(db, "users", id), data)
      )
    )
    return USERS_AUTH
  }
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as User)
}

export async function getUserByCredentials(identifiant: string, motDePasse: string): Promise<User | null> {
  const snap = await getDocs(collection(db, "users"))
  const found = snap.docs.find(d => {
    const data = d.data()
    return data.identifiant === identifiant && data.motDePasse === motDePasse
  })
  return found ? ({ id: found.id, ...found.data() } as User) : null
}

export async function addUser(user: User): Promise<void> {
  const { id, ...data } = user
  await setDoc(firestoreDoc(db, "users", id), data)
}

export async function updateUser(id: string, data: Partial<Omit<User, "id">>): Promise<void> {
  await updateDoc(firestoreDoc(db, "users", id), data as Record<string, unknown>)
}

export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(firestoreDoc(db, "users", id))
}

// ── DOCUMENTS ────────────────────────────────────────────────────────────────

export async function getDocuments(): Promise<Document[]> {
  const snap = await getDocs(collection(db, "documents"))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Document)
}

export async function addDocument(document: Document): Promise<void> {
  const { id, ...data } = document
  await setDoc(firestoreDoc(db, "documents", id), data)
}

export async function updateDocument(id: string, data: Record<string, unknown>): Promise<void> {
  await updateDoc(firestoreDoc(db, "documents", id), data)
}

export async function deleteDocument(id: string): Promise<void> {
  await deleteDoc(firestoreDoc(db, "documents", id))
}

export async function restaurerDocumentFirestore(id: string): Promise<void> {
  await updateDoc(firestoreDoc(db, "documents", id), { dateMiseCorbeille: deleteField() })
}

// ── COMPTES RENDUS ────────────────────────────────────────────────────────────

export async function getComptesRendus(): Promise<CompteRendu[]> {
  const snap = await getDocs(collection(db, "comptes_rendus"))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as CompteRendu)
}

export async function sauvegarderCompteRenduFirestore(cr: CompteRendu): Promise<void> {
  const { id, ...data } = cr
  await setDoc(firestoreDoc(db, "comptes_rendus", id), data)
}

export async function supprimerCompteRenduFirestore(id: string): Promise<void> {
  await deleteDoc(firestoreDoc(db, "comptes_rendus", id))
}

// ── RÉUNIONS ──────────────────────────────────────────────────────────────────

export async function getReunions(): Promise<Reunion[]> {
  const snap = await getDocs(collection(db, "reunions"))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Reunion)
}

export async function addReunion(reunion: Reunion): Promise<void> {
  const { id, ...data } = reunion
  await setDoc(firestoreDoc(db, "reunions", id), data)
}

export async function deleteReunion(id: string): Promise<void> {
  await deleteDoc(firestoreDoc(db, "reunions", id))
}

// ── ACCÈS AUX COMMISSIONS ─────────────────────────────────────────────────────

export async function getAcces(): Promise<AccesCommissions> {
  const snap = await getDoc(firestoreDoc(db, "settings", "acces"))
  if (!snap.exists()) return {}
  return (snap.data().data ?? {}) as AccesCommissions
}

export async function saveAcces(acces: AccesCommissions): Promise<void> {
  await setDoc(firestoreDoc(db, "settings", "acces"), { data: acces })
}
