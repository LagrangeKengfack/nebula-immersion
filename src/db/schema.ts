/**
 * Modèle de données — Nebula, module « Programmes d'immersion professionnelle »
 *
 * Choix de modélisation :
 *  - Un seul modèle User avec un rôle (héritage par table unique) : les trois rôles partagent
 *    les mêmes champs. Des profils séparés (CoachProfile, StudentProfile) seraient la suite
 *    logique si des données spécifiques apparaissaient (CV du coach, école de l'étudiant).
 *  - Le statut « Complet » d'une cohorte est CALCULÉ (inscriptions >= capacité), jamais stocké,
 *    pour éviter toute désynchronisation. Le coach ne contrôle que Ouvert / Fermé.
 *  - Une Exploration est rattachée à un programme (visible par toutes ses cohortes) et,
 *    optionnellement, à une session précise (visible par la seule cohorte de cette session).
 *  - Les invariants critiques sont garantis en base : unicité (étudiant, cohorte),
 *    unicité (cohorte, ordre de session), suppression en cascade.
 */
import { relations } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());

// ─── Enums ──────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["STUDENT", "COACH", "ADMIN"]);
export const domainEnum = pgEnum("domain", ["FINANCE", "CONSULTING", "DATA", "PRODUCT", "SOFTWARE_ENGINEERING", "MARKETING", "ENTREPRENEURSHIP"]);
export const audienceEnum = pgEnum("audience", ["BACHELOR", "MASTER", "CAREER_CHANGER", "YOUNG_PROFESSIONAL"]);
export const difficultyEnum = pgEnum("difficulty", ["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const programStatusEnum = pgEnum("program_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const cohortStatusEnum = pgEnum("cohort_status", ["OPEN", "CLOSED"]);

// ─── Utilisateurs ───────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull(),
  headline: text("headline"), // ex. « Ex-analyste M&A, 8 ans en banque d'affaires » — affiché pour les coachs
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Programmes ─────────────────────────────────────────────────────────────
export const programs = pgTable(
  "programs",
  {
    id: id(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    domain: domainEnum("domain").notNull(),
    audience: audienceEnum("audience").notNull(),
    difficulty: difficultyEnum("difficulty").notNull(),
    sessionCount: integer("session_count").notNull(), // règle : 2 à 4
    recommendedGroupSize: integer("recommended_group_size").notNull().default(3),
    maxCapacity: integer("max_capacity").notNull(), // règle : 1 à 20 — plafond des cohortes
    learningObjectives: text("learning_objectives").array().notNull().default([]),
    status: programStatusEnum("status").notNull().default("DRAFT"),
    coachId: text("coach_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("programs_status_domain_idx").on(t.status, t.domain), index("programs_coach_idx").on(t.coachId)],
);

// ─── Cohortes (promotions) ──────────────────────────────────────────────────
export const cohorts = pgTable(
  "cohorts",
  {
    id: id(),
    programId: text("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(), // règle : > startDate
    capacity: integer("capacity").notNull(), // règle : 1 à program.maxCapacity
    status: cohortStatusEnum("status").notNull().default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cohorts_program_idx").on(t.programId), index("cohorts_start_idx").on(t.startDate)],
);

// ─── Sessions ───────────────────────────────────────────────────────────────
export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    cohortId: text("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(), // règle : dans la fenêtre de la cohorte
    durationMinutes: integer("duration_minutes").notNull().default(45),
    order: integer("order").notNull(), // 1..4
  },
  (t) => [uniqueIndex("sessions_cohort_order_uq").on(t.cohortId, t.order), index("sessions_starts_idx").on(t.startsAt)],
);

// ─── Inscriptions ───────────────────────────────────────────────────────────
export const enrollments = pgTable(
  "enrollments",
  {
    id: id(),
    studentId: text("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    cohortId: text("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("enrollments_student_cohort_uq").on(t.studentId, t.cohortId), index("enrollments_cohort_idx").on(t.cohortId)],
);

// ─── Explorations (devoirs facultatifs) ─────────────────────────────────────
export const explorations = pgTable(
  "explorations",
  {
    id: id(),
    programId: text("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => sessions.id, { onDelete: "cascade" }), // optionnel
    title: text("title").notNull(),
    description: text("description").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("explorations_program_idx").on(t.programId)],
);

// ─── Relations (pour db.query.*) ────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  programs: many(programs),
  enrollments: many(enrollments),
}));

export const programsRelations = relations(programs, ({ one, many }) => ({
  coach: one(users, { fields: [programs.coachId], references: [users.id] }),
  cohorts: many(cohorts),
  explorations: many(explorations),
}));

export const cohortsRelations = relations(cohorts, ({ one, many }) => ({
  program: one(programs, { fields: [cohorts.programId], references: [programs.id] }),
  sessions: many(sessions),
  enrollments: many(enrollments),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  cohort: one(cohorts, { fields: [sessions.cohortId], references: [cohorts.id] }),
  explorations: many(explorations),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, { fields: [enrollments.studentId], references: [users.id] }),
  cohort: one(cohorts, { fields: [enrollments.cohortId], references: [cohorts.id] }),
}));

export const explorationsRelations = relations(explorations, ({ one }) => ({
  program: one(programs, { fields: [explorations.programId], references: [programs.id] }),
  session: one(sessions, { fields: [explorations.sessionId], references: [sessions.id] }),
}));

// ─── Types ──────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Cohort = typeof cohorts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Exploration = typeof explorations.$inferSelect;
export type Role = User["role"];
