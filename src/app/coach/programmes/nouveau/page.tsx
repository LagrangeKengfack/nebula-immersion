import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { ProgramForm } from "@/components/coach/ProgramForm";

export const metadata: Metadata = { title: "Nouveau programme" };

export default function NewProgramPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/coach/programmes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        ← Mes programmes
      </Link>
      <PageHeader eyebrow="Espace coach" title="Nouveau programme d'immersion" description="Commencez en brouillon, publiez quand la description vous convient. Les promotions viennent ensuite." />
      <Card className="p-6">
        <ProgramForm />
      </Card>
    </div>
  );
}
