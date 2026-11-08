import type { FieldErrors } from "@/lib/validation/schemas";

/** Résultat standard d'une server action pilotant un formulaire (useActionState). */
export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string | undefined>;
};

export const initialActionState: ActionState = {};
