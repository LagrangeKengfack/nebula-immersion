import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { ProgramCard } from "@/components/student/ProgramCard";
import { DOMAIN_LABELS } from "@/lib/labels";
import { listPublishedPrograms } from "@/lib/queries/programs";
import { DOMAINS } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Programmes" };

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ q?: string; domain?: string }> }) {
  const { q = "", domain = "" } = await searchParams;
  const validDomain = (DOMAINS as readonly string[]).includes(domain) ? domain : undefined;
  const programs = await listPublishedPrograms({ q: q.trim() || undefined, domain: validDomain });
  const filtering = Boolean(q || validDomain);

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Programmes d'immersion professionnelle"
        description="Des études de cas réelles, en petit groupe, animées par des professionnels. Choisissez un programme, puis la promotion qui vous convient."
      />

      <form className="mb-6 flex flex-col gap-3 sm:flex-row" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Rechercher un titre, un coach, un mot-clé…" className="input sm:max-w-sm" aria-label="Rechercher" />
        <select name="domain" defaultValue={validDomain ?? ""} className="input sm:w-56" aria-label="Filtrer par domaine">
          <option value="">Tous les domaines</option>
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {DOMAIN_LABELS[d]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Filtrer
        </button>
        {filtering && (
          <Link href="/programmes" className="btn btn-secondary">
            Réinitialiser
          </Link>
        )}
      </form>

      {programs.length === 0 ? (
        <EmptyState
          title={filtering ? "Aucun programme ne correspond" : "Aucun programme publié"}
          description={filtering ? "Essayez un autre mot-clé ou retirez le filtre de domaine." : "Les coachs n'ont pas encore publié de programme. Revenez bientôt."}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {programs.length} programme{programs.length > 1 ? "s" : ""}
            {filtering ? " trouvé" + (programs.length > 1 ? "s" : "") : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => (
              <ProgramCard key={p.id} {...p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
