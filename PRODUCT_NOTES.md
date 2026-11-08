# Notes produit

## 1. Priorités, et pourquoi

Le sujet le dit trois fois : une implémentation plus petite et cohérente vaut mieux qu'une plus large et fragile. J'ai donc classé ainsi :

1. **Le modèle de données et les règles métier**, parce que tout le reste en découle et qu'une erreur ici se paie partout. Les règles sont des fonctions pures, testées, appelées par les actions serveur.
2. **Le parcours étudiant de bout en bout** : découvrir, filtrer, comprendre une promotion (dates, places, sessions), s'inscrire, retrouver ses sessions. C'est le parcours qui crée la valeur.
3. **Le parcours coach complet**, y compris les cas d'erreur (programme non publié, capacité trop grande, session hors fenêtre), parce qu'un coach bloqué sans message clair abandonne.
4. **Le tableau de bord admin**, structuré en « offre » (programmes, cohortes, coachs) et « demande » (étudiants, inscriptions, remplissage), plus les échéances. Simple, mais il raconte le fonctionnement de la plateforme.
5. **Les états vides et de chargement**, parce qu'un module en phase initiale sera vide la plupart du temps : chaque écran vide explique quoi faire ensuite.

## 2. Ce que j'ai délibérément choisi de ne pas développer

- **Une vraie authentification.** Le sujet l'autorise. Le simulateur de rôle a la même frontière de sécurité (vérification du rôle côté serveur à chaque action), seule la source de l'identité change. C'est une heure économisée sans rien perdre d'évaluable.
- **Soumission d'exploration et retour du coach** (bonus). Cela ajoute une entité, deux formulaires et un cycle de statut. Le périmètre de base est plus utile à soigner.
- **Suppression de programme ou de promotion.** Trop risqué sans règles de rétention (que devient une promotion avec inscrits ?). L'archivage couvre le besoin.
- **Désinscription côté interface.** L'action existe, le bouton non : une désinscription libère une place et mérite une confirmation et une politique (jusqu'à quand ?) que je n'ai pas voulu inventer.
- **Pagination du catalogue.** Inutile avant plusieurs dizaines de programmes.
- **Profils coach et étudiant séparés.** Les trois rôles ont les mêmes champs aujourd'hui. Une table unique avec rôle suffit ; les profils viendront quand un CV ou une école apparaîtra.
- **Thème sombre.** Un seul thème cohérent plutôt que deux approximatifs.

## 3. Ce que j'améliorerais avec une semaine de plus

- **Authentification réelle** (NextAuth ou Clerk) et invitation des coachs par l'admin.
- **Explorations complètes** : réponse écrite de l'étudiant, commentaire du coach, statut « rendu / corrigé ».
- **Notifications** : email de confirmation d'inscription avec les dates au format calendrier, rappel la veille de chaque session.
- **Gestion de la liste d'attente** quand une promotion est complète, avec promotion automatique en cas de désinscription.
- **Formation des groupes** : le coach répartit les inscrits en groupes de la taille recommandée directement depuis la page de la promotion. Le calcul du nombre de groupes est déjà affiché.
- **Transactions** : passer du pilote HTTP de Neon au pilote WebSocket pour envelopper « créer la cohorte + ses sessions » dans une transaction unique.
- **Tests d'intégration** sur les actions serveur contre une base éphémère, en plus des tests unitaires sur les règles.
- **Observabilité** : journaliser les refus d'inscription (complet, fermé, doublon) pour alimenter les indicateurs ci-dessous.

## 4. Les indicateurs que je mesurerais après le lancement

**Côté demande (étudiants)**
- Taux de conversion catalogue → page programme → inscription, par domaine.
- Délai médian entre la publication d'une promotion et sa première inscription.
- Part des étudiants inscrits à plus d'une promotion (rétention).
- Taux de refus d'inscription pour cause de promotion complète : s'il est élevé, l'offre est sous-dimensionnée.

**Côté offre (coachs)**
- Taux de remplissage des promotions à la date de début (déjà affiché dans le tableau de bord).
- Délai entre création d'un programme et publication, et part des programmes qui restent en brouillon : mesure la friction du formulaire.
- Part des promotions dont les sessions ont encore leur titre par défaut à J-7 : mesure l'appropriation de l'outil.

**Qualité**
- Taux de présence aux sessions (nécessite un pointage, à venir).
- Satisfaction post-programme (NPS) et part des étudiants qui réalisent au moins une exploration.

## 5. En quoi cette fonctionnalité est utile aux étudiants et aux coachs de Nebula

**Pour les étudiants**, le module transforme une offre pédagogique en engagement concret : des dates, un petit groupe, un coach identifié, un nombre de places visible. La page « Mes programmes » centralise tout ce dont ils ont besoin, prochaine session en tête, explorations à préparer. Le filtre par domaine et par coach permet de choisir un programme en fonction d'un projet professionnel plutôt qu'au hasard.

**Pour les coachs**, c'est un outil de production : un programme s'écrit une fois, se décline en autant de promotions que nécessaire, et chaque promotion naît avec son calendrier déjà réparti. La liste des inscrits et le nombre de groupes suggéré préparent l'animation. Les garde-fous (capacité, fenêtre de dates, publication avant ouverture) évitent les erreurs de saisie qui créeraient des situations embarrassantes face aux étudiants.

**Pour Nebula**, le tableau de bord donne les leviers opérationnels : où l'offre manque (domaines sans promotion ouverte), où elle sature (remplissage), et ce qui arrive cette semaine. C'est le minimum pour piloter une place de marché pédagogique naissante.
