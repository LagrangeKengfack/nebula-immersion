"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cohorts, explorations, programs, sessions } from "@/db/schema";
import { AuthError, requireCoach } from "@/lib/auth";
import { isSessionInWindow, isValidCapacity, suggestSessionDates } from "@/lib/domain/cohort";
import { cohortSchema, explorationSchema, formToObject, programSchema, sessionSchema, toFieldErrors } from "@/lib/validation/schemas";
import type { ActionState } from "./types";

function fail(e: unknown, fallback: string): ActionState {
  if (e instanceof AuthError) return { ok: false, message: e.message };
  console.error(fallback, e);
  return { ok: false, message: fallback };
}

/** Garantit que le programme appartient au coach connecté. */
async function ownProgram(programId: string, coachId: string) {
  const [p] = await db.select().from(programs).where(and(eq(programs.id, programId), eq(programs.coachId, coachId))).limit(1);
  if (!p) throw new AuthError("Programme introuvable ou non autorisé.");
  return p;
}

async function ownCohort(cohortId: string, coachId: string) {
  const c = await db.query.cohorts.findFirst({ where: eq(cohorts.id, cohortId), with: { program: true } });
  if (!c || c.program.coachId !== coachId) throw new AuthError("Promotion introuvable ou non autorisée.");
  return c;
}

// ─── Programmes ─────────────────────────────────────────────────────────────

export async function createProgram(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formToObject(formData);
  try {
    const coach = await requireCoach();
    const parsed = programSchema.safeParse(values);
    if (!parsed.success) return { ok: false, errors: toFieldErrors(parsed.error), values };
    const [created] = await db.insert(programs).values({ ...parsed.data, coachId: coach.id }).returning({ id: programs.id });
    revalidatePath("/coach/programmes");
    revalidatePath("/programmes");
    redirect(`/coach/programmes/${created.id}`);
  } catch (e) {
    if (isRedirect(e)) throw e;
    return { ...fail(e, "Impossible de créer le programme."), values };
  }
}

export async function updateProgram(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formToObject(formData);
  try {
    const coach = await requireCoach();
    const programId = String(formData.get("programId") ?? "");
    const existing = await ownProgram(programId, coach.id);
    const parsed = programSchema.safeParse(values);
    if (!parsed.success) return { ok: false, errors: toFieldErrors(parsed.error), values };

    // Règle : on ne réduit pas le nombre de sessions d'un programme qui a déjà des cohortes planifiées.
    if (parsed.data.sessionCount !== existing.sessionCount) {
      const [c] = await db.select({ id: cohorts.id }).from(cohorts).where(eq(cohorts.programId, programId)).limit(1);
      if (c) return { ok: false, values, errors: { sessionCount: "Impossible de changer le nombre de sessions : des promotions existent déjà." } };
    }
    await db.update(programs).set(parsed.data).where(eq(programs.id, programId));
    revalidatePath(`/coach/programmes/${programId}`);
    revalidatePath("/coach/programmes");
    revalidatePath("/programmes");
    revalidatePath(`/programmes/${programId}`);
    return { ok: true, message: "Programme mis à jour.", values };
  } catch (e) {
    return { ...fail(e, "Impossible de mettre à jour le programme."), values };
  }
}

export async function setProgramStatus(formData: FormData) {
  const coach = await requireCoach();
  const programId = String(formData.get("programId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) return;
  await ownProgram(programId, coach.id);
  await db.update(programs).set({ status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" }).where(eq(programs.id, programId));
  revalidatePath(`/coach/programmes/${programId}`);
  revalidatePath("/coach/programmes");
  revalidatePath("/programmes");
  revalidatePath("/admin");
}

// ─── Cohortes ───────────────────────────────────────────────────────────────

export async function createCohort(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formToObject(formData);
  try {
    const coach = await requireCoach();
    const programId = String(formData.get("programId") ?? "");
    const program = await ownProgram(programId, coach.id);
    if (program.status !== "PUBLISHED") return { ok: false, values, message: "Publiez d'abord le programme avant de créer une promotion." };

    const parsed = cohortSchema.safeParse(values);
    if (!parsed.success) return { ok: false, errors: toFieldErrors(parsed.error), values };
    const { startDate, endDate, capacity, status } = parsed.data;
    if (!isValidCapacity(capacity, program.maxCapacity)) {
      return { ok: false, values, errors: { capacity: `La capacité doit être comprise entre 1 et ${program.maxCapacity} (taille maximale du programme).` } };
    }

    // Les sessions sont créées immédiatement, pré-remplies par le planning automatique,
    // pour garantir l'invariant « autant de sessions que le programme ». Le coach les ajuste ensuite.
    const dates = suggestSessionDates({ startDate, endDate }, program.sessionCount);
    const [cohort] = await db.insert(cohorts).values({ programId, startDate, endDate, capacity, status }).returning({ id: cohorts.id });
    await db.insert(sessions).values(
      dates.map((startsAt, i) => ({ cohortId: cohort.id, order: i + 1, title: `Session ${i + 1}`, description: "", startsAt })),
    );
    revalidatePath(`/coach/programmes/${programId}`);
    revalidatePath(`/programmes/${programId}`);
    revalidatePath("/admin");
    redirect(`/coach/cohorts/${cohort.id}`);
  } catch (e) {
    if (isRedirect(e)) throw e;
    return { ...fail(e, "Impossible de créer la promotion."), values };
  }
}

export async function setCohortStatus(formData: FormData) {
  const coach = await requireCoach();
  const cohortId = String(formData.get("cohortId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["OPEN", "CLOSED"].includes(status)) return;
  const c = await ownCohort(cohortId, coach.id);
  await db.update(cohorts).set({ status: status as "OPEN" | "CLOSED" }).where(eq(cohorts.id, cohortId));
  revalidatePath(`/coach/cohorts/${cohortId}`);
  revalidatePath(`/coach/programmes/${c.programId}`);
  revalidatePath(`/programmes/${c.programId}`);
}

// ─── Sessions ───────────────────────────────────────────────────────────────

export async function updateSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formToObject(formData);
  try {
    const coach = await requireCoach();
    const sessionId = String(formData.get("sessionId") ?? "");
    const [s] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!s) return { ok: false, values, message: "Session introuvable." };
    const cohort = await ownCohort(s.cohortId, coach.id);

    const parsed = sessionSchema.safeParse({ ...values, order: s.order });
    if (!parsed.success) return { ok: false, errors: toFieldErrors(parsed.error), values };
    if (!isSessionInWindow(parsed.data.startsAt, cohort)) {
      return { ok: false, values, errors: { startsAt: "La session doit avoir lieu pendant la promotion." } };
    }
    const { order: _order, ...data } = parsed.data;
    void _order;
    await db.update(sessions).set(data).where(eq(sessions.id, sessionId));
    revalidatePath(`/coach/cohorts/${cohort.id}`);
    revalidatePath(`/programmes/${cohort.programId}`);
    revalidatePath("/mes-programmes");
    revalidatePath("/admin");
    return { ok: true, message: `Session ${s.order} enregistrée.`, values };
  } catch (e) {
    return { ...fail(e, "Impossible d'enregistrer la session."), values };
  }
}

/** Bonus : re-répartit uniformément les dates des sessions sur la durée de la promotion. */
export async function autoScheduleSessions(formData: FormData) {
  const coach = await requireCoach();
  const cohortId = String(formData.get("cohortId") ?? "");
  const cohort = await ownCohort(cohortId, coach.id);
  const existing = await db.select().from(sessions).where(eq(sessions.cohortId, cohortId)).orderBy(sessions.order);
  const dates = suggestSessionDates(cohort, existing.length);
  await Promise.all(existing.map((s, i) => db.update(sessions).set({ startsAt: dates[i] }).where(eq(sessions.id, s.id))));
  revalidatePath(`/coach/cohorts/${cohortId}`);
  revalidatePath("/mes-programmes");
}

// ─── Explorations ───────────────────────────────────────────────────────────

export async function createExploration(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = formToObject(formData);
  try {
    const coach = await requireCoach();
    const programId = String(formData.get("programId") ?? "");
    await ownProgram(programId, coach.id);
    const parsed = explorationSchema.safeParse(values);
    if (!parsed.success) return { ok: false, errors: toFieldErrors(parsed.error), values };

    // Si une session est liée, elle doit appartenir à une cohorte de ce programme.
    if (parsed.data.sessionId) {
      const s = await db.query.sessions.findFirst({ where: eq(sessions.id, parsed.data.sessionId), with: { cohort: { columns: { programId: true } } } });
      if (!s || s.cohort.programId !== programId) return { ok: false, values, errors: { sessionId: "Session invalide pour ce programme." } };
    }
    await db.insert(explorations).values({ ...parsed.data, programId });
    revalidatePath(`/coach/programmes/${programId}`);
    revalidatePath("/mes-programmes");
    return { ok: true, message: "Exploration ajoutée." };
  } catch (e) {
    return { ...fail(e, "Impossible d'ajouter l'exploration."), values };
  }
}

export async function deleteExploration(formData: FormData) {
  const coach = await requireCoach();
  const id = String(formData.get("explorationId") ?? "");
  const e = await db.query.explorations.findFirst({ where: eq(explorations.id, id), with: { program: { columns: { coachId: true, id: true } } } });
  if (!e || e.program.coachId !== coach.id) throw new AuthError();
  await db.delete(explorations).where(eq(explorations.id, id));
  revalidatePath(`/coach/programmes/${e.program.id}`);
  revalidatePath("/mes-programmes");
}

// Next.js implémente redirect() en levant une exception : il faut la laisser passer.
function isRedirect(e: unknown): boolean {
  return typeof e === "object" && e !== null && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}
