import { z } from "zod";
import { COHORT_CAPACITY_MAX, COHORT_CAPACITY_MIN, SESSION_COUNT_MAX, SESSION_COUNT_MIN } from "@/lib/domain/cohort";

// ─── Enums partagés avec Prisma (mêmes valeurs) ─────────────────────────────
export const DOMAINS = ["FINANCE", "CONSULTING", "DATA", "PRODUCT", "SOFTWARE_ENGINEERING", "MARKETING", "ENTREPRENEURSHIP"] as const;
export const AUDIENCES = ["BACHELOR", "MASTER", "CAREER_CHANGER", "YOUNG_PROFESSIONAL"] as const;
export const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const PROGRAM_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const COHORT_STATUSES = ["OPEN", "CLOSED"] as const;

const requiredText = (label: string, min = 3, max = 200) =>
  z.string().trim().min(min, `${label} : ${min} caractères minimum.`).max(max, `${label} : ${max} caractères maximum.`);

const intInRange = (label: string, min: number, max: number) =>
  z.coerce.number({ message: `${label} : nombre attendu.` }).int(`${label} : entier attendu.`).min(min, `${label} : minimum ${min}.`).max(max, `${label} : maximum ${max}.`);

// ─── Programme ──────────────────────────────────────────────────────────────
export const programSchema = z
  .object({
    title: requiredText("Le titre", 3, 120),
    description: requiredText("La description", 20, 2000),
    domain: z.enum(DOMAINS, { message: "Domaine invalide." }),
    audience: z.enum(AUDIENCES, { message: "Public cible invalide." }),
    difficulty: z.enum(DIFFICULTIES, { message: "Niveau invalide." }),
    sessionCount: intInRange("Le nombre de sessions", SESSION_COUNT_MIN, SESSION_COUNT_MAX),
    recommendedGroupSize: intInRange("La taille de groupe recommandée", 1, COHORT_CAPACITY_MAX),
    maxCapacity: intInRange("La taille maximale", COHORT_CAPACITY_MIN, COHORT_CAPACITY_MAX),
    // Textarea : un objectif par ligne
    learningObjectives: z
      .string()
      .transform((s) => s.split("\n").map((l) => l.trim()).filter(Boolean))
      .pipe(z.array(z.string().max(200)).min(1, "Indiquez au moins un objectif pédagogique.").max(10)),
    status: z.enum(PROGRAM_STATUSES).default("DRAFT"),
  })
  .refine((p) => p.recommendedGroupSize <= p.maxCapacity, {
    message: "La taille recommandée ne peut pas dépasser la taille maximale.",
    path: ["recommendedGroupSize"],
  });

export type ProgramInput = z.infer<typeof programSchema>;

// ─── Cohorte ────────────────────────────────────────────────────────────────
const dateInput = (label: string) =>
  z.coerce.date({ message: `${label} : date invalide.` });

export const cohortSchema = z
  .object({
    startDate: dateInput("La date de début"),
    endDate: dateInput("La date de fin"),
    capacity: intInRange("La capacité", COHORT_CAPACITY_MIN, COHORT_CAPACITY_MAX),
    status: z.enum(COHORT_STATUSES).default("OPEN"),
  })
  .refine((c) => c.endDate > c.startDate, {
    message: "La date de fin doit être postérieure à la date de début.",
    path: ["endDate"],
  });

export type CohortInput = z.infer<typeof cohortSchema>;

// ─── Session ────────────────────────────────────────────────────────────────
export const sessionSchema = z.object({
  title: requiredText("Le titre", 3, 120),
  description: z.string().trim().max(1000).default(""),
  startsAt: dateInput("La date de session"),
  durationMinutes: intInRange("La durée", 15, 240).default(45),
  order: intInRange("L'ordre", 1, SESSION_COUNT_MAX),
});

export type SessionInput = z.infer<typeof sessionSchema>;

// ─── Exploration ────────────────────────────────────────────────────────────
export const explorationSchema = z.object({
  title: requiredText("Le titre", 3, 120),
  description: requiredText("La description", 10, 2000),
  sessionId: z.string().trim().optional().transform((v) => (v ? v : null)),
  dueDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Date de remise invalide."),
});

export type ExplorationInput = z.infer<typeof explorationSchema>;

// ─── Utilitaire : erreurs Zod → map champ → message ─────────────────────────
export type FieldErrors = Record<string, string>;

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Convertit un FormData en objet plat (les champs vides deviennent undefined). */
export function formToObject(fd: FormData): Record<string, string | undefined> {
  const o: Record<string, string | undefined> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") o[k] = v === "" ? undefined : v;
  }
  return o;
}
