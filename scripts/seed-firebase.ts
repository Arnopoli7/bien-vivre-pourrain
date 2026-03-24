/**
 * Script de seed Firebase
 * Lance avec : npx ts-node --project tsconfig.json scripts/seed-firebase.ts
 *
 * Ce script insère dans Firestore :
 *   - Les 20 commissions municipales
 *   - Les 17 utilisateurs avec leurs rôles
 */

import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, setDoc } from "firebase/firestore"

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

// ── COMMISSIONS ───────────────────────────────────────────────────────────────

const commissions = [
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

// ── UTILISATEURS ──────────────────────────────────────────────────────────────

const users = [
  { id: "u1",  nom: "Pierre Maison",     email: "p.maison@pourrain.fr",     role: "maire",      motDePasse: "maire2024" },
  { id: "u2",  nom: "Pascal Bellanger",  email: "p.bellanger@pourrain.fr",  role: "adjoint",    motDePasse: "adjoint2024" },
  { id: "u3",  nom: "Anne Virtel",       email: "a.virtel@pourrain.fr",     role: "adjoint",    motDePasse: "adjoint2024" },
  { id: "u4",  nom: "Arnaud Poli",       email: "a.poli@pourrain.fr",       role: "adjoint",    motDePasse: "adjoint2024" },
  { id: "u5",  nom: "Claire Vandaele",   email: "c.vandaele@pourrain.fr",   role: "conseiller", motDePasse: "conseil2024" },
  { id: "u6",  nom: "Mélanie Darcel",    email: "m.darcel@pourrain.fr",     role: "conseiller", motDePasse: "conseil2024" },
  { id: "u7",  nom: "Gilles Laburthe",   email: "g.laburthe@pourrain.fr",   role: "conseiller", motDePasse: "conseil2024" },
  { id: "u8",  nom: "Adélina Gallet",    email: "a.gallet@pourrain.fr",     role: "conseiller", motDePasse: "conseil2024" },
  { id: "u9",  nom: "François Petit",    email: "f.petit@pourrain.fr",      role: "conseiller", motDePasse: "conseil2024" },
  { id: "u10", nom: "Awa Kouyate",       email: "a.kouyate@pourrain.fr",    role: "conseiller", motDePasse: "conseil2024" },
  { id: "u11", nom: "Frédéric Gasset",   email: "f.gasset@pourrain.fr",     role: "conseiller", motDePasse: "conseil2024" },
  { id: "u12", nom: "Céline Boivin",     email: "c.boivin@pourrain.fr",     role: "conseiller", motDePasse: "conseil2024" },
  { id: "u13", nom: "Denis Boivin",      email: "d.boivin@pourrain.fr",     role: "conseiller", motDePasse: "conseil2024" },
  { id: "u14", nom: "Flavie Maison",     email: "fl.maison@pourrain.fr",    role: "conseiller", motDePasse: "conseil2024" },
  { id: "u15", nom: "Quentin Bellanger", email: "q.bellanger@pourrain.fr",  role: "conseiller", motDePasse: "conseil2024" },
  { id: "u16", nom: "Maryline Ventura",  email: "m.ventura@pourrain.fr",    role: "conseiller", motDePasse: "conseil2024" },
  { id: "u17", nom: "Yves Malaurent",    email: "y.malaurent@pourrain.fr",  role: "conseiller", motDePasse: "conseil2024" },
]

// ── SEED ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Démarrage du seed Firebase…")

  console.log("📋 Insertion des commissions…")
  for (const c of commissions) {
    const { id, ...data } = c
    await setDoc(doc(db, "commissions", id), data)
    console.log(`  ✓ Commission ${id} — ${c.nom}`)
  }

  console.log("👥 Insertion des utilisateurs…")
  for (const u of users) {
    const { id, ...data } = u
    await setDoc(doc(db, "users", id), data)
    console.log(`  ✓ Utilisateur ${id} — ${u.nom} (${u.role})`)
  }

  console.log("\n✅ Seed terminé avec succès !")
  console.log(`   ${commissions.length} commissions insérées (dont "Réunion Maire et Adjoints" — visible Maire/Adjoints uniquement)`)
  console.log(`   ${users.length} utilisateurs insérés`)
  process.exit(0)
}

seed().catch(err => {
  console.error("❌ Erreur lors du seed :", err)
  process.exit(1)
})
