import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied, Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { SessionList } from "@/components/SessionList";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatDateTime, formatRange } from "@/lib/format";
import { listStudentEnrollments } from "@/lib/queries/programs";

export const metadata: Metadata = { title: "Mes programmes" };

export default async function MyProgramsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") return <AccessDenied role="étudiant" />;

  const items = await listStudentEnrollments(user.id);
  const now = new Date();
  const upcoming = items.filter((i) => !i.isPast);
  const past = items.filter((i) => i.isPast);

  return (
    <div>
      <PageHeader
        eyebrow="Espace étudiant"
        title="Mes programmes"
        description="Vos promotions, le calendrier de vos sessions et les explorations proposées par vos coachs."
        action={
          <Link href="/programmes" className="btn btn-secondary">
            Découvrir d&apos;autres programmes
          </Link>
        }
      />

      {items.length === 0 && (
        <EmptyState
          title="Vous n'êtes inscrit à aucun programme"
          description="Parcourez le catalogue et choisissez une promotion ouverte. Vos sessions apparaîtront ici."
          action={
            <Link href="/programmes" className="btn btn-primary">
              Voir les programmes
            </Link>
          }
        />
      )}

      <div className="space-y-6">
        {upcoming.map((item) => (
          <Card key={item.enrollmentId}>
            <CardHeader
              title={
                <Link href={`/programmes/${item.program.id}`} className="hover:text-brand-700">
                  {item.program.title}
                </Link>
              }
              description={
                <>
                  Coach <span className="font-medium text-slate-700">{item.program.coach.name}</span> · {formatRange(item.cohort.startDate, item.cohort.endDate)} · {item.cohort.enrolledCount} / {item.cohort.capacity} participants
                </>
              }
              action={
                item.nextSession ? (
                  <div className="rounded-lg bg-brand-50 px-3 py-2 text-right text-xs text-brand-700">
                    <div className="font-medium">Prochaine session</div>
                    <div>{formatDateTime(item.nextSession.startsAt)}</div>
                  </div>
                ) : (
                  <Badge>En cours</Badge>
                )
              }
            />
            <div className="grid gap-6 px-5 py-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Calendrier des sessions</h3>
                <SessionList sessions={item.sessions} highlightId={item.nextSession?.id} now={now} />
              </div>
              <div>
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Explorations</h3>
                {item.explorations.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun exercice facultatif pour le moment.</p>
                ) : (
                  <ul className="space-y-3">
                    {item.explorations.map((e) => {
                      const session = e.sessionId ? item.sessions.find((s) => s.id === e.sessionId) : null;
                      return (
                        <li key={e.id} className="rounded-lg border border-slate-200 p-3">
                          <p className="text-sm font-medium text-slate-900">{e.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{e.description}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            {session ? `Avant la session ${session.order}` : "Tout le programme"}
                            {e.dueDate && ` · à rendre le ${formatDate(e.dueDate)}`}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">Programmes terminés</h2>
          <div className="space-y-2">
            {past.map((item) => (
              <Card key={item.enrollmentId} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 opacity-80">
                <div>
                  <p className="font-medium text-slate-900">{item.program.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatRange(item.cohort.startDate, item.cohort.endDate)} · {item.program.coach.name}
                  </p>
                </div>
                <Badge>Terminé</Badge>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
