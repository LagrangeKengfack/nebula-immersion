# Nebula · Programmes d'immersion professionnelle

Module full-stack permettant aux **coachs** de créer des programmes d'immersion et d'ouvrir des promotions, aux **étudiants** de les découvrir et de s'inscrire, et aux **administrateurs** de suivre l'activité de la plateforme.

- Code : https://github.com/LagrangeKengfack/nebula-immersion
- Démo en ligne : déployée sur Vercel à chaque push sur `main` (lien dans l'email de soumission)
- Documents : [`PRODUCT_NOTES.md`](./PRODUCT_NOTES.md) · [`AI_USAGE.md`](./AI_USAGE.md)

## Stack

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) | Pages serveur + server actions : pas d'API REST à maintenir pour un module de cette taille |
| Styles | Tailwind CSS 4 | Composants réutilisables, un seul thème cohérent |
| Base de données | PostgreSQL hébergé sur Neon | Postgres partout (dev et prod), pilote HTTP adapté au serverless Vercel |
| ORM | Drizzle | Schéma TypeScript lisible, requêtes typées, aucune dépendance binaire |
| Validation | Zod | Un schéma par formulaire, erreurs par champ renvoyées au client |
| Tests | Vitest | Rapide, API familière ; teste les règles métier en fonctions pures |

## Lancer le projet

Prérequis : Node.js ≥ 22.18 (exécution native du TypeScript) et une base PostgreSQL (un projet [Neon](https://neon.tech) gratuit suffit).

```bash
# 1. Dépendances
npm install

# 2. Configuration
cp .env.example .env
#    → renseigner DATABASE_URL avec votre chaîne de connexion Postgres

# 3. Créer les tables
npm run db:push

# 4. Charger les données de démonstration
npm run db:seed

# 5. Démarrer
npm run dev
#    → http://localhost:3000
```

### Comptes de démonstration

L'authentification est simulée (choix autorisé par le sujet) : le sélecteur **« Connecté en tant que »** en haut de page bascule d'un utilisateur de démo à l'autre. L'identité est stockée dans un cookie `httpOnly` et **chaque action serveur re-vérifie le rôle** : remplacer `src/lib/auth.ts` par NextAuth ou Clerk ne changerait rien au reste du code.

| Rôle | Compte | À tester |
|---|---|---|
| Étudiant | Alice Martin | Déjà inscrite à 2 promotions → `/mes-programmes` rempli |
| Étudiant | Chloé Nguyen | Inscrite à 1 promotion |
| Coach | Sarah Benali | 2 programmes publiés, promotions et explorations |
| Coach | Marc Dupuis | 1 programme publié, 1 brouillon (non visible des étudiants) |
| Admin | Admin Nebula | Tableau de bord `/admin` |

La promotion « Exercices pratiques pour chefs de produit » est volontairement **complète** (2/2) pour tester le refus d'inscription.

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm test` | Tests des règles métier (`tests/`) |
| `npm run lint` | ESLint (règles Next + React) |
| `scripts/smoke.sh [URL]` | Test de fumée : chaque page avec chaque rôle (local ou déployé) |
| `npm run db:push` | Synchronise le schéma Drizzle avec la base |
| `npm run db:seed` | Vide et recharge les données de démo |

## Structure

```
src/
├── app/                     Routes (App Router)
│   ├── programmes/          Catalogue + détail (public / étudiant)
│   ├── mes-programmes/      Inscriptions de l'étudiant
│   ├── coach/               Espace coach (layout = garde d'accès)
│   │   ├── programmes/      Liste, création, détail/édition
│   │   └── cohorts/[id]/    Sessions + étudiants inscrits
│   ├── admin/               Tableau de bord
│   └── actions/             Server actions (coach, inscription, rôle)
├── components/              UI réutilisable (ui.tsx, form.tsx) + composants métier
├── db/                      schema.ts (Drizzle), index.ts (client), seed.ts
└── lib/
    ├── domain/cohort.ts     Règles métier pures (testées)
    ├── validation/          Schémas Zod + helpers FormData
    ├── queries/             Lectures (une fonction par écran)
    ├── auth.ts              Simulateur de rôle + requireRole()
    ├── labels.ts            Libellés FR des enums
    └── format.ts            Dates
tests/                       Vitest
```

## Modèle de données

```
User (role: STUDENT | COACH | ADMIN)
 └─< Program (status: DRAFT | PUBLISHED | ARCHIVED, sessionCount 2..4, maxCapacity 1..20)
      ├─< Cohort (startDate < endDate, capacity 1..program.maxCapacity, status OPEN | CLOSED)
      │    ├─< Session (order unique par cohorte, startsAt ∈ [startDate, endDate], 45 min par défaut)
      │    └─< Enrollment (unique par (student, cohort))
      └─< Exploration (programme entier, ou liée à une Session précise)
```

Décisions notables :

- **« Complet » est calculé**, jamais stocké (`inscrits ≥ capacité`). Le coach ne gère que Ouvert / Fermé. Aucun risque de désynchronisation.
- **Deux capacités reliées** : `program.maxCapacity` est le plafond, chaque cohorte choisit en dessous.
- **Les sessions sont créées avec la cohorte**, pré-datées par répartition uniforme (bonus du sujet), pour garantir l'invariant « autant de sessions que le programme ». Le coach ajuste ensuite titres et horaires.
- **Invariants en base** : unicité `(student, cohort)`, unicité `(cohort, order)`, cascades.
- **Inscription anti-course** : l'insertion re-vérifie la capacité dans la requête SQL elle-même, pour que deux étudiants simultanés ne dépassent pas la dernière place.

## Règles métier implémentées

- Seuls les programmes **publiés** sont visibles des étudiants (catalogue, détail, inscription).
- Une promotion ne peut être créée que sur un programme publié.
- Date de fin > date de début ; capacité entre 1 et le max du programme ; chaque session dans la fenêtre de la promotion.
- Pas d'inscription si complète, fermée, ou déjà inscrit.
- Le nombre de sessions d'un programme ne peut plus changer dès qu'une promotion existe.
- Un coach ne voit et ne modifie que **ses** programmes et promotions (vérifié côté serveur à chaque action).

## Déploiement (Vercel)

Le projet Vercel est relié au dépôt GitHub : chaque push sur `main` déclenche un build et un déploiement.

1. Importer le dépôt dans Vercel (fait).
2. Ajouter la variable d'environnement `DATABASE_URL` (fait, stockée comme secret).
3. Exécuter une fois `npm run db:push && npm run db:seed` en local avec la même `DATABASE_URL` pour créer et peupler la base.
