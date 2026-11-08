"use client";
import { useActionState } from "react";
import { enroll } from "@/app/actions/enrollment";
import { initialActionState } from "@/app/actions/types";
import { FormMessage, SubmitButton } from "@/components/form";

export function EnrollButton({ cohortId, disabled, disabledLabel }: { cohortId: string; disabled?: boolean; disabledLabel?: string }) {
  const [state, action] = useActionState(enroll, initialActionState);
  if (state.ok) return <FormMessage state={state} />;
  if (disabled) {
    return (
      <button type="button" disabled className="btn btn-secondary w-full sm:w-auto">
        {disabledLabel ?? "Indisponible"}
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="cohortId" value={cohortId} />
      <SubmitButton pendingLabel="Inscription…" className="w-full sm:w-auto">
        S&apos;inscrire
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
