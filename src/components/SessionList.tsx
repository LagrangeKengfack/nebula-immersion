import type { Session } from "@/db/schema";
import { formatDateTime } from "@/lib/format";

export function SessionList({ sessions, compact = false, highlightId, now }: { sessions: Session[]; compact?: boolean; highlightId?: string | null; now: Date }) {
  if (sessions.length === 0) return <p className="text-sm text-slate-500">Aucune session planifiée pour l&apos;instant.</p>;
  return (
    <ol className="divide-y divide-slate-100">
      {sessions.map((s) => {
        const past = s.startsAt.getTime() < now.getTime();
        const highlight = s.id === highlightId;
        return (
          <li key={s.id} className={`flex items-start gap-3 py-2.5 ${compact ? "" : "sm:py-3"} ${past ? "opacity-60" : ""}`}>
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${highlight ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>{s.order}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium text-slate-900">{s.title}</p>
                <p className="text-xs tabular-nums text-slate-500">
                  {formatDateTime(s.startsAt)} · {s.durationMinutes} min
                </p>
              </div>
              {!compact && s.description && <p className="mt-0.5 text-sm text-slate-600">{s.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
