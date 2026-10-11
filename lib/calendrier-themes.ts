// Calendrier des thèmes automatiques
// Les dates mobiles (Nouvel An chinois, Carnaval, Pâques) sont données pour 2026.
// À mettre à jour chaque année pour ces trois entrées.

export interface ThemeCalendrier {
  id: string
  nom: string
  debut: string   // "MM-DD" (année courante)
  fin: string     // "MM-DD"
  couleur: string // clé couleur partagée avec le système bannière
  texteBanniere: string
  emoji: string
}

// Ordre : si deux événements se chevauchent, le premier dans ce tableau avec la fin
// la plus proche sera affiché. En cas d'égalité de fin, le début le plus récent l'emporte.
export const CALENDRIER_THEMES: ThemeCalendrier[] = [
  {
    id: "bonne-annee",
    nom: "Bonne année",
    debut: "01-01", fin: "01-01",
    couleur: "dore",
    texteBanniere: "Bonne année !",
    emoji: "🎉",
  },
  {
    id: "epiphanie",
    nom: "Épiphanie",
    debut: "01-06", fin: "01-06",
    couleur: "dore",
    texteBanniere: "Épiphanie",
    emoji: "👑",
  },
  {
    id: "chandeleur",
    nom: "Chandeleur",
    debut: "01-30", fin: "02-02",
    couleur: "dore",
    texteBanniere: "Chandeleur",
    emoji: "🥞",
  },
  {
    id: "valentin",
    nom: "Saint-Valentin",
    debut: "02-11", fin: "02-14",
    couleur: "rose",
    texteBanniere: "Saint-Valentin",
    emoji: "❤️",
  },
  // 2026 : Carnaval / Mardi Gras — à recalculer chaque année
  {
    id: "carnaval",
    nom: "Carnaval / Mardi Gras",
    debut: "02-13", fin: "02-17",
    couleur: "violet",
    texteBanniere: "Carnaval",
    emoji: "🎭",
  },
  // 2026 : Nouvel An chinois — à recalculer chaque année
  {
    id: "nouvel-an-cn",
    nom: "Nouvel An chinois",
    debut: "02-13", fin: "02-17",
    couleur: "rouge",
    texteBanniere: "Nouvel An chinois",
    emoji: "🐉",
  },
  {
    id: "femmes",
    nom: "Journée des droits des femmes",
    debut: "03-05", fin: "03-08",
    couleur: "violet",
    texteBanniere: "8 mars",
    emoji: "♀️",
  },
  // 2026 : Pâques — à recalculer chaque année
  {
    id: "paques",
    nom: "Pâques",
    debut: "04-02", fin: "04-05",
    couleur: "pastel",
    texteBanniere: "Joyeuses Pâques",
    emoji: "🐣",
  },
  {
    id: "travail",
    nom: "Fête du Travail",
    debut: "04-28", fin: "05-01",
    couleur: "vert",
    texteBanniere: "1er mai",
    emoji: "🌷",
  },
  {
    id: "victoire",
    nom: "Victoire 1945",
    debut: "05-05", fin: "05-08",
    couleur: "bleu",
    texteBanniere: "8 mai – Souvenir",
    emoji: "🌺",
  },
  {
    id: "musique",
    nom: "Fête de la musique",
    debut: "06-18", fin: "06-21",
    couleur: "multicolore",
    texteBanniere: "Fête de la musique",
    emoji: "🎶",
  },
  {
    id: "nationale",
    nom: "Fête nationale",
    debut: "07-11", fin: "07-14",
    couleur: "bleu-blanc-rouge",
    texteBanniere: "14 juillet",
    emoji: "🎆",
  },
  {
    id: "octobre-rose",
    nom: "Octobre Rose",
    debut: "10-01", fin: "10-31",
    couleur: "rose",
    texteBanniere: "Octobre Rose – soutenons la lutte contre le cancer du sein",
    emoji: "🎀",
  },
  {
    id: "halloween",
    nom: "Halloween",
    debut: "10-28", fin: "10-31",
    couleur: "orange",
    texteBanniere: "Halloween",
    emoji: "🎃",
  },
  {
    id: "novembre-bleu",
    nom: "Novembre Bleu",
    debut: "11-01", fin: "11-30",
    couleur: "bleu",
    texteBanniere: "Novembre Bleu – santé masculine",
    emoji: "💙",
  },
  {
    id: "telethon",
    nom: "Téléthon",
    debut: "12-02", fin: "12-06",
    couleur: "rouge",
    texteBanniere: "Téléthon",
    emoji: "❤️",
  },
  {
    id: "fin-annee",
    nom: "Fêtes de fin d'année",
    debut: "12-24", fin: "12-31",
    couleur: "rouge-vert",
    texteBanniere: "Bonnes fêtes de fin d'année",
    emoji: "🎄",
  },
]

/**
 * Retourne le thème actif à la date donnée (format YYYY-MM-DD), ou null.
 * En cas de chevauchement, affiche l'événement dont la fin est la plus proche ;
 * à égalité de fin, celui dont le début est le plus récent.
 */
export function getThemeActif(dateISO?: string): ThemeCalendrier | null {
  const today = dateISO ?? new Date().toISOString().slice(0, 10)
  const mmdd = today.slice(5) // "MM-DD"

  const actifs = CALENDRIER_THEMES.filter(t => mmdd >= t.debut && mmdd <= t.fin)

  if (actifs.length === 0) return null
  if (actifs.length === 1) return actifs[0]

  return [...actifs].sort((a, b) => {
    const finCmp = a.fin.localeCompare(b.fin)
    if (finCmp !== 0) return finCmp
    // À égalité de fin : le début le plus récent d'abord
    return b.debut.localeCompare(a.debut)
  })[0]
}
