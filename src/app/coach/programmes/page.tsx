import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, programStatusTone } from "@/components/ui";
import { getCurrentCoach } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { DOMAIN_LABELS, PROGRAM_STATUS_LABELS } from "@/lib/labels";
import { listCoachPrograms } from "@/lib/queries/programs";

export const metadata: Metadata = { title: "Mes programmes (coach)" };

export default async function CoachProgramsPage() {
  const coach = await getCurrentCoach();
  if (!coach) return null;
  const programs = await listCoachPrograms(coach.id);

  return (
    <div>
      <PageHeader
        eyebrow="Espace coach"
        title="Mes programmes"
        description="Créez vos programmes d'immersion, ouvrez des promotions et planifiez les sessions."
        action={
          <Link href="/coach/programmes/nouveau" className="btn btn-primary">
            + Nouveau programme
          </Link>
        }
      />

      {programs.length === 0 ? (
        <EmptyState
          title="Vous n'avez pas encore de programme"
          description="Un programme décrit l'expérience : titre, domaine, objectifs, nombre de sessions. Vous ouvrirez ensuite des promotions avec des dates."
          action={
            <Link href="/coach/programmes/nouveau" className="btn btn-primary">
              Créer mon premier programme
            </Link>
          }
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Programme</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Domaine</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="hidden px-5 py-3 text-right font-medium md:table-cell">Promotions</th>
                <th className="hidden px-5 py-3 text-right font-medium md:table-cell">Inscrits</th>
                <th className="hidden px-5 py-3 text-right font-medium lg:table-cell">Modifié</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {programs.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/coach/programmes/${p.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                      {p.title}
                    </Link>
                    <div className="text-xs text-slate-500">{p.sessionCount} sessions</div>
                  </td>
                  <td className="hidden px-5 py-3 text-slate-600 sm:table-cell">{DOMAIN_LABELS[p.domain]}</td>
                  <td className="px-5 py-3">
                    <Badge tone={programStatusTone[p.status]}>{PROGRAM_STATUS_LABELS[p.status]}</Badge>
                  </td>
                  <td className="hidden px-5 py-3 text-right tabular-nums text-slate-700 md:table-cell">{p.cohortCount}</td>
                  <td className="hidden px-5 py-3 text-right tabular-nums text-slate-700 md:table-cell">{p.enrollmentCount}</td>
                  <td className="hidden px-5 py-3 text-right text-xs text-slate-500 lg:table-cell">{formatShortDate(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
