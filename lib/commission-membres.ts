export const MEMBRES_COMMISSIONS: Record<string, string[]> = {
  "Finances": ["Pierre Maison", "Pascal Bellanger", "Anne Virtel", "Claire Vandaele", "Mélanie Darcel", "Frédéric Gasset", "Flavie Maison"],
  "Ressources humaines": ["Pierre Maison", "Pascal Bellanger", "Anne Virtel", "Arnaud Poli"],
  "Appel d'offres": ["Pierre Maison", "Pascal Bellanger", "François Petit", "Frédéric Gasset", "Denis Boivin"],
  "Impôts directs": ["Pierre Maison", "Pascal Bellanger"],
  "Bâtiments Gros travaux": ["Pierre Maison", "Pascal Bellanger", "Anne Virtel", "Claire Vandaele", "Mélanie Darcel", "Adélina Gallet", "François Petit", "Awa Kouyate", "Frédéric Gasset", "Céline Boivin", "Denis Boivin", "Quentin Bellanger"],
  "Voirie": ["Pierre Maison", "Pascal Bellanger", "Denis Boivin", "Quentin Bellanger", "Yves Malaurent"],
  "Bâtiments Entretien courant": ["Pascal Bellanger", "Anne Virtel", "Mélanie Darcel", "Frédéric Gasset", "Denis Boivin", "Flavie Maison", "Quentin Bellanger", "Yves Malaurent"],
  "Assainissement": ["Pierre Maison", "Pascal Bellanger", "Claire Vandaele", "François Petit", "Denis Boivin", "Maryline Ventura"],
  "Cimetière": ["Pascal Bellanger", "Anne Virtel", "Flavie Maison", "Yves Malaurent"],
  "C.C.A.S.": ["Anne Virtel", "Claire Vandaele", "Adélina Gallet", "Awa Kouyate", "Céline Boivin"],
  "Communication": ["Anne Virtel", "Claire Vandaele", "Adélina Gallet", "Gilles Laburthe"],
  "Fêtes Manifestations Cérémonies": ["Anne Virtel", "Pascal Bellanger", "Gilles Laburthe", "Mélanie Darcel"],
  "Vie associative": ["Anne Virtel", "Claire Vandaele", "Adélina Gallet", "Gilles Laburthe", "Frédéric Gasset", "Awa Kouyate", "Céline Boivin", "Maryline Ventura"],
  "Enfance Jeunesse Écoles": ["Anne Virtel", "Arnaud Poli", "Mélanie Darcel", "Adélina Gallet", "Frédéric Gasset", "Quentin Bellanger", "Maryline Ventura"],
  "Solidarité Entraide": ["Anne Virtel", "Arnaud Poli", "Adélina Gallet", "Awa Kouyate", "Céline Boivin"],
  "Cadre de vie et économie": ["Pierre Maison", "Arnaud Poli", "Claire Vandaele", "Adélina Gallet", "Flavie Maison", "Maryline Ventura"],
  "Conseil Municipal": ["Pierre Maison", "Pascal Bellanger", "Anne Virtel", "Arnaud Poli", "Claire Vandaele", "Mélanie Darcel", "Gilles Laburthe", "Adélina Gallet", "François Petit", "Awa Kouyate", "Frédéric Gasset", "Céline Boivin", "Denis Boivin", "Flavie Maison", "Quentin Bellanger", "Maryline Ventura", "Yves Malaurent"],
  "Réunion Maire et Adjoints": ["Pierre Maison", "Pascal Bellanger", "Anne Virtel", "Arnaud Poli"],
}

// Mapping commission ID → membres (IDs from firestore.ts)
export const MEMBRES_PAR_COMMISSION_ID: Record<string, string[]> = {
  "1":  MEMBRES_COMMISSIONS["Finances"],
  "2":  MEMBRES_COMMISSIONS["Ressources humaines"],
  "3":  MEMBRES_COMMISSIONS["Appel d'offres"],
  "4":  MEMBRES_COMMISSIONS["Impôts directs"],
  "6":  MEMBRES_COMMISSIONS["Bâtiments Gros travaux"],
  "7":  MEMBRES_COMMISSIONS["Voirie"],
  "8":  MEMBRES_COMMISSIONS["Bâtiments Entretien courant"],
  "9":  MEMBRES_COMMISSIONS["Assainissement"],
  "12": MEMBRES_COMMISSIONS["Cimetière"],
  "13": MEMBRES_COMMISSIONS["C.C.A.S."],
  "14": MEMBRES_COMMISSIONS["Communication"],
  "15": MEMBRES_COMMISSIONS["Fêtes Manifestations Cérémonies"],
  "16": MEMBRES_COMMISSIONS["Vie associative"],
  "17": MEMBRES_COMMISSIONS["Enfance Jeunesse Écoles"],
  "18": MEMBRES_COMMISSIONS["Solidarité Entraide"],
  "19": MEMBRES_COMMISSIONS["Cadre de vie et économie"],
  "20": MEMBRES_COMMISSIONS["Réunion Maire et Adjoints"],
  "21": MEMBRES_COMMISSIONS["Conseil Municipal"],
}

export function getMembresCommission(commissionId: string): string[] {
  return MEMBRES_PAR_COMMISSION_ID[commissionId] ?? []
}
