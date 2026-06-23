# Bien Vivre à Pourrain — Portail des commissions municipales

Application web interne pour les élus de la commune de Pourrain (Yonne, France).

## Version démo

Cette version utilise des données fictives codées en dur. Aucune base de données n'est requise.

## Prérequis

- Node.js 18+
- npm 9+

## Lancer le projet

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Identifiants de test (démo)

- Cliquez simplement sur "Se connecter" (aucune validation)

## Structure

```
app/
  (auth)/login/     — Page de connexion
  (main)/
    dashboard/      — Tableau de bord
    commissions/    — Liste et détail des commissions
    documents/      — Tous les documents
    search/         — Recherche
    admin/          — Administration des utilisateurs
components/
  layout/           — Sidebar, Navbar
  ui/               — CommissionCard, DocumentCard
lib/
  mock-data.ts      — Données fictives
  utils.ts          — Fonctions utilitaires
types/
  index.ts          — Types TypeScript
```

## Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
