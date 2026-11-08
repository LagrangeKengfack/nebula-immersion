# Utilisation de l'IA

## 1. Outils utilisés

- **Claude Code** (modèle Claude Fable 5.1), en ligne de commande dans le terminal, comme binôme principal pendant toute la durée du test.
- Aucun autre assistant. Pas de Copilot ni de Cursor.

## 2. Dans quel but

| Phase | Ce que j'ai demandé à l'IA | Ce que j'ai gardé pour moi |
|---|---|---|
| Cadrage | Résumer le sujet, lister les règles métier, proposer une stack et un plan de temps | Trancher les priorités et le périmètre (pas de vraie auth, bonus limités) |
| Modélisation | Proposer un schéma de données commenté | Valider chaque décision de modélisation (voir § 6) et poser la question de l'héritage User / rôles |
| Code | Écrire les règles métier, les schémas de validation, les actions serveur, les requêtes et les pages | Relire, demander les explications, exiger les tests sur les règles |
| Qualité | Faire tourner tsc, ESLint, les tests, le build, et tester chaque route avec chaque rôle | Décider quoi corriger et quoi laisser |
| Documentation | Rédiger README, PRODUCT_NOTES et ce fichier à partir de nos échanges | Vérifier que chaque affirmation correspond à ce qui a réellement été fait |

## 3. Un exemple où l'IA m'a fait gagner du temps

**La couche interface complète.** Une fois le schéma et les règles validés, l'IA a produit en une passe la bibliothèque de composants (badges, cartes, états vides, squelettes, champs de formulaire avec erreurs, bouton de soumission avec état « en cours ») puis les dix pages qui les assemblent, avec un vocabulaire français homogène. Le code a compilé et passé le lint après deux corrections mineures. Écrit à la main, ce travail aurait pris la majorité des 4 h 30 disponibles. Je les ai consacrées à la relecture des règles métier et à la validation du modèle, ce qui est là où une erreur aurait coûté cher.

## 4. Un exemple où l'IA s'est trompée ou a proposé quelque chose de risqué

Trois cas concrets, par ordre de gravité :

1. **Une stack inadaptée à mon environnement.** La première proposition était Prisma + Vitest + SQLite en local. Trois problèmes : SQLite est inutilisable sur Vercel (pas de disque persistant), Prisma télécharge des binaires de plusieurs dizaines de Mo hors de npm, et Vitest tirait une cascade de dépendances optionnelles (Playwright…). Sur une connexion à 40 Ko/s, l'installation a échoué deux fois. Nous avons basculé sur Drizzle (ORM pur TypeScript), Postgres partout via Neon, et, dans un premier temps, le runner de tests natif de Node 22 (Vitest a été réinstallé avec succès une fois le réseau rétabli). Le modèle de données validé n'a pas changé, seule la syntaxe de l'outil.

2. **Un bug d'arrondi dans le planning automatique.** La première version de `suggestSessionDates` répartissait les sessions en millisecondes puis prenait la date calendaire, ce qui donnait 1, 5, 10, 15 juillet au lieu de 1, 6, 10, 15 pour quatre sessions sur quatorze jours. C'est le test unitaire, écrit avant la correction, qui l'a révélé. L'arrondi se fait maintenant en jours entiers.

3. **Une configuration par défaut qui aurait coûté une heure.** Le squelette Next.js 16 activait `cacheComponents`, qui exige une frontière `<Suspense>` autour de tout accès à un cookie ou à la base, sous peine d'erreur de build. Pour une application entièrement dynamique, c'était une contrainte sans bénéfice ; nous l'avons désactivé après lecture de la documentation embarquée dans le paquet.

4. **Un faux positif dans la vérification de l'IA elle-même.** Le premier test de fumée écrit par l'IA vérifiait seulement le code HTTP et l'absence du texte « Une erreur est survenue » dans le HTML. Or Next.js rend la page d'erreur côté client : le HTML servi contient le squelette de chargement et l'erreur sérialisée, mais pas ce texte. Résultat : la page « Mes programmes » du coach était cassée en production (colonne `id` ambiguë dans une sous-requête SQL générée par Drizzle) alors que le test disait « tout va bien ». C'est en testant la démo déployée dans un navigateur que je l'ai vu, et les logs Vercel ont donné la cause. Le test a été réécrit (`scripts/smoke.sh`) : il exige désormais un texte propre à chaque page et détecte l'erreur sérialisée dans le flux React.

Deux erreurs plus petites, attrapées par l'outillage : un appel à `Date.now()` pendant le rendu (interdit par les règles de pureté React, signalé par ESLint) et des pages de l'espace coach qui levaient une exception en parallèle du layout qui affichait déjà le refus d'accès (visible dans les logs serveur).

## 5. Comment j'ai revu et validé le code final

- **Typage** : `tsc --noEmit` sans erreur.
- **Lint** : ESLint avec les règles Next et React (dont les règles de pureté des hooks), sans erreur.
- **Tests** : 18 tests sur les règles métier (`npm test`), tous verts.
- **Build de production** : `next build` sans avertissement, dix routes.
- **Test de chaque route avec chaque rôle** (`scripts/smoke.sh`) : appelle toutes les pages avec un cookie visiteur, étudiant, coach et admin, vérifie le code HTTP, la présence d'un texte attendu propre à chaque page et l'absence d'erreur serveur sérialisée. Les refus d'accès, la page 404 et l'accès d'un coach au programme d'un autre coach sont couverts. Exécuté contre le déploiement Vercel, pas seulement en local.
- **Test manuel dans le navigateur** de la démo déployée, avec chaque compte.
- **Relecture ciblée** du code listé au § 6.

## 6. Les parties que j'ai vérifiées avec le plus de soin

1. **L'action d'inscription** (`src/app/actions/enrollment.ts`). C'est le cœur du produit. J'ai vérifié : rôle étudiant exigé, programme publié exigé, statut effectif calculé, refus de doublon, et surtout l'insertion conditionnelle en SQL qui re-vérifie la capacité dans la requête elle-même pour résister à deux inscriptions simultanées sur la dernière place. La contrainte d'unicité en base sert de filet de sécurité.
2. **Les vérifications de propriété côté coach** (`ownProgram`, `ownCohort` dans `src/app/actions/coach.ts`). Chaque action qui modifie un programme, une cohorte, une session ou une exploration vérifie que l'objet appartient au coach connecté, indépendamment de ce que l'interface affiche.
3. **Le schéma de données** (`src/db/schema.ts`). Les deux décisions structurantes, « Complet » calculé et capacité de cohorte plafonnée par le programme, sont les miennes après discussion ; j'ai aussi tranché pour une table User unique avec rôle plutôt que des tables héritées, car les trois rôles partagent les mêmes champs.
4. **Les règles de cohorte** (`src/lib/domain/cohort.ts`), parce qu'elles sont pures et testables : c'est là que j'ai exigé les tests en premier.
