"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-slate-600">Nous n&apos;avons pas pu charger cette page. Réessayez dans un instant.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Réf. {error.digest}</p>}
      <button onClick={reset} className="btn btn-primary mt-6">
        Réessayer
      </button>
    </div>
  );
}
