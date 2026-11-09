import "server-only";
import { and, asc, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { cohorts, enrollments, explorations, programs, sessions, users } from "@/db/schema";
import { effectiveStatus } from "@/lib/domain/cohort";

export type ProgramFilters = { q?: string; domain?: string };

/** Catalogue étudiant : programmes publiés, filtrables par texte (titre, coach) et domaine. */
export async function listPublishedPrograms(filters: ProgramFilters = {}) {
  const conditions = [eq(programs.status, "PUBLISHED")];
  if (filters.domain) conditions.push(eq(programs.domain, filters.domain as (typeof programs.domain.enumValues)[number]));
  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push(or(ilike(programs.title, like), ilike(users.name, like), ilike(programs.description, like))!);
  }

  const rows = await db
    .select({
      id: programs.id,
      title: programs.title,
      description: programs.description,
      domain: programs.domain,
      audience: programs.audience,
      difficulty: programs.difficulty,
      sessionCount: programs.sessionCount,
      coachName: users.name,
      openCohorts: sql<number>`(
        select count(*)::int from ${cohorts} c
        where c.program_id = ${programs}.id and c.status = 'OPEN' and c.end_date >= now()
      )`,
    })
    .from(programs)
    .innerJoin(users, eq(users.id, programs.coachId))
    .where(and(...conditions))
    .orderBy(desc(programs.createdAt));
  return rows;
}

/** Détail d'un programme publié avec ses cohortes à venir et leur statut effectif. */
export async function getPublishedProgramDetail(id: string, studentId?: string) {
  const program = await db.query.programs.findFirst({
    where: and(eq(programs.id, id), eq(programs.status, "PUBLISHED")),
    with: {
      coach: { columns: { id: true, name: true, headline: true } },
      cohorts: {
        where: gte(cohorts.endDate, new Date()),
        orderBy: asc(cohorts.startDate),
        with: { sessions: { orderBy: asc(sessions.order) }, enrollments: { columns: { studentId: true } } },
      },
      explorations: { where: (e, { isNull }) => isNull(e.sessionId), columns: { id: true, title: true } },
    },
  });
  if (!program) return null;
  return {
    ...program,
    cohorts: program.cohorts.map((c) => ({
      ...c,
      enrolledCount: c.enrollments.length,
      effectiveStatus: effectiveStatus(c.status, c.enrollments.length, c.capacity),
      isEnrolled: studentId ? c.enrollments.some((e) => e.studentId === studentId) : false,
    })),
  };
}

/** « Mes programmes » : les cohortes auxquelles l'étudiant est inscrit, avec sessions et explorations. */
export async function listStudentEnrollments(studentId: string) {
  const rows = await db.query.enrollments.findMany({
    where: eq(enrollments.studentId, studentId),
    orderBy: desc(enrollments.createdAt),
    with: {
      cohort: {
        with: {
          program: { with: { coach: { columns: { name: true, headline: true } }, explorations: true } },
          sessions: { orderBy: asc(sessions.order), with: { explorations: true } },
          enrollments: { columns: { id: true } },
        },
      },
    },
  });
  const now = Date.now();
  return rows.map((r) => {
    const c = r.cohort;
    const sessionIds = new Set(c.sessions.map((s) => s.id));
    // Explorations visibles : celles du programme sans session + celles liées à une session de CETTE cohorte
    const visibleExplorations = c.program.explorations.filter((e) => e.sessionId === null || sessionIds.has(e.sessionId));
    return {
      enrollmentId: r.id,
      enrolledAt: r.createdAt,
      cohort: { ...c, enrolledCount: c.enrollments.length },
      program: c.program,
      sessions: c.sessions,
      nextSession: c.sessions.find((s) => s.startsAt.getTime() >= now) ?? null,
      isPast: c.endDate.getTime() < now,
      explorations: visibleExplorations,
    };
  });
}

// ─── Côté coach ─────────────────────────────────────────────────────────────

export async function listCoachPrograms(coachId: string) {
  return db
    .select({
      id: programs.id,
      title: programs.title,
      domain: programs.domain,
      status: programs.status,
      sessionCount: programs.sessionCount,
      updatedAt: programs.updatedAt,
      // NB : on écrit ${programs}.id et non ${programs.id} — sans jointure, Drizzle rend ce dernier en "id" nu,
      // ambigu avec c.id dans la sous-requête (erreur Postgres 42702 constatée en production).
      cohortCount: sql<number>`(select count(*)::int from ${cohorts} c where c.program_id = ${programs}.id)`,
      enrollmentCount: sql<number>`(select count(*)::int from ${enrollments} e join ${cohorts} c on c.id = e.cohort_id where c.program_id = ${programs}.id)`,
    })
    .from(programs)
    .where(eq(programs.coachId, coachId))
    .orderBy(desc(programs.updatedAt));
}

/** Programme du coach (vérifie la propriété) avec cohortes, sessions et compteurs. */
export async function getCoachProgram(programId: string, coachId: string) {
  const program = await db.query.programs.findFirst({
    where: and(eq(programs.id, programId), eq(programs.coachId, coachId)),
    with: {
      cohorts: {
        orderBy: desc(cohorts.startDate),
        with: { sessions: { orderBy: asc(sessions.order) }, enrollments: { columns: { id: true } } },
      },
      explorations: { orderBy: desc(explorations.createdAt), with: { session: { columns: { order: true, title: true } } } },
    },
  });
  if (!program) return null;
  return {
    ...program,
    cohorts: program.cohorts.map((c) => ({
      ...c,
      enrolledCount: c.enrollments.length,
      effectiveStatus: effectiveStatus(c.status, c.enrollments.length, c.capacity),
    })),
  };
}

/** Cohorte gérée par le coach (vérifie la propriété via le programme). */
export async function getCoachCohort(cohortId: string, coachId: string) {
  const cohort = await db.query.cohorts.findFirst({
    where: eq(cohorts.id, cohortId),
    with: {
      program: true,
      sessions: { orderBy: asc(sessions.order), with: { explorations: true } },
      enrollments: { orderBy: desc(enrollments.createdAt), with: { student: { columns: { id: true, name: true, email: true } } } },
    },
  });
  if (!cohort || cohort.program.coachId !== coachId) return null;
  return {
    ...cohort,
    enrolledCount: cohort.enrollments.length,
    effectiveStatus: effectiveStatus(cohort.status, cohort.enrollments.length, cohort.capacity),
  };
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function getAdminDashboard() {
  const now = new Date();
  const [[totals], [published], [activeCohorts], [enrollmentTotal], [studentTotal], [coachTotal], upcoming, latest, [fill]] = await Promise.all([
    db.select({ n: count() }).from(programs),
    db.select({ n: count() }).from(programs).where(eq(programs.status, "PUBLISHED")),
    // Cohorte active : en cours ou à venir, non fermée
    db.select({ n: count() }).from(cohorts).where(and(gte(cohorts.endDate, now), eq(cohorts.status, "OPEN"))),
    db.select({ n: count() }).from(enrollments),
    db.select({ n: count() }).from(users).where(eq(users.role, "STUDENT")),
    db.select({ n: count() }).from(users).where(eq(users.role, "COACH")),
    db
      .select({ id: sessions.id, title: sessions.title, startsAt: sessions.startsAt, order: sessions.order, programTitle: programs.title, coachName: users.name, cohortId: cohorts.id })
      .from(sessions)
      .innerJoin(cohorts, eq(cohorts.id, sessions.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(users, eq(users.id, programs.coachId))
      .where(gte(sessions.startsAt, now))
      .orderBy(asc(sessions.startsAt))
      .limit(8),
    db
      .select({ id: enrollments.id, createdAt: enrollments.createdAt, studentName: users.name, programTitle: programs.title, cohortStart: cohorts.startDate })
      .from(enrollments)
      .innerJoin(users, eq(users.id, enrollments.studentId))
      .innerJoin(cohorts, eq(cohorts.id, enrollments.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .orderBy(desc(enrollments.createdAt))
      .limit(8),
    // Taux de remplissage des cohortes actives : places prises / capacité totale
    db
      .select({
        taken: sql<number>`coalesce((select count(*)::int from ${enrollments} e where e.cohort_id in (select c.id from ${cohorts} c where c.end_date >= now() and c.status = 'OPEN')), 0)`,
        capacity: sql<number>`coalesce((select sum(c.capacity)::int from ${cohorts} c where c.end_date >= now() and c.status = 'OPEN'), 0)`,
      })
      .from(sql`(select 1) as one`),
  ]);
  return {
    fillRate: fill.capacity > 0 ? Math.round((fill.taken / fill.capacity) * 100) : null,
    totalPrograms: totals.n,
    publishedPrograms: published.n,
    activeCohorts: activeCohorts.n,
    totalEnrollments: enrollmentTotal.n,
    totalStudents: studentTotal.n,
    totalCoaches: coachTotal.n,
    upcomingSessions: upcoming,
    latestEnrollments: latest,
  };
}

/** Page d'accueil : chiffres clés, programmes à la une, domaines, coachs et prochaine promotion ouverte. */
export async function getLandingData() {
  const now = new Date();
  const [[published], [coachTotal], [openCohorts], [enrollmentTotal], allPrograms, domainRows, coachRows, upcoming] = await Promise.all([
    db.select({ n: count() }).from(programs).where(eq(programs.status, "PUBLISHED")),
    db.select({ n: count() }).from(users).where(eq(users.role, "COACH")),
    db.select({ n: count() }).from(cohorts).where(and(gte(cohorts.endDate, now), eq(cohorts.status, "OPEN"))),
    db.select({ n: count() }).from(enrollments),
    listPublishedPrograms(),
    db
      .select({ domain: programs.domain, n: count() })
      .from(programs)
      .where(eq(programs.status, "PUBLISHED"))
      .groupBy(programs.domain)
      .orderBy(desc(count())),
    db
      .select({
        id: users.id,
        name: users.name,
        headline: users.headline,
        programCount: sql<number>`(select count(*)::int from ${programs} p where p.coach_id = ${users}.id and p.status = 'PUBLISHED')`,
      })
      .from(users)
      .where(eq(users.role, "COACH"))
      .orderBy(asc(users.name)),
    db.query.cohorts.findMany({
      where: and(eq(cohorts.status, "OPEN"), gte(cohorts.endDate, now)),
      orderBy: asc(cohorts.startDate),
      limit: 6,
      with: {
        program: { with: { coach: { columns: { name: true, headline: true } } } },
        enrollments: { columns: { id: true } },
        sessions: { columns: { startsAt: true }, orderBy: asc(sessions.order) },
      },
    }),
  ]);

  // Prochaine promotion mise en avant : programme publié, et il reste des places
  const next = upcoming.find((c) => c.program.status === "PUBLISHED" && c.enrollments.length < c.capacity) ?? null;

  // À la une : d'abord celles qui ont une promotion ouverte, puis les plus récentes
  const featured = [...allPrograms].sort((a, b) => Number(b.openCohorts > 0) - Number(a.openCohorts > 0)).slice(0, 3);

  return {
    stats: { publishedPrograms: published.n, coaches: coachTotal.n, openCohorts: openCohorts.n, enrollments: enrollmentTotal.n },
    featured,
    domains: domainRows,
    coaches: coachRows.filter((c) => c.programCount > 0),
    nextCohort: next && {
      id: next.id,
      programId: next.programId,
      programTitle: next.program.title,
      domain: next.program.domain,
      coachName: next.program.coach.name,
      startDate: next.startDate,
      endDate: next.endDate,
      capacity: next.capacity,
      enrolledCount: next.enrollments.length,
      sessionCount: next.sessions.length,
      firstSessionAt: next.sessions[0]?.startsAt ?? null,
    },
  };
}
