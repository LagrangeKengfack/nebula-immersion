import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardHeader, EmptyState, cohortStatusTone, difficultyTone } from "@/components/ui";
import { EnrollButton } from "@/components/student/EnrollButton";
import { SessionList } from "@/components/SessionList";
import { getCurrentUser } from "@/lib/auth";
import { formatRange } from "@/lib/format";
import { AUDIENCE_LABELS, COHORT_STATUS_LABELS, DIFFICULTY_LABELS, DOMAIN_LABELS } from "@/lib/labels";
import { getPublishedProgramDetail } from "@/lib/queries/programs";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getPublishedProgramDetail(id);
  return { title: p?.title ?? "Programme" };
}

export default async function ProgramDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  const program = await getPublishedProgramDetail(id, user?.role === "STUDENT" ? user.id : undefined);
  if (!program) notFound();
  const now = new Date();

  const isStudent = user?.role === "STUDENT";

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Link href="/programmes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          ← Tous les programmes
        </Link>
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge tone="brand">{DOMAIN_LABELS[program.domain]}</Badge>
          <Badge tone={difficultyTone[program.difficulty]}>{DIFFICULTY_LABELS[program.difficulty]}</Badge>
          <Badge>{AUDIENCE_LABELS[program.audience]}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{program.title}</h1>
        <p className="mt-4 whitespace-pre-line text-slate-700">{program.description}</p>

        <Card className="mt-8">
          <CardHeader title="Objectifs pédagogiques" />
          <ul className="space-y-2 px-5 py-4">
            {program.learningObjectives.map((o, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="mt-0.5 text-brand-600">✓</span>
                {o}
              </li>
            ))}
          </ul>
        </Card>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Promotions à venir</h2>
          {program.cohorts.length === 0 ? (
            <EmptyState title="Aucune promotion programmée" description="Le coach n'a pas encore ouvert de dates. Revenez bientôt." />
          ) : (
            <div className="space-y-4">
              {program.cohorts.map((c) => {
                const label = COHORT_STATUS_LABELS[c.effectiveStatus];
                const remaining = c.capacity - c.enrolledCount;
                return (
                  <Card key={c.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{formatRange(c.startDate, c.endDate)}</h3>
                          <Badge tone={cohortStatusTone[c.effectiveStatus]}>{label}</Badge>
                          {c.isEnrolled && <Badge tone="brand">Vous êtes inscrit</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {c.enrolledCount} / {c.capacity} participants
                          {c.effectiveStatus === "OPEN" && remaining <= 3 && <span className="ml-2 font-medium text-amber-700">· {remaining} place{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}</span>}
                        </p>
                      </div>
                      <div className="w-full sm:w-auto">
                        {c.isEnrolled ? (
                          <Link href="/mes-programmes" className="btn btn-secondary w-full sm:w-auto">
                            Voir dans Mes programmes
                          </Link>
                        ) : !user ? (
                          <p className="text-sm text-slate-500">Connectez-vous comme étudiant pour vous inscrire.</p>
                        ) : !isStudent ? (
                          <p className="text-sm text-slate-500">Seuls les étudiants peuvent s&apos;inscrire.</p>
                        ) : (
                          <EnrollButton cohortId={c.id} disabled={c.effectiveStatus !== "OPEN"} disabledLabel={label} />
                        )}
                      </div>
                    </div>
                    <details className="mt-4 group">
                      <summary className="cursor-pointer text-sm font-medium text-brand-700 hover:underline">
                        Voir les {c.sessions.length} sessions
                      </summary>
                      <div className="mt-2 rounded-lg bg-slate-50 px-4">
                        <SessionList sessions={c.sessions} compact now={now} />
                      </div>
                    </details>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-4 lg:pt-12">
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Votre coach</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">{program.coach.name.charAt(0)}</div>
            <div>
              <p className="font-medium text-slate-900">{program.coach.name}</p>
              {program.coach.headline && <p className="text-sm text-slate-500">{program.coach.headline}</p>}
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Format</dt>
              <dd className="text-right font-medium text-slate-900">{program.sessionCount} sessions de 45 min</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Groupe</dt>
              <dd className="text-right font-medium text-slate-900">{program.recommendedGroupSize} participants recommandés</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Promotion</dt>
              <dd className="text-right font-medium text-slate-900">jusqu&apos;à {program.maxCapacity} participants</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Public</dt>
              <dd className="text-right font-medium text-slate-900">{AUDIENCE_LABELS[program.audience]}</dd>
            </div>
          </dl>
        </Card>
        {program.explorations.length > 0 && (
          <Card className="p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Explorations incluses</div>
            <p className="mt-1 text-xs text-slate-500">Exercices facultatifs à faire chez soi, visibles après inscription.</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {program.explorations.map((e) => (
                <li key={e.id}>· {e.title}</li>
              ))}
            </ul>
          </Card>
        )}
      </aside>
    </div>
  );
}
