import type { CompteRendu } from "@/types"
import {
  getComptesRendus,
  sauvegarderCompteRenduFirestore,
  supprimerCompteRenduFirestore,
} from "@/lib/firebase/firestore"

export async function lireComptesRendus(): Promise<CompteRendu[]> {
  return getComptesRendus()
}

export async function sauvegarderCompteRendu(cr: CompteRendu): Promise<void> {
  return sauvegarderCompteRenduFirestore(cr)
}

export async function supprimerCompteRendu(id: string): Promise<void> {
  return supprimerCompteRenduFirestore(id)
}
