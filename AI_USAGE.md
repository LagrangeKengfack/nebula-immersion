# Utilisation de l'IA

## 1. Outils utilisés

- **Claude Code**, en ligne de commande dans le terminal, comme binôme principal pendant toute la durée du test.
- Aucun autre assistant. Pas de Copilot ni de Cursor.

## 2. Dans quel but

| Phase | Ce que j'ai demandé à l'IA | Ce que j'ai gardé pour moi |
|---|---|---|
| Cadrage | proposer une stack et un plan de temps | Trancher les priorités et le périmètre (pas de vraie auth, bonus limités) |
| Modélisation | Proposer un schéma de données commenté | Valider chaque décision de modélisation (voir § 6) et poser la question de l'héritage User / rôles |
| Code | Écrire les règles métier, les schémas de validation, les actions serveur, les requêtes et les pages | exiger les tests sur les règles et le respect des bonnes pratique de programmation |
| Qualité | Faire tourner tsc, ESLint, les tests, le build, et tester chaque route avec chaque rôle | Décider quoi corriger et quoi laisser |
| Documentation | Rédiger README, PRODUCT_NOTES et ce fichier à partir de nos échanges | Vérifier que chaque affirmation correspond à ce qui a réellement été fait |

## 3. Un exemple où l'IA m'a fait gagner du temps

**La couche interface complète.** Une fois le schéma et les règles validés, l'IA a produit en une passe la bibliothèque de composants (badges, cartes, états vides, squelettes, champs de formulaire avec erreurs, bouton de soumission avec état « en cours ») puis les dix pages qui les assemblent. Le code a compilé et passé le lint après deux corrections mineures. Écrit à la main, ce travail aurait pris énormément de temps. Je les ai consacrées à la relecture des règles métier..

## 4. Un exemple où l'IA s'est trompée ou a proposé quelque chose de risqué

Trois cas concrets, par ordre de gravité :

1. **Une stack inadaptée à mon environnement.** La première proposition était Prisma + Vitest + SQLite en local. le problème : SQLite est inutilisable sur Vercel (pas de disque persistant). Nous avons basculé sur Drizzle (ORM pur TypeScript) (à cause d'un soucis de connexion pour le téléchargement de prisma), Postgres partout via Neon, et, dans un premier temps, le runner de tests natif de Node 22 (en attendant le télécharment de vitest).

3. **Une configuration par défaut.** Le squelette Next.js 16 activait `cacheComponents`, qui exige une frontière `<Suspense>` autour de tout accès à un cookie ou à la base, sous peine d'erreur de build. Pour une application entièrement dynamique, c'est une contrainte sans bénéfice ; nous l'avons désactivé sous couvert la documentation embarquée dans le paquet.

## 5. Comment j'ai revu et validé le code final

- **Tests** : 18 tests sur les règles métier (`npm test`), tous verts.
- **Build de production** : `next build` sans avertissement, dix routes.
- **Test de chaque route avec chaque rôle** (`scripts/smoke.sh`) : appelle toutes les pages avec un cookie visiteur, étudiant, coach et admin, vérifie le code HTTP, la présence d'un texte attendu propre à chaque page et l'absence d'erreur serveur sérialisée. Les refus d'accès, la page 404 et l'accès d'un coach au programme d'un autre coach sont couverts. Exécuté contre le déploiement Vercel, pas seulement en local.
- **Test manuel dans le navigateur** de la démo déployée, avec chaque compte.

## 6. Les parties que j'ai vérifiées avec le plus de soin

1. **L'action d'inscription** (`src/app/actions/enrollment.ts`). C'est le cœur du produit. J'ai vérifié : rôle étudiant exigé, programme publié exigé, statut effectif calculé, refus de doublon, et surtout l'insertion conditionnelle en SQL qui re-vérifie la capacité dans la requête elle-même pour résister à deux inscriptions simultanées sur la dernière place. La contrainte d'unicité en base sert de filet de sécurité.
2. **Les vérifications de propriété côté coach** Chaque action qui modifie un programme, une cohorte, une session ou une exploration vérifie que l'objet appartient au coach connecté, indépendamment de ce que l'interface affiche.
3. **Le schéma de données** (`src/db/schema.ts`). Les deux décisions structurantes, « Complet » calculé et capacité de cohorte plafonnée par le programme, sont les miennes après discussion ; j'ai aussi tranché pour une table User unique avec rôle plutôt que des tables héritées, car les trois rôles partagent les mêmes champs.
4. **Les règles de cohorte** (`src/lib/domain/cohort.ts`), parce qu'elles sont pures et testables : c'est là que j'ai exigé les tests en premier.
