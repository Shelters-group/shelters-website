# Shelters — site public

Landing statique Astro + Worker Cloudflare (proxy Brevo) déployés ensemble.

## Stack

- **Framework** : [Astro](https://astro.build) v4, sortie statique
- **Hébergement** : [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) (build auto depuis GitHub, mode static assets + worker script)
- **Proxy Brevo** : Worker `worker/index.js` — route `POST /api/subscribe`, appelle l'API Brevo avec la clé stockée en Secret runtime (jamais côté client)
- **Email / CRM** : [Brevo](https://www.brevo.com)
- **Backend (Phase 2+)** : Supabase (DB, auth, RLS, edge functions)

## Démarrage local

```bash
npm install
npm run dev          # dev Astro, http://localhost:4321
# Pour tester la route /api/subscribe en local : wrangler dev
```

## Variables d'environnement

### Côté build Astro (repo)

Copier `.env.example` en `.env` :

- `PUBLIC_SITE_URL` — URL canonique du site (meta tags)

Aucun secret n'est injecté au build.

### Côté runtime Worker (hors repo)

Déclarées dans le dashboard Cloudflare (Workers → `shelters-website` → Settings → Variables and Secrets) :

- `BREVO_LIST_ID` — Variable normale, déjà définie dans `wrangler.jsonc` (`vars.BREVO_LIST_ID = "3"`).
- `BREVO_API_KEY` — **Secret**. Clé Brevo scopée à la création de contacts. Jamais dans le repo, jamais dans le bundle client.

## Build

```bash
npm run build
```

Produit `dist/`. Le Worker (`worker/index.js`) est bundlé par wrangler au moment du deploy et sert `dist/` via le binding `ASSETS`.

## Déploiement

Push sur `main` → Cloudflare déclenche automatiquement :

1. `npm install`
2. `npm run build` (Astro → `dist/`)
3. `wrangler deploy` (bundle Worker + publie assets)

Site : <https://shelters-website.hvernon.workers.dev>

## Structure

```
shelters-website/
├── astro.config.mjs
├── wrangler.jsonc
├── package.json
├── tsconfig.json
├── public/
│   └── robots.txt
├── src/
│   ├── components/
│   │   └── EmailCapture.astro      (POST /api/subscribe)
│   ├── layouts/
│   │   └── BaseLayout.astro
│   └── pages/
│       └── index.astro
└── worker/
    └── index.js                    (proxy Brevo + fallback assets)
```

## Sécurité

- **Aucune clé API n'est committée dans le repo** (public). Toute clé détectée serait automatiquement révoquée par Brevo via son partenariat secret-scanning GitHub.
- **Aucune clé n'est inlinée côté client**. Le front ne connaît que le endpoint `/api/subscribe`.
- Le Worker valide l'email, appelle Brevo, et retourne des codes génériques sans fuiter les détails upstream.

## Roadmap

- **Phase 1** (actuelle) — Landing + capture email → Worker proxy → Brevo
- **Phase 2** — Page deal + formulaire « Demander l'accès » → Supabase + Brevo via Worker
- **Phase 3** — Supabase complet : auth investisseurs, RLS, KYC chiffré, edge functions
