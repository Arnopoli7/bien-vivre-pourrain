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

const TITRES = ["Point avec l'équipe technique", "Point CPI"]
const NOM_COMMISSION_CIBLE = "Ressources humaines"

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// 1. Récupérer l'id de la commission "Ressources humaines"
console.log(`\nRecherche de la commission "${NOM_COMMISSION_CIBLE}"…`)
const commissionsSnap = await getDocs(collection(db, "commissions"))
let rhId = null
let rhNom = null
for (const d of commissionsSnap.docs) {
  const data = d.data()
  if (data.nom === NOM_COMMISSION_CIBLE) {
    rhId = d.id
    rhNom = data.nom
    break
  }
}

if (!rhId) {
  console.error(`ERREUR : commission "${NOM_COMMISSION_CIBLE}" introuvable dans Firestore.`)
  process.exit(1)
}
console.log(`Commission trouvée : "${rhNom}" (id=${rhId})`)

// Helper : traiter une collection
async function transfererDansCollection(nomCollection) {
  console.log(`\n--- Collection "${nomCollection}" ---`)
  const snap = await getDocs(collection(db, nomCollection))
  let modifies = 0

  for (const d of snap.docs) {
    const data = d.data()
    if (TITRES.includes(data.titre)) {
      const ancienneCommission = data.commission ?? data.commissionId ?? "?"
      await updateDoc(doc(db, nomCollection, d.id), {
        commission: NOM_COMMISSION_CIBLE,
        commissionId: rhId,
      })
      console.log(
        `  OK  "${data.titre}" (id=${d.id})` +
        `\n       commission : "${ancienneCommission}" → "${NOM_COMMISSION_CIBLE}"` +
        `\n       commissionId : "${data.commissionId ?? "?"}" → "${rhId}"`
      )
      modifies++
    }
  }

  if (modifies === 0) {
    console.log("  Aucun document correspondant trouvé.")
  } else {
    console.log(`  ${modifies} document(s) modifié(s).`)
  }
  return modifies
}

const totalDocs = await transfererDansCollection("documents")
const totalCRs = await transfererDansCollection("comptes_rendus")

console.log(`\nTerminé. ${totalDocs + totalCRs} document(s) mis à jour au total.`)
process.exit(0)
