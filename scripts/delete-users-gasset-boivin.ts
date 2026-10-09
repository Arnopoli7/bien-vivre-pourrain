/**
 * Script ponctuel : supprime les comptes Frédéric Gasset (u11) et Céline Boivin (u12)
 * de la collection Firestore "users".
 *
 * Lance avec :
 *   npx ts-node --project tsconfig.json scripts/delete-users-gasset-boivin.ts
 */

import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, deleteDoc, getDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey:            "AIzaSyCdydx1nR_7zD0s9zJGT46QJJgJ2qjgt7A",
  authDomain:        "bien-vivre-pourrain.firebaseapp.com",
  projectId:         "bien-vivre-pourrain",
  storageBucket:     "bien-vivre-pourrain.firebasestorage.app",
  messagingSenderId: "936111996771",
  appId:             "1:936111996771:web:8329f180a8f769c0a35d56",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

const IDS_A_SUPPRIMER = [
  { id: "u11", nom: "Frédéric Gasset" },
  { id: "u12", nom: "Céline Boivin" },
]

async function run() {
  console.log("Suppression des comptes Frédéric Gasset (u11) et Céline Boivin (u12)…")

  for (const { id, nom } of IDS_A_SUPPRIMER) {
    const ref = doc(db, "users", id)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      console.log(`  - ${id} (${nom}) : document introuvable (déjà supprimé ou jamais créé).`)
      continue
    }
    await deleteDoc(ref)
    console.log(`  ✓ ${id} (${nom}) supprimé.`)
  }

  console.log("\nTerminé.")
  process.exit(0)
}

run().catch(err => {
  console.error("Erreur :", err)
  process.exit(1)
})
