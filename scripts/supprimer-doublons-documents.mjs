import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore"

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

console.log("\nRecherche des doublons dans la collection 'documents'…")

const snap = await getDocs(collection(db, "documents"))
const docs = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }))

console.log(`${docs.length} documents trouvés au total.`)

// Grouper par clé (titre + commissionId)
const groupes = {}
for (const d of docs) {
  const cle = `${d.titre ?? ""}__${d.commissionId ?? ""}`
  if (!groupes[cle]) groupes[cle] = []
  groupes[cle].push(d)
}

// Trouver les groupes avec doublons
const doublons = Object.entries(groupes).filter(([, groupe]) => groupe.length > 1)

if (doublons.length === 0) {
  console.log("\n✅ Aucun doublon trouvé.")
  process.exit(0)
}

console.log(`\n⚠️  ${doublons.length} groupe(s) de doublons trouvés :\n`)

let totalSupprimes = 0

for (const [cle, groupe] of doublons) {
  console.log(`  Titre+Commission : "${cle}"`)
  console.log(`  ${groupe.length} exemplaires :`)

  // Trier du plus ancien au plus récent (par date, puis dateCreation, puis id)
  groupe.sort((a, b) => {
    const dateA = a.date ?? a.dateCreation ?? a.id
    const dateB = b.date ?? b.dateCreation ?? b.id
    return dateA < dateB ? -1 : dateA > dateB ? 1 : 0
  })

  for (let i = 0; i < groupe.length; i++) {
    const d = groupe[i]
    const label = i === groupe.length - 1 ? "✓ CONSERVÉ" : "✗ DOUBLON (à supprimer)"
    console.log(`    [${label}] id=${d.id} | date=${d.date ?? "?"} | auteur=${d.auteur ?? "?"}`)
  }

  // Supprimer tous sauf le dernier (le plus récent)
  const aSupprimer = groupe.slice(0, -1)
  for (const d of aSupprimer) {
    await deleteDoc(doc(db, "documents", d.id))
    console.log(`  🗑️  Supprimé : id=${d.id} ("${d.titre}")`)
    totalSupprimes++
  }
  console.log()
}

console.log(`✅ Suppression terminée : ${totalSupprimes} doublon(s) supprimé(s).`)
