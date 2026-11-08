import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteExploration, setProgramStatus } from "@/app/actions/coach";
import { Badge, Card, CardHeader, EmptyState, cohortStatusTone, programStatusTone } from "@/components/ui";
import { CohortForm } from "@/components/coach/CohortForm";
import { ExplorationForm } from "@/components/coach/ExplorationForm";
import { ProgramForm } from "@/components/coach/ProgramForm";
import { getCurrentCoach } from "@/lib/auth";
import { formatDate, formatRange, formatShortDate } from "@/lib/format";
import { COHORT_STATUS_LABELS, DOMAIN_LABELS, PROGRAM_STATUS_LABELS } from "@/lib/labels";
import { getCoachProgram } from "@/lib/queries/programs";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const coach = await getCurrentCoach();
  if (!coach) return { title: "Espace coach" };
  const { id } = await params;
  const p = await getCoachProgram(id, coach.id);
  return { title: p ? `${p.title} (coach)` : "Programme" };
}

export default async function CoachProgramPage({ params }: Props) {
  const coach = await getCurrentCoach();
  if (!coach) return null;
  const { id } = await params;
  const program = await getCoachProgram(id, coach.id);
  if (!program) notFound();

  const sessionOptions = program.cohorts.flatMap((c) => c.sessions.map((s) => ({ id: s.id, label: `Promo du ${formatShortDate(c.startDate)} · Session ${s.order} : ${s.title}` })));
  const totalEnrolled = program.cohorts.reduce((n, c) => n + c.enrolledCount, 0);

  return (
    <div>
      <Link href="/coach/programmes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        ← Mes programmes
      </Link>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={programStatusTone[program.status]}>{PROGRAM_STATUS_LABELS[program.status]}</Badge>
            <Badge tone="brand">{DOMAIN_LABELS[program.domain]}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{program.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {program.cohorts.length} promotion{program.cohorts.length > 1 ? "s" : ""} · {totalEnrolled} inscrit{totalEnrolled > 1 ? "s" : ""} · {program.sessionCount} sessions par promotion
          </p>
        </div>
        <form action={setProgramStatus} className="flex gap-2">
          <input type="hidden" name="programId" value={program.id} />
          {program.status !== "PUBLISHED" && (
            <button name="status" value="PUBLISHED" className="btn btn-primary">
              Publier
            </button>
          )}
          {program.status === "PUBLISHED" && (
            <>
              <Link href={`/programmes/${program.id}`} className="btn btn-secondary" target="_blank">
                Voir la page publique ↗
              </Link>
              <button name="status" value="ARCHIVED" className="btn btn-secondary">
                Archiver
              </button>
            </>
          )}
          {program.status === "ARCHIVED" && (
            <button name="status" value="DRAFT" className="btn btn-secondary">
              Repasser en brouillon
            </button>
          )}
        </form>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Promotions */}
          <Card>
            <CardHeader title="Promotions" description="Chaque promotion a ses dates, sa capacité et son calendrier de sessions." />
            {program.cohorts.length === 0 ? (
              <div className="p-5">
                <EmptyState title="Aucune promotion" description={program.status === "PUBLISHED" ? "Créez la première promotion avec le formulaire ci-contre." : "Publiez le programme pour pouvoir ouvrir une promotion."} />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {program.cohorts.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/coach/cohorts/${c.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                          {formatRange(c.startDate, c.endDate)}
                        </Link>
                        <Badge tone={cohortStatusTone[c.effectiveStatus]}>{COHORT_STATUS_LABELS[c.effectiveStatus]}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {c.enrolledCount} / {c.capacity} inscrits · {c.sessions.length} sessions
                        {c.sessions.some((s) => s.title.startsWith("Session ")) && <span className="ml-1 text-amber-700">· titres à compléter</span>}
                      </p>
                    </div>
                    <Link href={`/coach/cohorts/${c.id}`} className="btn btn-secondary btn-sm">
                      Gérer
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Explorations */}
          <Card>
            <CardHeader title="Explorations" description="Exercices facultatifs à faire chez soi. Visibles par les étudiants inscrits." />
            <div className="px-5 py-4">
              {program.explorations.length === 0 ? (
                <p className="mb-4 text-sm text-slate-500">Aucune exploration pour l&apos;instant.</p>
              ) : (
                <ul className="mb-6 divide-y divide-slate-100">
                  {program.explorations.map((e) => (
                    <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{e.title}</p>
                        <p className="text-xs text-slate-500">
                          {e.session ? `Session ${e.session.order} · ${e.session.title}` : "Tout le programme"}
                          {e.dueDate && ` · à rendre le ${formatDate(e.dueDate)}`}
                        </p>
                      </div>
                      <form action={deleteExploration}>
                        <input type="hidden" name="explorationId" value={e.id} />
                        <button className="btn btn-danger btn-sm">Supprimer</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <details className="rounded-lg border border-slate-200 p-4" open={program.explorations.length === 0}>
                <summary className="cursor-pointer text-sm font-medium text-slate-900">+ Ajouter une exploration</summary>
                <div className="mt-4">
                  <ExplorationForm programId={program.id} sessionOptions={sessionOptions} />
                </div>
              </details>
            </div>
          </Card>

          {/* Édition */}
          <Card>
            <CardHeader title="Informations du programme" description="Modifiez la description, le public, les objectifs." />
            <div className="p-5">
              <ProgramForm program={{ ...program, cohortCount: program.cohorts.length } as typeof program & { cohortCount: number }} />
            </div>
          </Card>
        </div>

        <aside>
          <Card className="sticky top-20 p-5">
            <h2 className="font-semibold text-slate-900">Nouvelle promotion</h2>
            {program.status !== "PUBLISHED" ? (
              <p className="mt-2 text-sm text-slate-500">Publiez d&apos;abord le programme : une promotion ne peut être ouverte que sur un programme visible des étudiants.</p>
            ) : (
              <div className="mt-4">
                <CohortForm programId={program.id} maxCapacity={program.maxCapacity} sessionCount={program.sessionCount} recommendedGroupSize={program.recommendedGroupSize} />
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
