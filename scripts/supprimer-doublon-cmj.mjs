import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore"

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

const TITRE_CIBLE       = "CONSEIL MUNICIPAL DES JEUNES"
const COMMISSION_ID     = "17"  // "Enfance — Jeunesse — Écoles"

// ── 1. DOCUMENTS ──────────────────────────────────────────────────────────────

console.log(`\n── Collection "documents" ────────────────────────────────`)
console.log(`Recherche : titre="${TITRE_CIBLE}" | commissionId="${COMMISSION_ID}"`)

const docsSnap = await getDocs(
  query(
    collection(db, "documents"),
    where("titre", "==", TITRE_CIBLE),
    where("commissionId", "==", COMMISSION_ID)
  )
)

if (docsSnap.empty) {
  console.log("  Aucun document trouvé avec ces critères.")
} else {
  const docs = docsSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
  console.log(`  ${docs.length} document(s) trouvé(s) :`)
  docs.forEach(d => {
    console.log(`    id=${d.id} | date=${d.date ?? "?"} | createdAt=${d.createdAt ?? d.valideAt ?? "N/A"} | auteur=${d.auteur ?? "?"}`)
  })

  if (docs.length < 2) {
    console.log("  → Pas de doublon à supprimer.")
  } else {
    // Trier par createdAt desc (le plus récent en premier)
    // Fallback : valideAt, puis date, puis id
    docs.sort((a, b) => {
      const ta = a.createdAt ?? a.valideAt ?? a.date ?? a.id
      const tb = b.createdAt ?? b.valideAt ?? b.date ?? b.id
      return ta > tb ? -1 : ta < tb ? 1 : 0
    })

    const [garder, ...supprimer] = docs
    console.log(`\n  ✓ CONSERVÉ  : id=${garder.id}`)
    for (const d of supprimer) {
      await deleteDoc(doc(db, "documents", d.id))
      console.log(`  🗑️  SUPPRIMÉ  : id=${d.id}`)
    }
    console.log(`  → ${supprimer.length} doublon(s) supprimé(s) dans "documents".`)
  }
}

// ── 2. COMPTES_RENDUS ─────────────────────────────────────────────────────────

console.log(`\n── Collection "comptes_rendus" ───────────────────────────`)
console.log(`Recherche : titre="${TITRE_CIBLE}" | commissionId="${COMMISSION_ID}"`)

const crsSnap = await getDocs(
  query(
    collection(db, "comptes_rendus"),
    where("titre", "==", TITRE_CIBLE),
    where("commissionId", "==", COMMISSION_ID)
  )
)

if (crsSnap.empty) {
  console.log("  Aucun compte rendu trouvé avec ces critères.")
} else {
  const crs = crsSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
  console.log(`  ${crs.length} compte(s) rendu(s) trouvé(s) :`)
  crs.forEach(d => {
    console.log(`    id=${d.id} | date=${d.date ?? "?"} | dateRedaction=${d.dateRedaction ?? "N/A"} | redacteur=${d.redacteur ?? "?"}`)
  })

  if (crs.length < 2) {
    console.log("  → Pas de doublon à supprimer.")
  } else {
    crs.sort((a, b) => {
      const ta = a.dateRedaction ?? a.date ?? a.id
      const tb = b.dateRedaction ?? b.date ?? b.id
      return ta > tb ? -1 : ta < tb ? 1 : 0
    })

    const [garder, ...supprimer] = crs
    console.log(`\n  ✓ CONSERVÉ  : id=${garder.id}`)
    for (const d of supprimer) {
      await deleteDoc(doc(db, "comptes_rendus", d.id))
      console.log(`  🗑️  SUPPRIMÉ  : id=${d.id}`)
    }
    console.log(`  → ${supprimer.length} doublon(s) supprimé(s) dans "comptes_rendus".`)
  }
}

console.log("\n✅ Terminé.\n")
