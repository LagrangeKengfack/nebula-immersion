import Link from "next/link";
import { Badge, Card, difficultyTone } from "@/components/ui";
import { DIFFICULTY_LABELS, DOMAIN_LABELS } from "@/lib/labels";

type Props = {
  id: string;
  title: string;
  description: string;
  domain: string;
  difficulty: string;
  sessionCount: number;
  coachName: string;
  openCohorts: number;
};

export function ProgramCard(p: Props) {
  return (
    <Link href={`/programmes/${p.id}`} className="group block h-full">
      <Card className="flex h-full flex-col p-5 transition group-hover:border-brand-500 group-hover:shadow-md">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{DOMAIN_LABELS[p.domain]}</Badge>
          <Badge tone={difficultyTone[p.difficulty]}>{DIFFICULTY_LABELS[p.difficulty]}</Badge>
        </div>
        <h3 className="text-base font-semibold leading-snug text-slate-900 group-hover:text-brand-700">{p.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{p.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            Par <span className="font-medium text-slate-700">{p.coachName}</span> · {p.sessionCount} sessions
          </span>
          <span className={p.openCohorts > 0 ? "font-medium text-emerald-700" : "text-slate-400"}>
            {p.openCohorts > 0 ? `${p.openCohorts} promotion${p.openCohorts > 1 ? "s" : ""} ouverte${p.openCohorts > 1 ? "s" : ""}` : "Aucune promotion ouverte"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
