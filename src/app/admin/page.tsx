import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied, Card, CardHeader, PageHeader, StatTile } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, formatShortDate } from "@/lib/format";
import { getAdminDashboard } from "@/lib/queries/programs";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return <AccessDenied role="administrateur" />;
  const d = await getAdminDashboard();

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Activité de la plateforme" description="Vue d'ensemble opérationnelle : offre (programmes, cohortes), demande (étudiants, inscriptions) et prochaines échéances." />

      <section aria-label="Offre" className="mb-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Offre</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Programmes" value={d.totalPrograms} hint={`${d.publishedPrograms} publié${d.publishedPrograms > 1 ? "s" : ""}, ${d.totalPrograms - d.publishedPrograms} brouillon/archivé`} />
          <StatTile label="Programmes publiés" value={d.publishedPrograms} hint="Visibles par les étudiants" />
          <StatTile label="Cohortes actives" value={d.activeCohorts} hint="Ouvertes, en cours ou à venir" />
          <StatTile label="Coachs" value={d.totalCoaches} />
        </div>
      </section>

      <section aria-label="Demande" className="mb-8">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Demande</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Inscriptions" value={d.totalEnrollments} hint="Toutes cohortes confondues" />
          <StatTile label="Étudiants" value={d.totalStudents} hint={d.totalStudents > 0 ? `${(d.totalEnrollments / d.totalStudents).toFixed(1)} inscription(s) par étudiant` : undefined} />
          <StatTile label="Taux de remplissage" value={d.fillRate === null ? "—" : `${d.fillRate} %`} hint="Places prises sur les cohortes actives" />
          <StatTile label="Sessions à venir" value={d.upcomingSessions.length >= 8 ? "8+" : d.upcomingSessions.length} hint="Dans les prochaines semaines" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Prochaines sessions" description="Les 8 prochaines, tous programmes confondus" />
          {d.upcomingSessions.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">Aucune session planifiée.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.upcomingSessions.map((s) => (
                <li key={s.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-28 shrink-0 text-xs tabular-nums text-slate-500">{formatDateTime(s.startsAt)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      <span className="text-slate-400">S{s.order} · </span>
                      {s.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {s.programTitle} · {s.coachName}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Dernières inscriptions" description="Les 8 plus récentes" />
          {d.latestEnrollments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">Aucune inscription pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.latestEnrollments.map((e) => (
                <li key={e.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{e.studentName.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{e.studentName}</p>
                    <p className="truncate text-xs text-slate-500">
                      {e.programTitle} · promo du {formatShortDate(e.cohortStart)}
                    </p>
                  </div>
                  <div className="shrink-0 text-xs tabular-nums text-slate-400">{formatShortDate(e.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Besoin du détail d&apos;un programme ? Le <Link href="/programmes" className="underline">catalogue public</Link> reflète exactement ce que voient les étudiants.
      </p>
    </div>
  );
}
