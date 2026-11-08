"use client";
import { useActionState } from "react";
import { createCohort } from "@/app/actions/coach";
import { initialActionState } from "@/app/actions/types";
import { Field, FormMessage, Input, Select, SubmitButton } from "@/components/form";

export function CohortForm({ programId, maxCapacity, sessionCount, recommendedGroupSize }: { programId: string; maxCapacity: number; sessionCount: number; recommendedGroupSize: number }) {
  const [state, action] = useActionState(createCohort, initialActionState);
  const e = state.errors ?? {};
  const v = (k: string, d = "") => state.values?.[k] ?? d;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="programId" value={programId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date de début" name="startDate" error={e.startDate}>
          <Input type="date" name="startDate" defaultValue={v("startDate")} error={e.startDate} required />
        </Field>
        <Field label="Date de fin" name="endDate" error={e.endDate}>
          <Input type="date" name="endDate" defaultValue={v("endDate")} error={e.endDate} required />
        </Field>
        <Field label="Nombre maximal de participants" name="capacity" error={e.capacity} hint={`Entre 1 et ${maxCapacity} (plafond du programme).`}>
          <Input type="number" name="capacity" min={1} max={maxCapacity} defaultValue={v("capacity", String(Math.min(recommendedGroupSize * 2, maxCapacity)))} error={e.capacity} required />
        </Field>
        <Field label="Inscriptions" name="status" error={e.status}>
          <Select name="status" defaultValue={v("status", "OPEN")}>
            <option value="OPEN">Ouvertes</option>
            <option value="CLOSED">Fermées (pour l&apos;instant)</option>
          </Select>
        </Field>
      </div>
      <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
        Les {sessionCount} sessions seront créées automatiquement, réparties uniformément entre les deux dates. Vous pourrez ensuite ajuster leurs titres et horaires.
      </p>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Création…">Créer la promotion</SubmitButton>
    </form>
  );
}
