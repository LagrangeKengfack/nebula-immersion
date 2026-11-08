import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { autoScheduleSessions, setCohortStatus } from "@/app/actions/coach";
import { Badge, Card, CardHeader, EmptyState, cohortStatusTone } from "@/components/ui";
import { SessionForm } from "@/components/coach/SessionForm";
import { getCurrentCoach } from "@/lib/auth";
import { formatRange, formatShortDate } from "@/lib/format";
import { COHORT_STATUS_LABELS } from "@/lib/labels";
import { getCoachCohort } from "@/lib/queries/programs";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Gérer la promotion" };

export default async function CoachCohortPage({ params }: Props) {
  const coach = await getCurrentCoach();
  if (!coach) return null;
  const { id } = await params;
  const cohort = await getCoachCohort(id, coach.id);
  if (!cohort) notFound();

  const remaining = cohort.capacity - cohort.enrolledCount;

  return (
    <div>
      <Link href={`/coach/programmes/${cohort.programId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        ← {cohort.program.title}
      </Link>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={cohortStatusTone[cohort.effectiveStatus]}>{COHORT_STATUS_LABELS[cohort.effectiveStatus]}</Badge>
            <span className="text-xs text-slate-500">
              {cohort.enrolledCount} / {cohort.capacity} inscrits{cohort.effectiveStatus === "OPEN" && ` · ${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Promotion du {formatRange(cohort.startDate, cohort.endDate)}</h1>
          <p className="mt-1 text-sm text-slate-500">{cohort.program.title}</p>
        </div>
        <form action={setCohortStatus}>
          <input type="hidden" name="cohortId" value={cohort.id} />
          {cohort.status === "OPEN" ? (
            <button name="status" value="CLOSED" className="btn btn-secondary">
              Fermer les inscriptions
            </button>
          ) : (
            <button name="status" value="OPEN" className="btn btn-primary">
              Rouvrir les inscriptions
            </button>
          )}
        </form>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title={`Sessions (${cohort.sessions.length})`}
              description="Chaque session doit se tenir pendant la promotion. 45 minutes par défaut."
              action={
                <form action={autoScheduleSessions}>
                  <input type="hidden" name="cohortId" value={cohort.id} />
                  <button className="btn btn-secondary btn-sm" title="Répartit les dates uniformément entre le début et la fin de la promotion">
                    Répartir automatiquement les dates
                  </button>
                </form>
              }
            />
            <div className="divide-y divide-slate-100">
              {cohort.sessions.map((s) => (
                <div key={s.id} className="px-5 py-5">
                  <SessionForm session={s} windowStart={cohort.startDate} windowEnd={cohort.endDate} />
                  {s.explorations.length > 0 && (
                    <p className="mt-2 text-xs text-slate-500">
                      Exploration liée : {s.explorations.map((e) => e.title).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader title="Étudiants inscrits" description={`${cohort.enrolledCount} sur ${cohort.capacity}`} />
            {cohort.enrollments.length === 0 ? (
              <div className="p-5">
                <EmptyState title="Personne pour l'instant" description="Les étudiants s'inscrivent depuis la page publique du programme." />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {cohort.enrollments.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{e.student.name.charAt(0)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{e.student.name}</p>
                      <p className="truncate text-xs text-slate-500">{e.student.email}</p>
                    </div>
                    <div className="text-xs text-slate-400">{formatShortDate(e.createdAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-xs text-slate-600">
            <p className="font-medium text-slate-700">Taille de groupe recommandée : {cohort.program.recommendedGroupSize}</p>
            <p className="mt-1">
              Avec {cohort.enrolledCount} inscrit{cohort.enrolledCount > 1 ? "s" : ""}, prévoyez {Math.max(1, Math.ceil(cohort.enrolledCount / cohort.program.recommendedGroupSize))} groupe{Math.ceil(cohort.enrolledCount / cohort.program.recommendedGroupSize) > 1 ? "s" : ""}.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
