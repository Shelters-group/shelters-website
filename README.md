# Shelters — site public

Landing statique Astro déployée sur Cloudflare Pages.

## Stack

- **Framework** : [Astro](https://astro.build) v4
- **Hébergement** : [Cloudflare Pages](https://pages.cloudflare.com) (build GitHub auto-deploy)
- **Email / CRM** : [Brevo](https://www.brevo.com) (API côté client pour la capture email)
- **Backend (Phase 2+)** : Supabase (DB, auth, RLS, edge functions)

## Démarrage local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:4321.

## Variables d'environnement

Copier `.env.example` en `.env` et remplir :

- `PUBLIC_SITE_URL` — URL publique du site (ex. `https://shelters.pages.dev`)
- `PUBLIC_BREVO_LIST_ID` — ID de la liste Brevo qui reçoit les captures
- `PUBLIC_BREVO_API_KEY_CAPTURE` — clé API Brevo **scopée** (limitée à l'ajout de contacts sur cette liste)

> Ces variables sont exposées côté client (préfixe `PUBLIC_`). Utiliser une clé Brevo à scope limité, jamais la clé maître.

## Build

```bash
npm run build
```

Produit le site statique dans `dist/`.

## Déploiement

Push sur `main` → Cloudflare Pages déclenche automatiquement :

1. `npm install`
2. `npm run build`
3. Publication de `dist/` sur `https://shelters.pages.dev`

Les variables d'environnement sont définies côté Cloudflare Pages (onglet **Settings → Environment variables**), pas dans le repo.

## Structure

```
shelters-website/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   └── robots.txt
└── src/
    ├── components/
    │   └── EmailCapture.astro
    ├── layouts/
    │   └── BaseLayout.astro
    └── pages/
        └── index.astro
```

## Roadmap

- **Phase 1** (actuelle) — Landing + capture email → Brevo
- **Phase 2** — Page deal + formulaire "Demander l'accès" → Supabase + Brevo via Worker
- **Phase 3** — Supabase complet : auth investisseurs, RLS, KYC chiffré, edge functions
