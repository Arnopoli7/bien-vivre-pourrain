export const COMMISSION_COMCOM_ID = "23"

export interface SousDossier {
  id: string
  nom: string
}

export const SOUS_DOSSIERS_COMCOM: SousDossier[] = [
  { id: "finances-contractualisation-leader",  nom: "Finances / Contractualisation / LEADER" },
  { id: "developpement-economique",             nom: "Développement Économique" },
  { id: "petite-enfance-jeunesse",              nom: "Petite Enfance et Enfance Jeunesse" },
  { id: "patrimoine-travaux-accessibilite",     nom: "Patrimoine / Travaux / Accessibilité" },
  { id: "transition-ecologique-habitat",        nom: "Transition Écologique et Habitat" },
  { id: "mobilite-voie-verte",                  nom: "Mobilité / Voie verte" },
  { id: "sante",                                nom: "Santé" },
  { id: "urbanisme-ads",                        nom: "Urbanisme / ADS (Application du Droit des Sols)" },
  { id: "gestion-dechets",                      nom: "Gestion des Déchets" },
  { id: "culture-emdtpf-clea",                  nom: "Culture / EMDTPF (École de Musique, Danse et Théâtre) / CLEA" },
  { id: "ressources-humaines",                  nom: "Ressources Humaines" },
  { id: "filiere-metiers-art-artisanat",        nom: "Filière des Métiers d'Art et Artisanat" },
  { id: "environnement",                        nom: "Environnement (Natura 2000 / Plan paysage / PAT)" },
  { id: "sport-tourisme-associations",          nom: "Sport / Tourisme / Relations avec les associations" },
]
