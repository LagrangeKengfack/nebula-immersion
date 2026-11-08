/**
 * Données de démonstration. Idempotent : vide puis recrée.
 * Lancer : npm run db:seed
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.ts";
import { suggestSessionDates } from "../lib/domain/cohort.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL manquante.");
const db = drizzle({ client: neon(url), schema, casing: "snake_case" });

const { users, programs, cohorts, sessions, enrollments, explorations } = schema;

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

async function main() {
  console.log("→ Nettoyage…");
  await db.delete(explorations);
  await db.delete(enrollments);
  await db.delete(sessions);
  await db.delete(cohorts);
  await db.delete(programs);
  await db.delete(users);

  console.log("→ Utilisateurs…");
  const [admin, coachSarah, coachMarc, coachLina, ...students] = await db
    .insert(users)
    .values([
      { name: "Admin Nebula", email: "admin@nebula.demo", role: "ADMIN" },
      { name: "Sarah Benali", email: "sarah@nebula.demo", role: "COACH", headline: "Ex-analyste M&A, 8 ans en banque d'affaires" },
      { name: "Marc Dupuis", email: "marc@nebula.demo", role: "COACH", headline: "Lead Data Scientist, ancien consultant BCG Gamma" },
      { name: "Lina Okafor", email: "lina@nebula.demo", role: "COACH", headline: "Senior Product Manager, ex-Doctolib" },
      { name: "Alice Martin", email: "alice@nebula.demo", role: "STUDENT" },
      { name: "Karim Haddad", email: "karim@nebula.demo", role: "STUDENT" },
      { name: "Chloé Nguyen", email: "chloe@nebula.demo", role: "STUDENT" },
      { name: "Thomas Leroy", email: "thomas@nebula.demo", role: "STUDENT" },
      { name: "Fatou Diop", email: "fatou@nebula.demo", role: "STUDENT" },
    ])
    .returning();
  void admin;

  console.log("→ Programmes…");
  const [ib, data, pm, quant, draft, archived] = await db
    .insert(programs)
    .values([
      {
        title: "Immersion analyste en banque d'investissement",
        description:
          "Quatre sessions pour vivre une semaine d'analyste M&A : lecture d'un information memorandum, construction d'un modèle de valorisation simplifié, préparation d'un pitch et débrief avec un ancien banquier. Vous travaillerez en petit groupe sur une opération réelle anonymisée.",
        domain: "FINANCE",
        audience: "MASTER",
        difficulty: "INTERMEDIATE",
        sessionCount: 4,
        recommendedGroupSize: 3,
        maxCapacity: 12,
        learningObjectives: [
          "Structurer une analyse de risque de crédit",
          "Construire un modèle DCF simplifié",
          "Présenter une recommandation d'investissement en 5 minutes",
        ],
        status: "PUBLISHED",
        coachId: coachSarah.id,
      },
      {
        title: "Bootcamp analyste de données",
        description:
          "De la question métier à la restitution : vous recevez un jeu de données brut d'une entreprise de e-commerce et devez en tirer trois recommandations actionnables. Trois sessions encadrées, un livrable final présenté à un jury fictif.",
        domain: "DATA",
        audience: "BACHELOR",
        difficulty: "BEGINNER",
        sessionCount: 3,
        recommendedGroupSize: 3,
        maxCapacity: 15,
        learningObjectives: [
          "Traduire une question métier en analyse de données",
          "Nettoyer et explorer un jeu de données réel",
          "Communiquer des résultats à un public non technique",
        ],
        status: "PUBLISHED",
        coachId: coachMarc.id,
      },
      {
        title: "Exercices pratiques pour chefs de produit",
        description:
          "Deux sessions intensives pour s'entraîner aux cas produit : priorisation d'une roadmap sous contrainte, rédaction d'une spécification et arbitrage avec des parties prenantes jouées par le coach.",
        domain: "PRODUCT",
        audience: "YOUNG_PROFESSIONAL",
        difficulty: "INTERMEDIATE",
        sessionCount: 2,
        recommendedGroupSize: 4,
        maxCapacity: 8,
        learningObjectives: ["Prioriser une roadmap avec un cadre RICE", "Rédiger une spec produit d'une page"],
        status: "PUBLISHED",
        coachId: coachLina.id,
      },
      {
        title: "Immersion en analyse quantitative des risques",
        description:
          "Pour les profils quantitatifs : mesure de VaR, stress tests et présentation à un comité des risques simulé. Quatre sessions exigeantes, prérequis en statistiques recommandés.",
        domain: "FINANCE",
        audience: "MASTER",
        difficulty: "ADVANCED",
        sessionCount: 4,
        recommendedGroupSize: 2,
        maxCapacity: 6,
        learningObjectives: ["Calculer et interpréter une VaR historique", "Concevoir un scénario de stress crédible"],
        status: "PUBLISHED",
        coachId: coachSarah.id,
      },
      {
        title: "Programme de cas en conseil en stratégie",
        description:
          "En préparation : résolution de cas de conseil en groupe, du cadrage à la recommandation finale. Trois sessions.",
        domain: "CONSULTING",
        audience: "MASTER",
        difficulty: "INTERMEDIATE",
        sessionCount: 3,
        recommendedGroupSize: 3,
        maxCapacity: 12,
        learningObjectives: ["Cadrer un problème avec un arbre d'hypothèses"],
        status: "DRAFT",
        coachId: coachMarc.id,
      },
      {
        title: "Simulation d'entretien en génie logiciel (édition 2025)",
        description: "Ancienne édition archivée. Deux sessions de simulation d'entretien technique.",
        domain: "SOFTWARE_ENGINEERING",
        audience: "BACHELOR",
        difficulty: "INTERMEDIATE",
        sessionCount: 2,
        recommendedGroupSize: 3,
        maxCapacity: 10,
        learningObjectives: ["Résoudre un problème algorithmique à voix haute"],
        status: "ARCHIVED",
        coachId: coachLina.id,
      },
    ])
    .returning();
  void draft;
  void archived;

  console.log("→ Cohortes et sessions…");
  type CohortSpec = { program: typeof ib; start: number; end: number; capacity: number; status?: "OPEN" | "CLOSED"; titles: string[] };
  const specs: CohortSpec[] = [
    {
      program: ib,
      start: 7,
      end: 21,
      capacity: 6,
      titles: ["Lire un information memorandum", "Valorisation : construire le DCF", "Préparer le pitch", "Débrief et parcours en banque d'affaires"],
    },
    {
      program: ib,
      start: 40,
      end: 54,
      capacity: 12,
      titles: ["Lire un information memorandum", "Valorisation : construire le DCF", "Préparer le pitch", "Débrief et parcours en banque d'affaires"],
    },
    {
      program: data,
      start: 3,
      end: 17,
      capacity: 9,
      titles: ["Définir la problématique métier", "Étude de cas : analyse du jeu de données", "Restitution devant le jury"],
    },
    {
      program: data,
      start: -20,
      end: -6,
      capacity: 9,
      status: "CLOSED",
      titles: ["Définir la problématique métier", "Étude de cas : analyse du jeu de données", "Restitution devant le jury"],
    },
    {
      program: pm,
      start: 10,
      end: 17,
      capacity: 2, // volontairement petite → deviendra « Complet » avec 2 inscrits
      titles: ["Prioriser une roadmap sous contrainte", "Spécifier et arbitrer"],
    },
    {
      program: quant,
      start: 14,
      end: 28,
      capacity: 6,
      titles: ["VaR historique : fondamentaux", "Stress tests", "Backtesting", "Comité des risques simulé"],
    },
  ];

  const createdCohorts = [];
  for (const spec of specs) {
    const [cohort] = await db
      .insert(cohorts)
      .values({ programId: spec.program.id, startDate: daysFromNow(spec.start), endDate: daysFromNow(spec.end), capacity: spec.capacity, status: spec.status ?? "OPEN" })
      .returning();
    const dates = suggestSessionDates({ startDate: cohort.startDate, endDate: cohort.endDate }, spec.program.sessionCount);
    await db.insert(sessions).values(
      dates.map((startsAt, i) => ({
        cohortId: cohort.id,
        order: i + 1,
        title: spec.titles[i],
        description: `Session ${i + 1} sur ${spec.program.sessionCount}. En visio, 45 minutes, petit groupe.`,
        startsAt,
      })),
    );
    createdCohorts.push(cohort);
  }
  const [ibSoon, , dataSoon, dataPast, pmSoon] = createdCohorts;
  const [alice, karim, chloe, thomas, fatou] = students;

  console.log("→ Inscriptions…");
  await db.insert(enrollments).values([
    { studentId: alice.id, cohortId: ibSoon.id },
    { studentId: karim.id, cohortId: ibSoon.id },
    { studentId: chloe.id, cohortId: ibSoon.id },
    { studentId: alice.id, cohortId: dataSoon.id },
    { studentId: thomas.id, cohortId: dataSoon.id },
    { studentId: fatou.id, cohortId: dataPast.id },
    { studentId: thomas.id, cohortId: dataPast.id },
    { studentId: karim.id, cohortId: pmSoon.id },
    { studentId: fatou.id, cohortId: pmSoon.id }, // → pmSoon est complète
  ]);

  console.log("→ Explorations…");
  const [ibSessions, dataSessions] = await Promise.all([
    db.query.sessions.findMany({ where: (s, { eq }) => eq(s.cohortId, ibSoon.id), orderBy: (s, { asc }) => asc(s.order) }),
    db.query.sessions.findMany({ where: (s, { eq }) => eq(s.cohortId, dataSoon.id), orderBy: (s, { asc }) => asc(s.order) }),
  ]);
  await db.insert(explorations).values([
    {
      programId: ib.id,
      title: "Lire un rapport annuel en 30 minutes",
      description: "Choisissez une société cotée du CAC 40 et résumez en 10 lignes son modèle économique, ses principaux risques et sa structure de dette.",
      dueDate: null,
    },
    {
      programId: ib.id,
      sessionId: ibSessions[1].id,
      title: "Préparer vos hypothèses de DCF",
      description: "Avant la session 2, proposez un taux de croissance et un WACC pour l'entreprise étudiée. Justifiez chaque chiffre en une phrase.",
      dueDate: ibSessions[1].startsAt,
    },
    {
      programId: data.id,
      sessionId: dataSessions[0].id,
      title: "Trois questions métier",
      description: "Listez trois questions qu'un directeur e-commerce pourrait poser à un analyste. Pour chacune, indiquez quelles données seraient nécessaires.",
      dueDate: dataSessions[0].startsAt,
    },
  ]);

  console.log("✓ Seed terminé.");
  console.log("  Comptes de démo : admin@nebula.demo · sarah@nebula.demo (coach) · alice@nebula.demo (étudiante)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
