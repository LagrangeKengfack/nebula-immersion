import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-sm font-medium text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Page introuvable</h1>
      <p className="mt-2 text-sm text-slate-600">Ce programme ou cette promotion n&apos;existe pas, ou n&apos;est plus disponible.</p>
      <Link href="/programmes" className="btn btn-primary mt-6">
        Voir les programmes
      </Link>
    </div>
  );
}
