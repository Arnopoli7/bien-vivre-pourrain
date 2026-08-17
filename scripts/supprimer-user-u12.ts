/**
 * Script ponctuel : supprime UNIQUEMENT le document users/u12 (Céline Boivin)
 * Ne touche à aucune autre collection (comptes_rendus, documents, réunions…).
 *
 * Lancer avec :
 *   npx ts-node --project tsconfig.json scripts/supprimer-user-u12.ts
 */

import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, deleteDoc } from "firebase/firestore"

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

async function main() {
  console.log("Suppression du document users/u12 (Céline Boivin)…")
  await deleteDoc(doc(db, "users", "u12"))
  console.log("✓ Document users/u12 supprimé.")
}

main().catch(err => {
  console.error("Erreur :", err)
  process.exit(1)
})
