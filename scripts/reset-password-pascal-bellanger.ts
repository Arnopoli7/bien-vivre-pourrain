/**
 * Script ponctuel : réinitialise le mot de passe de Pascal Bellanger (u2)
 * dans la collection Firestore "users".
 *
 * Lance avec :
 *   npx ts-node --project tsconfig.json scripts/reset-password-pascal-bellanger.ts
 */

import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore"

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

async function run() {
  const ref = doc(db, "users", "u2")
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    console.error("Erreur : document u2 (Pascal Bellanger) introuvable dans Firestore.")
    process.exit(1)
  }

  const data = snap.data()
  console.log(`Compte trouvé : ${data.nom} (identifiant : ${data.identifiant})`)
  console.log(`Mot de passe actuel dans Firestore : ${data.motDePasse}`)

  await updateDoc(ref, {
    motDePasse: "Pourrain2026!",
    motDePasseTemporaire: true,
  })

  console.log("✓ Mot de passe réinitialisé à : Pourrain2026!")
  console.log("✓ motDePasseTemporaire remis à true (Pascal pourra choisir un nouveau mdp à la connexion)")
  console.log("\nTerminé.")
  process.exit(0)
}

run().catch(err => {
  console.error("Erreur :", err)
  process.exit(1)
})
