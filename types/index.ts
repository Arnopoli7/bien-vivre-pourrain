export interface Commission {
  id: string
  nom: string
  nbDocuments?: number
}

export interface CorpsSection {
  titre: string
  contenu: string
}

export interface CompteRendu {
  id: string
  titre?: string        // Titre libre du compte rendu
  commissionId: string
  date: string          // YYYY-MM-DD (date de la réunion)
  mois: number          // 1–12
  annee: number
  presents: string[]
  absentsExcuses: string[]
  ordresDuJour: string[]
  corps: CorpsSection[]
  statut: "brouillon" | "valide"
  redacteur: string
  dateRedaction: string // YYYY-MM-DD
  annexes?: Fichier[]
}

export interface Fichier {
  nom: string
  type: string
  taille: number
  url?: string          // URL Supabase Storage
  storageKey?: string   // clé localStorage (rétrocompatibilité)
  base64?: string       // rétrocompatibilité
  blobUrl?: string      // rétrocompatibilité
}

export interface Document {
  id: string
  titre: string
  commissionId: string
  annee: number
  mois: number   // 1–12
  date: string
  auteur: string
  fichiers: Fichier[]
  type?: string           // ex: "compte_rendu"
  statut?: string         // ex: "validé"
  dateMiseCorbeille?: string  // YYYY-MM-DD, défini si le doc est en corbeille
  nbAnnexes?: number
}

export interface User {
  id: string
  nom: string
  email: string
  identifiant?: string
  role: "maire" | "adjoint" | "conseiller" | "secretaire"
  motDePasse?: string
  motDePasseTemporaire?: boolean
}

export interface Reunion {
  id: string
  commissionId: string
  date: string   // YYYY-MM-DD
  heure: string  // HH:MM
  lieu: string
  titre?: string  // Titre ou objet de la réunion
  presences?: Record<string, "present" | "absent">  // userId → statut
}

export interface Absence {
  id: string
  userId: string
  nomUtilisateur: string
  dateDebut: string   // YYYY-MM-DD
  dateFin: string     // YYYY-MM-DD
  motif?: string
  dateCreation: string  // YYYY-MM-DD
}

// commissionId → liste des userId autorisés
// Si absent du record : accès libre à tous
export type AccesCommissions = Record<string, string[]>

// Niveau de droit de suppression
export type NiveauSuppression = "aucun" | "documents_mois" | "tout"

// userId → niveau de suppression autorisé
export type DroitsSuppression = Record<string, NiveauSuppression>
