"use client";
import { useActionState } from "react";
import { createProgram, updateProgram } from "@/app/actions/coach";
import { initialActionState } from "@/app/actions/types";
import { Field, FormMessage, Input, Select, SubmitButton, Textarea } from "@/components/form";
import type { Program } from "@/db/schema";
import { AUDIENCE_LABELS, DIFFICULTY_LABELS, DOMAIN_LABELS, PROGRAM_STATUS_LABELS } from "@/lib/labels";
import { AUDIENCES, DIFFICULTIES, DOMAINS, PROGRAM_STATUSES } from "@/lib/validation/schemas";

export function ProgramForm({ program }: { program?: Program }) {
  const [state, action] = useActionState(program ? updateProgram : createProgram, initialActionState);
  const v = (key: string, fallback: string | number | string[] | undefined = "") => {
    const fromState = state.values?.[key];
    if (fromState !== undefined) return fromState;
    return Array.isArray(fallback) ? fallback.join("\n") : String(fallback ?? "");
  };
  const e = state.errors ?? {};
  const hasCohorts = Boolean(program && (program as Program & { cohortCount?: number }).cohortCount);

  return (
    <form action={action} className="space-y-6">
      {program && <input type="hidden" name="programId" value={program.id} />}

      <section className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Titre du programme" name="title" error={e.title}>
            <Input name="title" defaultValue={v("title", program?.title)} error={e.title} placeholder="Ex. Immersion analyste en banque d'investissement" required maxLength={120} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Description" name="description" error={e.description} hint="Ce que les étudiants vont vivre concrètement. 20 caractères minimum.">
            <Textarea name="description" defaultValue={v("description", program?.description)} error={e.description} rows={5} required />
          </Field>
        </div>
        <Field label="Domaine" name="domain" error={e.domain}>
          <Select name="domain" defaultValue={v("domain", program?.domain)} error={e.domain} required>
            <option value="">Choisir…</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {DOMAIN_LABELS[d]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Public cible" name="audience" error={e.audience}>
          <Select name="audience" defaultValue={v("audience", program?.audience)} error={e.audience} required>
            <option value="">Choisir…</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABELS[a]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Niveau de difficulté" name="difficulty" error={e.difficulty}>
          <Select name="difficulty" defaultValue={v("difficulty", program?.difficulty)} error={e.difficulty} required>
            <option value="">Choisir…</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Statut" name="status" error={e.status} hint="Seuls les programmes publiés sont visibles des étudiants.">
          <Select name="status" defaultValue={v("status", program?.status ?? "DRAFT")} error={e.status}>
            {PROGRAM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROGRAM_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Format</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Nombre de sessions" name="sessionCount" error={e.sessionCount} hint={hasCohorts ? "Figé : des promotions existent." : "Entre 2 et 4, 45 min chacune."}>
            <Input type="number" name="sessionCount" min={2} max={4} defaultValue={v("sessionCount", program?.sessionCount ?? 3)} error={e.sessionCount} required readOnly={hasCohorts} />
          </Field>
          <Field label="Taille de groupe recommandée" name="recommendedGroupSize" error={e.recommendedGroupSize} hint="Par défaut 3.">
            <Input type="number" name="recommendedGroupSize" min={1} max={20} defaultValue={v("recommendedGroupSize", program?.recommendedGroupSize ?? 3)} error={e.recommendedGroupSize} required />
          </Field>
          <Field label="Taille maximale d'une promotion" name="maxCapacity" error={e.maxCapacity} hint="Entre 1 et 20. Plafond des cohortes.">
            <Input type="number" name="maxCapacity" min={1} max={20} defaultValue={v("maxCapacity", program?.maxCapacity ?? 12)} error={e.maxCapacity} required />
          </Field>
        </div>
      </section>

      <Field label="Objectifs pédagogiques" name="learningObjectives" error={e.learningObjectives} hint="Un objectif par ligne. Ex. « Apprendre à structurer une analyse du risque de crédit »">
        <Textarea name="learningObjectives" defaultValue={v("learningObjectives", program?.learningObjectives)} error={e.learningObjectives} rows={4} required />
      </Field>

      <FormMessage state={state} />

      <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
        <SubmitButton>{program ? "Enregistrer les modifications" : "Créer le programme"}</SubmitButton>
        {!program && <p className="text-xs text-slate-500">Vous pourrez ensuite ajouter des promotions et des explorations.</p>}
      </div>
    </form>
  );
}
