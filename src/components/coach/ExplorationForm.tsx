"use client";
import { useActionState } from "react";
import { createExploration } from "@/app/actions/coach";
import { initialActionState } from "@/app/actions/types";
import { Field, FormMessage, Input, Select, SubmitButton, Textarea } from "@/components/form";

type SessionOption = { id: string; label: string };

export function ExplorationForm({ programId, sessionOptions }: { programId: string; sessionOptions: SessionOption[] }) {
  const [state, action] = useActionState(createExploration, initialActionState);
  const e = state.errors ?? {};
  const v = (k: string, d = "") => (state.ok ? d : state.values?.[k] ?? d);
  return (
    <form action={action} className="space-y-4" key={state.ok ? "reset" : "edit"}>
      <input type="hidden" name="programId" value={programId} />
      <Field label="Titre" name="title" error={e.title}>
        <Input name="title" defaultValue={v("title")} error={e.title} placeholder="Ex. Lire un rapport annuel en 30 minutes" required />
      </Field>
      <Field label="Consigne" name="description" error={e.description}>
        <Textarea name="description" defaultValue={v("description")} error={e.description} rows={3} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rattachée à" name="sessionId" error={e.sessionId} hint="Au programme entier, ou à une session d'une promotion précise.">
          <Select name="sessionId" defaultValue={v("sessionId")}>
            <option value="">Tout le programme</option>
            {sessionOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date de remise (facultative)" name="dueDate" error={e.dueDate}>
          <Input type="date" name="dueDate" defaultValue={v("dueDate")} error={e.dueDate} />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton variant="secondary">Ajouter l&apos;exploration</SubmitButton>
    </form>
  );
}
