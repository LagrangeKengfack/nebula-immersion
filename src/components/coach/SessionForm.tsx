"use client";
import { useActionState } from "react";
import { updateSession } from "@/app/actions/coach";
import { initialActionState } from "@/app/actions/types";
import { Field, FormMessage, Input, SubmitButton, Textarea } from "@/components/form";
import type { Session } from "@/db/schema";
import { toDateInput, toDateTimeInput } from "@/lib/format";

export function SessionForm({ session, windowStart, windowEnd }: { session: Session; windowStart: Date; windowEnd: Date }) {
  const [state, action] = useActionState(updateSession, initialActionState);
  const e = state.errors ?? {};
  const v = (k: string, d: string) => state.values?.[k] ?? d;
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-6">
      <input type="hidden" name="sessionId" value={session.id} />
      <div className="sm:col-span-3">
        <Field label={`Session ${session.order} · titre`} name={`title-${session.id}`} error={e.title}>
          <Input name="title" id={`title-${session.id}`} defaultValue={v("title", session.title)} error={e.title} required />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Date et heure" name={`startsAt-${session.id}`} error={e.startsAt} hint={`Entre le ${toDateInput(windowStart)} et le ${toDateInput(windowEnd)}`}>
          <Input type="datetime-local" name="startsAt" id={`startsAt-${session.id}`} defaultValue={v("startsAt", toDateTimeInput(session.startsAt))} min={`${toDateInput(windowStart)}T00:00`} max={`${toDateInput(windowEnd)}T23:59`} error={e.startsAt} required />
        </Field>
      </div>
      <div className="sm:col-span-1">
        <Field label="Durée (min)" name={`durationMinutes-${session.id}`} error={e.durationMinutes}>
          <Input type="number" name="durationMinutes" id={`durationMinutes-${session.id}`} min={15} max={240} step={5} defaultValue={v("durationMinutes", String(session.durationMinutes))} error={e.durationMinutes} />
        </Field>
      </div>
      <div className="sm:col-span-6">
        <Field label="Description" name={`description-${session.id}`} error={e.description}>
          <Textarea name="description" id={`description-${session.id}`} defaultValue={v("description", session.description)} rows={2} className="!min-h-0" placeholder="Ce qui sera travaillé pendant la session" />
        </Field>
      </div>
      <div className="flex items-center gap-3 sm:col-span-6">
        <SubmitButton variant="secondary" className="btn-sm">
          Enregistrer la session {session.order}
        </SubmitButton>
        <div className="flex-1">
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
