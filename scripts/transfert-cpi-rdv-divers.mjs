import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCdydx1nR_7zD0s9zJGT46QJJgJ2qjgt7A",
  authDomain: "bien-vivre-pourrain.firebaseapp.com",
  projectId: "bien-vivre-pourrain",
  storageBucket: "bien-vivre-pourrain.firebasestorage.app",
  messagingSenderId: "936111996771",
  appId: "1:936111996771:web:8329f180a8f769c0a35d56",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// 1. Trouver l'id de la commission "RDV Divers"
console.log('\nRecherche de la commission "RDV Divers"…')
const commissionsSnap = await getDocs(collection(db, "commissions"))
let rdvId = null
for (const d of commissionsSnap.docs) {
  if (d.data().nom === "RDV Divers") {
    rdvId = d.id
    break
  }
}
if (!rdvId) {
  console.error('ERREUR : commission "RDV Divers" introuvable dans Firestore.')
  process.exit(1)
}
console.log(`Commission "RDV Divers" trouvée (id=${rdvId})`)

// 2. Trouver le compte rendu CPI dans "Ressources humaines"
console.log('\nRecherche du compte rendu CPI dans "comptes_rendus"…')
const crsSnap = await getDocs(collection(db, "comptes_rendus"))
let crId = null
for (const d of crsSnap.docs) {
  const data = d.data()
  const titre = data.titre ?? ""
  if (titre.includes("CPI")) {
    console.log(`  Trouvé : "${titre}" (id=${d.id}, commissionId=${data.commissionId})`)
    await updateDoc(doc(db, "comptes_rendus", d.id), {
      commission: "RDV Divers",
      commissionId: rdvId,
    })
    console.log(`  Mis à jour : commissionId → ${rdvId}, commission → "RDV Divers"`)
    crId = d.id
  }
}
if (!crId) {
  console.log('  Aucun compte rendu avec "CPI" dans le titre.')
}

// 3. Mettre à jour les documents liés
console.log('\nRecherche des documents liés dans "documents"…')
const docsSnap = await getDocs(collection(db, "documents"))
let nbDocs = 0
for (const d of docsSnap.docs) {
  const data = d.data()
  if (
    (crId && data.compteRenduId === crId) ||
    ((data.titre ?? "").includes("CPI") && data.commissionId !== rdvId)
  ) {
    console.log(`  Trouvé : "${data.titre}" (id=${d.id}, commissionId=${data.commissionId})`)
    await updateDoc(doc(db, "documents", d.id), {
      commission: "RDV Divers",
      commissionId: rdvId,
    })
    console.log(`  Mis à jour : commissionId → ${rdvId}, commission → "RDV Divers"`)
    nbDocs++
  }
}
if (nbDocs === 0) {
  console.log("  Aucun document lié trouvé.")
}

console.log(`\nTerminé. ${crId ? 1 : 0} compte(s) rendu(s) + ${nbDocs} document(s) mis à jour.`)
process.exit(0)
