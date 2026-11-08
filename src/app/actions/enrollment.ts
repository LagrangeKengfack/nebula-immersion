"use server";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cohorts, enrollments } from "@/db/schema";
import { AuthError, requireStudent } from "@/lib/auth";
import { canEnroll, effectiveStatus } from "@/lib/domain/cohort";
import type { ActionState } from "./types";

export async function enroll(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const student = await requireStudent();
    const cohortId = String(formData.get("cohortId") ?? "");
    if (!cohortId) return { ok: false, message: "Promotion introuvable." };

    const cohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, cohortId),
      with: { program: { columns: { id: true, status: true } }, enrollments: { columns: { studentId: true } } },
    });
    if (!cohort || cohort.program.status !== "PUBLISHED") return { ok: false, message: "Cette promotion n'est pas disponible." };

    const status = effectiveStatus(cohort.status, cohort.enrollments.length, cohort.capacity);
    const already = cohort.enrollments.some((e) => e.studentId === student.id);
    const verdict = canEnroll(status, already);
    if (!verdict.ok) return { ok: false, message: verdict.reason };

    // Insertion conditionnelle : la capacité est re-vérifiée DANS la requête pour
    // résister à deux inscriptions simultanées sur la dernière place.
    const inserted = await db.execute(sql`
      insert into ${enrollments} (id, student_id, cohort_id)
      select gen_random_uuid()::text, ${student.id}, ${cohort.id}
      where (select count(*) from ${enrollments} e where e.cohort_id = ${cohort.id}) < ${cohort.capacity}
      on conflict do nothing
      returning id
    `);
    if (inserted.rows.length === 0) return { ok: false, message: "La dernière place vient d'être prise. Cette promotion est complète." };

    revalidatePath(`/programmes/${cohort.program.id}`);
    revalidatePath("/mes-programmes");
    revalidatePath("/admin");
    return { ok: true, message: "Inscription confirmée. Retrouvez vos sessions dans « Mes programmes »." };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, message: e.message };
    console.error("enroll", e);
    return { ok: false, message: "Une erreur est survenue. Réessayez dans un instant." };
  }
}

export async function unenroll(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const student = await requireStudent();
    const enrollmentId = String(formData.get("enrollmentId") ?? "");
    const [row] = await db
      .delete(enrollments)
      .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.studentId, student.id)))
      .returning({ cohortId: enrollments.cohortId });
    if (!row) return { ok: false, message: "Inscription introuvable." };
    revalidatePath("/mes-programmes");
    revalidatePath("/programmes");
    return { ok: true, message: "Désinscription effectuée." };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, message: e.message };
    console.error("unenroll", e);
    return { ok: false, message: "Une erreur est survenue." };
  }
}
