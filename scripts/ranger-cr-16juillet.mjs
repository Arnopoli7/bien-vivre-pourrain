import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCdydx1nR_7zD0s9zJGT46QJJgJ2qjgt7A",
  authDomain: "bien-vivre-pourrain.firebaseapp.com",
  projectId: "bien-vivre-pourrain",
  storageBucket: "bien-vivre-pourrain.firebasestorage.app",
  messagingSenderId: "936111996771",
  appId: "1:936111996771:web:8329f180a8f769c0a35d56",
}

const COMCOM_ID = "23"
const SOUS_DOSSIER_ID = "gestion-dechets"
const DATE_CIBLE = "2026-07-16"

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

let totalModifies = 0

// ── documents ──────────────────────────────────────────────────────────────────
console.log("\n--- Collection 'documents' ---")
const docsSnap = await getDocs(
  query(
    collection(db, "documents"),
    where("commissionId", "==", COMCOM_ID),
    where("date", "==", DATE_CIBLE)
  )
)

if (docsSnap.empty) {
  console.log("  Aucun document trouvé pour cette date.")
} else {
  for (const d of docsSnap.docs) {
    const data = d.data()
    if (!data.sousDossier) {
      await updateDoc(doc(db, "documents", d.id), { sousDossier: SOUS_DOSSIER_ID })
      console.log(`  OK  "${data.titre}" (id=${d.id})`)
      console.log(`      sousDossier : (vide) → "${SOUS_DOSSIER_ID}"`)
      totalModifies++
    } else {
      console.log(`  SKIP  "${data.titre}" — déjà classé dans "${data.sousDossier}"`)
    }
  }
}

// ── comptes_rendus ─────────────────────────────────────────────────────────────
console.log("\n--- Collection 'comptes_rendus' ---")
const crsSnap = await getDocs(
  query(
    collection(db, "comptes_rendus"),
    where("commissionId", "==", COMCOM_ID),
    where("date", "==", DATE_CIBLE)
  )
)

if (crsSnap.empty) {
  console.log("  Aucun compte rendu trouvé pour cette date.")
} else {
  for (const d of crsSnap.docs) {
    const data = d.data()
    if (!data.sousDossier) {
      await updateDoc(doc(db, "comptes_rendus", d.id), { sousDossier: SOUS_DOSSIER_ID })
      console.log(`  OK  "${data.titre}" (id=${d.id})`)
      console.log(`      sousDossier : (vide) → "${SOUS_DOSSIER_ID}"`)
      totalModifies++
    } else {
      console.log(`  SKIP  "${data.titre}" — déjà classé dans "${data.sousDossier}"`)
    }
  }
}

console.log(`\nTerminé. ${totalModifies} enregistrement(s) mis à jour.`)
process.exit(0)
