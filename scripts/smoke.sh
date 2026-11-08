#!/usr/bin/env bash
# Test de fumée : appelle chaque page avec chaque rôle et vérifie
#  - le code HTTP,
#  - la présence d'un texte attendu (preuve que la page a vraiment rendu),
#  - l'absence d'erreur serveur sérialisée dans le flux React (digest numérique ; le 404 volontaire a un digest textuel).
# Usage : scripts/smoke.sh [BASE_URL]   (défaut http://localhost:3000)
set -u
BASE=${1:-http://localhost:3000}
TMP=$(mktemp)
fail=0

# Identifiants de démo (lus dans la base pour ne pas dépendre d'ids figés)
read -r ALICE SARAH MARC ADMIN IB DRAFT COH <<<"$(node --env-file=.env -e '
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
(async () => {
  const u = Object.fromEntries((await sql`select email, id from users`).map(r => [r.email, r.id]));
  const p = Object.fromEntries((await sql`select status, min(id) as id from programs group by status`).map(r => [r.status, r.id]));
  const [c] = await sql`select c.id from cohorts c join programs p on p.id = c.program_id join users u on u.id = p.coach_id where u.email = ${"sarah@nebula.demo"} limit 1`;
  console.log([u["alice@nebula.demo"], u["sarah@nebula.demo"], u["marc@nebula.demo"], u["admin@nebula.demo"], p.PUBLISHED, p.DRAFT, c.id].join(" "));
})();')"

check() { # label, url, cookie, texte attendu
  local code
  code=$(curl -sL -o "$TMP" -w "%{http_code}" --max-time 60 -H "Cookie: nebula_user=$3" "$BASE$2")
  local ok="OK "
  if [[ "$code" != "200" && "$code" != "404" ]] || ! grep -q -- "$4" "$TMP" || grep -qE 'E\{\\"digest\\":\\"[0-9]' "$TMP"; then ok="KO "; fail=1; fi
  printf "%s %-30s %-48s HTTP %s  attendu « %s »\n" "$ok" "$1" "$2" "$code" "$4"
}

check "visiteur · catalogue"        /programmes ""                     "Programmes d'immersion"
check "visiteur · recherche"        "/programmes?q=banque&domain=FINANCE" "" "trouvé"
check "visiteur · détail"           "/programmes/$IB" ""                "Promotions à venir"
check "visiteur · brouillon = 404"  "/programmes/$DRAFT" ""             "Page introuvable"
check "visiteur · mes-programmes"   /mes-programmes ""                 "Espace réservé"
check "alice · mes-programmes"      /mes-programmes "$ALICE"           "Calendrier des sessions"
check "alice · détail (inscrite)"   "/programmes/$IB" "$ALICE"          "Vous êtes inscrit"
check "alice · espace coach"        /coach/programmes "$ALICE"         "Espace réservé aux"
check "alice · admin"               /admin "$ALICE"                    "Espace réservé aux"
check "sarah · liste coach"         /coach/programmes "$SARAH"         "Nouveau programme"
check "sarah · nouveau"             /coach/programmes/nouveau "$SARAH" "Créer le programme"
check "sarah · programme"           "/coach/programmes/$IB" "$SARAH"    "Nouvelle promotion"
check "sarah · cohorte"             "/coach/cohorts/$COH" "$SARAH"      "Étudiants inscrits"
check "sarah · programme d'autrui"  "/coach/programmes/$DRAFT" "$SARAH" "Page introuvable"
check "marc · liste coach"          /coach/programmes "$MARC"          "Brouillon"
check "admin · tableau de bord"     /admin "$ADMIN"                    "Dernières inscriptions"
check "racine"                      / ""                               "Programmes d'immersion"

rm -f "$TMP"
[[ $fail == 0 ]] && echo "✓ Tout est passé" || { echo "✗ Des pages ont échoué"; exit 1; }
