export const COMMISSION_COMCOM_ID = "23"

export interface SousDossier {
  id: string
  nom: string
  emoji: string
}

export const SOUS_DOSSIERS_COMCOM: SousDossier[] = [
  { id: "finances-contractualisation-leader",  nom: "Finances / Contractualisation / LEADER",                         emoji: "💰" },
  { id: "developpement-economique",             nom: "Développement Économique",                                        emoji: "📈" },
  { id: "petite-enfance-jeunesse",              nom: "Petite Enfance et Enfance Jeunesse",                              emoji: "👶" },
  { id: "patrimoine-travaux-accessibilite",     nom: "Patrimoine / Travaux / Accessibilité",                            emoji: "🏛️" },
  { id: "transition-ecologique-habitat",        nom: "Transition Écologique et Habitat",                                emoji: "🌱" },
  { id: "mobilite-voie-verte",                  nom: "Mobilité / Voie verte",                                           emoji: "🚲" },
  { id: "sante",                                nom: "Santé",                                                           emoji: "⚕️" },
  { id: "urbanisme-ads",                        nom: "Urbanisme / ADS (Application du Droit des Sols)",                 emoji: "🏗️" },
  { id: "gestion-dechets",                      nom: "Gestion des Déchets",                                             emoji: "♻️" },
  { id: "culture-emdtpf-clea",                  nom: "Culture / EMDTPF (École de Musique, Danse et Théâtre) / CLEA",   emoji: "🎭" },
  { id: "ressources-humaines",                  nom: "Ressources Humaines",                                             emoji: "👥" },
  { id: "filiere-metiers-art-artisanat",        nom: "Filière des Métiers d'Art et Artisanat",                          emoji: "🎨" },
  { id: "environnement",                        nom: "Environnement (Natura 2000 / Plan paysage / PAT)",                emoji: "🌳" },
  { id: "sport-tourisme-associations",          nom: "Sport / Tourisme / Relations avec les associations",              emoji: "⚽" },
]
