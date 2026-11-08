"use client";
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/actions/types";

// ─── Champ avec libellé + erreur ────────────────────────────────────────────
export function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ error, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <input id={props.name} aria-invalid={!!error} aria-describedby={error ? `${props.name}-error` : undefined} className={`input ${error ? "input-error" : ""} ${className}`} {...props} />;
}

export function Textarea({ error, className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return <textarea id={props.name} aria-invalid={!!error} className={`input min-h-24 ${error ? "input-error" : ""} ${className}`} {...props} />;
}

export function Select({ error, className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <select id={props.name} aria-invalid={!!error} className={`input ${error ? "input-error" : ""} ${className}`} {...props}>
      {children}
    </select>
  );
}

// ─── Bouton de soumission avec état « en cours » ────────────────────────────
export function SubmitButton({ children, pendingLabel = "Enregistrement…", variant = "primary", className = "" }: { children: ReactNode; pendingLabel?: string; variant?: "primary" | "secondary" | "danger"; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`btn btn-${variant} ${className}`} aria-busy={pending}>
      {pending && <Spinner />}
      {pending ? pendingLabel : children}
    </button>
  );
}

export function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

// ─── Message de résultat d'action ───────────────────────────────────────────
export function FormMessage({ state }: { state: ActionState }) {
  const text = state.message ?? state.errors?._form;
  if (!text) return null;
  const ok = state.ok === true;
  return (
    <div role={ok ? "status" : "alert"} className={`rounded-lg px-4 py-3 text-sm ${ok ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "bg-red-50 text-red-800 ring-1 ring-red-100"}`}>
      {text}
    </div>
  );
}
