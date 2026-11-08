# Notes produit

## 1. Priorités, et pourquoi

Le sujet le dit trois fois : une implémentation plus petite et cohérente vaut mieux qu'une plus large et fragile. J'ai donc classé ainsi :

1. **Le modèle de données et les règles métier**, parce que tout le reste en découle et qu'une erreur ici se paie partout. Les règles sont des fonctions pures, testées, appelées par les actions serveur.
2. **Le parcours étudiant de bout en bout** : découvrir, filtrer, comprendre une promotion (dates, places, sessions), s'inscrire, retrouver ses sessions. C'est le parcours qui crée la valeur.
3. **Le parcours coach complet**, y compris les cas d'erreur (programme non publié, capacité trop grande, session hors fenêtre), parce qu'un coach bloqué sans message clair abandonne.
4. **Le tableau de bord admin**, structuré en « offre » (programmes, cohortes, coachs) et « demande » (étudiants, inscriptions, remplissage), plus les échéances. Simple, mais il raconte le fonctionnement de la plateforme.
5. **Les états vides et de chargement**, parce qu'un module en phase initiale sera vide la plupart du temps : chaque écran vide explique quoi faire ensuite.

## 2. Ce que j'ai délibérément choisi de ne pas développer

- **Une vraie authentification.** Le sujet l'autorise. Le simulateur de rôle a la même frontière de sécurité (vérification du rôle côté serveur à chaque action), seule la source de l'identité change. 
- **Soumission d'exploration et retour du coach** (bonus). Cela ajoute une entité et deux formulaires.
- **Suppression de programme ou de promotion.** Faudra d'abord penser aux règles de rétention (que devient une promotion avec inscrits ?). L'archivage couvre le besoin.
- **Désinscription côté interface.** L'action existe, le bouton non : une désinscription libère une place et mérite une confirmation et une politique à laquelle il faudra penser.
- **Pagination du catalogue.** Inutile  pour le peu nombre de programmes utilisés pour la demo.
- **Profils coach et étudiant séparés.** Les trois rôles ont les mêmes champs aujourd'hui. Une table unique avec rôle suffit ; les profils viendront quand un CV ou une école apparaîtra.
- **Thème sombre.** Un seul thème cohérent plutôt que deux approximatifs.

## 3. Ce que j'améliorerais avec une semaine de plus

- **Authentification réelle** (NextAuth ou Clerk) et invitation des coachs par l'admin.
- **Explorations complètes** : réponse écrite de l'étudiant, commentaire du coach, statut « rendu / corrigé ».
- **Documents joints aux explorations** : le coach attache des supports (PDF, liens, grilles d'analyse) que les étudiants téléchargent depuis « Mes programmes » pour préparer la session.
- **Notifications** : email de confirmation d'inscription avec les dates au format calendrier, rappel la veille de chaque session.
- **Gestion de la liste d'attente** quand une promotion est complète, avec promotion automatique en cas de désinscription.
- **Observabilité** : journaliser les refus d'inscription (complet, fermé, doublon) .

## 4. Les indicateurs que je mesurerais après le lancement

**Côté demande (étudiants)**
- Taux  d'inscription, par domaine.
- Délai médian entre la publication d'une promotion et sa première inscription.
- Part des étudiants inscrits à plus d'une promotion (rétention).
- Taux de refus d'inscription pour cause de promotion complète : s'il est élevé, l'offre est sous-dimensionnée.

**Côté offre (coachs)**
- Délai entre création d'un programme et publication, et part des programmes qui restent en brouillon.
- Part des promotions dont les sessions ont encore leur titre par défaut à J-7 : mesure l'appropriation de l'outil.

**Qualité**
- Taux de présence aux sessions (nécessite un pointage, à venir).
- Satisfaction post-programme et part des étudiants qui réalisent au moins une exploration.

## 5. En quoi cette fonctionnalité est utile aux étudiants et aux coachs de Nebula

**Pour les étudiants**, le module transforme une offre pédagogique en engagement concret : des dates, un petit groupe, un coach identifié, un nombre de places visible. La page « Mes programmes » centralise tout ce dont ils ont besoin, prochaine session en tête, explorations à préparer. Le filtre par domaine et par coach permet de choisir un programme en fonction d'un projet professionnel plutôt qu'au hasard.

**Pour les coachs**, c'est un outil de production : un programme s'écrit une fois, se décline en autant de promotions que nécessaire, et chaque promotion naît avec son calendrier déjà réparti. La liste des inscrits et le nombre de groupes suggéré préparent l'animation. Les garde-fous (capacité, fenêtre de dates, publication avant ouverture) évitent les erreurs de saisie qui créeraient des situations embarrassantes face aux étudiants.

**Pour Nebula**, le tableau de bord donne les leviers opérationnels : où l'offre manque (domaines sans promotion ouverte), où elle sature (remplissage), et ce qui arrive cette semaine.
