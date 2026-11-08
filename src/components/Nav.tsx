import Link from "next/link";
import type { User } from "@/db/schema";
import { ROLE_LABELS } from "@/lib/labels";
import { RoleSwitcher } from "./RoleSwitcher";

const linksByRole: Record<string, { href: string; label: string }[]> = {
  STUDENT: [
    { href: "/programmes", label: "Programmes" },
    { href: "/mes-programmes", label: "Mes programmes" },
  ],
  COACH: [
    { href: "/coach/programmes", label: "Mes programmes" },
    { href: "/programmes", label: "Catalogue public" },
  ],
  ADMIN: [
    { href: "/admin", label: "Tableau de bord" },
    { href: "/programmes", label: "Catalogue public" },
  ],
  GUEST: [{ href: "/programmes", label: "Programmes" }],
};

export function Nav({ user }: { user: User | null }) {
  const links = linksByRole[user?.role ?? "GUEST"];
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">N</span>
          Nebula
          <span className="hidden text-sm font-normal text-slate-400 sm:inline">· Immersion professionnelle</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user && (
            <span className="hidden text-xs text-slate-500 md:inline">
              <span className="font-medium text-slate-700">{user.name}</span> · {ROLE_LABELS[user.role]}
            </span>
          )}
          <RoleSwitcher currentUserId={user?.id} />
        </div>
      </div>
    </header>
  );
}
