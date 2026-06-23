import type { Commission, Document, User } from "@/types"

export const commissions: Commission[] = [
  { id: "1",  nom: "Finances",                                          nbDocuments: 12 },
  { id: "2",  nom: "Ressources humaines",                               nbDocuments: 5  },
  { id: "3",  nom: "Appel d'offres",                                    nbDocuments: 8  },
  { id: "4",  nom: "Impôts directs",                                    nbDocuments: 3  },
  { id: "5",  nom: "Délégation S.I.V.U. Belles Vallées",               nbDocuments: 6  },
  { id: "6",  nom: "Bâtiments — Gros travaux",                          nbDocuments: 14 },
  { id: "7",  nom: "Voirie",                                            nbDocuments: 9  },
  { id: "8",  nom: "Bâtiments — Entretien courant",                     nbDocuments: 7  },
  { id: "9",  nom: "Assainissement — Développement durable",            nbDocuments: 4  },
  { id: "10", nom: "Délégation SDEY",                                   nbDocuments: 2  },
  { id: "11", nom: "Délégation Fédération Eaux Puisaye Forterre",       nbDocuments: 3  },
  { id: "12", nom: "Cimetière",                                         nbDocuments: 2  },
  { id: "13", nom: "C.C.A.S.",                                          nbDocuments: 5  },
  { id: "14", nom: "Communication",                                     nbDocuments: 8  },
  { id: "15", nom: "Fêtes — Manifestations — Cérémonies",               nbDocuments: 11 },
  { id: "16", nom: "Vie associative",                                   nbDocuments: 6  },
  { id: "17", nom: "Enfance — Jeunesse — Écoles",                       nbDocuments: 9  },
  { id: "18", nom: "Solidarité — Entraide",                             nbDocuments: 4  },
  { id: "19", nom: "Cadre de vie et économie",                          nbDocuments: 7  },
]

export const documents: Document[] = []

export const users: User[] = [
  { id: "u1",  nom: "Pierre Maison",     email: "p.maison@pourrain.fr",     role: "maire"      },
  { id: "u2",  nom: "Pascal Bellanger",  email: "p.bellanger@pourrain.fr",  role: "adjoint"    },
  { id: "u3",  nom: "Anne Virtel",       email: "a.virtel@pourrain.fr",     role: "adjoint"    },
  { id: "u4",  nom: "Arnaud Poli",       email: "a.poli@pourrain.fr",       role: "adjoint"    },
  { id: "u5",  nom: "Claire Vandaele",   email: "c.vandaele@pourrain.fr",   role: "conseiller" },
  { id: "u6",  nom: "Mélanie Darcel",    email: "m.darcel@pourrain.fr",     role: "conseiller" },
  { id: "u7",  nom: "Gilles Laburthe",   email: "g.laburthe@pourrain.fr",   role: "conseiller" },
  { id: "u8",  nom: "Adélina Gallet",    email: "a.gallet@pourrain.fr",     role: "conseiller" },
  { id: "u9",  nom: "François Petit",    email: "f.petit@pourrain.fr",      role: "conseiller" },
  { id: "u10", nom: "Awa Kouyate",       email: "a.kouyate@pourrain.fr",    role: "conseiller" },
  { id: "u11", nom: "Frédéric Gasset",   email: "f.gasset@pourrain.fr",     role: "conseiller" },
  { id: "u12", nom: "Céline Boivin",     email: "c.boivin@pourrain.fr",     role: "conseiller" },
  { id: "u13", nom: "Denis Boivin",      email: "d.boivin@pourrain.fr",     role: "conseiller" },
  { id: "u14", nom: "Flavie Maison",     email: "fl.maison@pourrain.fr",    role: "conseiller" },
  { id: "u15", nom: "Quentin Bellanger", email: "q.bellanger@pourrain.fr",  role: "conseiller" },
  { id: "u16", nom: "Maryline Ventura",  email: "m.ventura@pourrain.fr",    role: "conseiller" },
  { id: "u17", nom: "Yves Malaurent",    email: "y.malaurent@pourrain.fr",  role: "conseiller" },
]

export const currentUser = users[0]
