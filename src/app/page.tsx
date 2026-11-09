import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { ProgramCard } from "@/components/student/ProgramCard";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatDateTime, formatShortDate } from "@/lib/format";
import { DOMAIN_LABELS } from "@/lib/labels";
import { getLandingData } from "@/lib/queries/programs";

export const metadata: Metadata = {
  title: { absolute: "Nebula · Programmes d'immersion professionnelle" },
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;

export default async function Home() {
  const [user, data] = await Promise.all([getCurrentUser(), getLandingData()]);
  const role = user?.role ?? "GUEST";

  const primary =
    role === "COACH"
      ? { href: "/coach/programmes", label: "Accéder à mon espace coach" }
      : role === "ADMIN"
        ? { href: "/admin", label: "Ouvrir le tableau de bord" }
        : { href: "/programmes", label: "Découvrir les programmes" };
  const secondary =
    role === "STUDENT"
      ? { href: "/mes-programmes", label: "Mes programmes" }
      : role === "GUEST"
        ? { href: "#comment-ca-marche", label: "Comment ça marche" }
        : { href: "/programmes", label: "Voir le catalogue public" };

  const { stats, featured, domains, coaches, nextCohort } = data;

  return (
    <div className="space-y-20 pb-8">
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 text-white sm:px-10 lg:py-24">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),_transparent_60%)]" />
        </div>

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              {plural(stats.openCohorts, "promotion ouverte", "promotions ouvertes")} en ce moment
            </div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Programmes d&apos;immersion professionnelle
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Vivez un métier de l&apos;intérieur avant de le choisir. Des études de cas réelles, en petit groupe, animées par des
              professionnels qui l&apos;exercent chaque jour.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={primary.href} className="btn bg-white px-5 py-2.5 text-slate-900 shadow-lg shadow-black/20 hover:bg-indigo-50 focus:ring-white">
                {primary.label}
                <ArrowIcon />
              </Link>
              <Link href={secondary.href} className="btn border border-white/20 bg-white/5 px-5 py-2.5 text-white hover:bg-white/10 focus:ring-white/60">
                {secondary.label}
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <HeroStat value={stats.publishedPrograms} label="programmes" />
              <HeroStat value={stats.coaches} label="coachs en activité" />
              <HeroStat value="2 à 4" label="sessions par programme" />
            </dl>
          </div>

          {nextCohort && (
            <Link href={`/programmes/${nextCohort.programId}`} className="group block">
              <div className="rounded-2xl border border-white/10 bg-white/95 p-1 text-slate-900 shadow-2xl shadow-black/30 backdrop-blur transition group-hover:-translate-y-0.5">
                <div className="rounded-xl bg-white p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-brand-600">
                    Prochaine promotion
                    <Badge tone="success">{plural(nextCohort.capacity - nextCohort.enrolledCount, "place restante", "places restantes")}</Badge>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge tone="brand">{DOMAIN_LABELS[nextCohort.domain]}</Badge>
                  </div>
                  <h2 className="text-xl font-semibold leading-snug group-hover:text-brand-700">{nextCohort.programTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Animé par <span className="font-medium text-slate-700">{nextCohort.coachName}</span>
                  </p>
                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Du</dt>
                      <dd className="font-medium">{formatShortDate(nextCohort.startDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Au</dt>
                      <dd className="font-medium">{formatDate(nextCohort.endDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Sessions</dt>
                      <dd className="font-medium">{nextCohort.sessionCount} × 45 min</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Première session</dt>
                      <dd className="font-medium">{nextCohort.firstSessionAt ? formatDateTime(nextCohort.firstSessionAt) : "à planifier"}</dd>
                    </div>
                  </dl>
                  <div className="mt-5">
                    <CapacityBar taken={nextCohort.enrolledCount} capacity={nextCohort.capacity} />
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ─── Comment ça marche ────────────────────────────────────────── */}
      <section id="comment-ca-marche" className="scroll-mt-24">
        <SectionHeader
          eyebrow="Comment ça marche"
          title="Trois étapes, un métier découvert de l'intérieur"
          description="Pas de cours magistral. Vous travaillez sur un cas réel, en petit groupe, avec quelqu'un qui fait ce métier."
        />
        <ol className="grid gap-5 md:grid-cols-3">
          <Step
            n={1}
            title="Choisissez un programme"
            text="Filtrez le catalogue par domaine ou par coach. Chaque programme annonce son public, son niveau et ses objectifs d'apprentissage."
            icon={<CompassIcon />}
          />
          <Step
            n={2}
            title="Rejoignez une promotion"
            text="Une promotion, c'est un petit groupe et des dates fixes. Les places sont limitées et affichées en temps réel : une inscription, une place."
            icon={<UsersIcon />}
          />
          <Step
            n={3}
            title="Vivez les sessions"
            text="Deux à quatre sessions de 45 minutes, avec des explorations à préparer entre chacune. Tout est dans « Mes programmes »."
            icon={<SparkIcon />}
          />
        </ol>
      </section>

      {/* ─── À la une ─────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section>
          <SectionHeader
            eyebrow="À la une"
            title="Des programmes ouverts aux inscriptions"
            description="Les promotions ouvertes en priorité, puis les derniers programmes publiés."
            action={
              <Link href="/programmes" className="btn btn-secondary">
                Tout le catalogue
                <ArrowIcon />
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProgramCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Domaines ─────────────────────────────────────────────────── */}
      {domains.length > 0 && (
        <section>
          <SectionHeader eyebrow="Domaines" title="Par où voulez-vous commencer ?" />
          <div className="flex flex-wrap gap-3">
            {domains.map((d) => (
              <Link
                key={d.domain}
                href={`/programmes?domain=${d.domain}`}
                className="group inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white py-2 pl-4 pr-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-500 hover:text-brand-700"
              >
                {DOMAIN_LABELS[d.domain]}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs tabular-nums text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700">
                  {d.n}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Coachs ───────────────────────────────────────────────────── */}
      {coaches.length > 0 && (
        <section>
          <SectionHeader
            eyebrow="Les coachs"
            title="Des professionnels en poste, pas des formateurs"
            description="Chaque programme est conçu et animé par la personne qui exerce le métier. Vous posez vos questions à quelqu'un qui y répond tous les jours."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((c) => (
              <Card key={c.id} className="flex items-start gap-4 p-5">
                <Avatar name={c.name} />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  {c.headline && <div className="mt-0.5 text-sm text-slate-600">{c.headline}</div>}
                  <div className="mt-2 text-xs text-slate-500">{plural(c.programCount, "programme publié", "programmes publiés")}</div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ─── Pour les coachs ──────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="grid gap-10 p-8 sm:p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-600">Vous exercez un métier ?</div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Transmettez-le en quelques sessions</h2>
            <p className="mt-3 text-slate-600">
              Un programme s&apos;écrit une fois. Vous l&apos;ouvrez ensuite à autant de promotions que vous voulez, et chaque promotion
              naît avec son calendrier déjà réparti.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {role === "COACH" ? (
                <Link href="/coach/programmes/nouveau" className="btn btn-primary">
                  Créer un programme
                  <ArrowIcon />
                </Link>
              ) : (
                <Link href="/coach/programmes" className="btn btn-primary">
                  Voir l&apos;espace coach
                  <ArrowIcon />
                </Link>
              )}
              {role === "GUEST" && (
                <span className="self-center text-xs text-slate-500">Démo : choisissez un coach dans « Connecté en tant que »</span>
              )}
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            <Feature title="Petits groupes" text="Vous fixez la capacité, nous bloquons la dernière place pour qu'aucune promotion ne déborde." />
            <Feature title="Calendrier automatique" text="Les sessions sont réparties sur la durée de la promotion. Vous ajustez titres et horaires." />
            <Feature title="Explorations" text="Confiez un travail à préparer avant une session, ou pour le programme entier." />
            <Feature title="Garde-fous" text="Publication avant ouverture, dates cohérentes, capacité bornée : les erreurs de saisie sont bloquées." />
          </ul>
        </div>
      </section>

      {/* ─── Appel final ──────────────────────────────────────────────── */}
      <section className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Prêt à découvrir un métier de l&apos;intérieur ?</h2>
        <p className="mx-auto mt-3 max-w-lg text-slate-600">
          {plural(stats.enrollments, "inscription", "inscriptions")} déjà enregistrées sur la plateforme. Les prochaines promotions démarrent bientôt.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={primary.href} className="btn btn-primary px-5 py-2.5">
            {primary.label}
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}

// ─── Sous-composants locaux ──────────────────────────────────────────────────

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-600">{eyebrow}</div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function HeroStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="order-first text-2xl font-semibold tabular-nums tracking-tight text-white">{value}</dd>
    </div>
  );
}

function CapacityBar({ taken, capacity }: { taken: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((taken / capacity) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-slate-500">
        <span>
          {taken} / {capacity} inscrits
        </span>
        <span>{pct} %</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Step({ n, title, text, icon }: { n: number; title: string; text: string; icon: React.ReactNode }) {
  return (
    <li className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
        <span className="text-xs font-medium tabular-nums text-slate-400">0{n}</span>
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
    </li>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <li className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <CheckIcon />
        {title}
      </div>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </li>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white" aria-hidden>
      {initials}
    </span>
  );
}

// ─── Icônes (inline, sans dépendance) ────────────────────────────────────────
const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

function ArrowIcon() {
  return (
    <svg {...iconProps} width={16} height={16}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg {...iconProps} width={16} height={16} className="text-brand-600">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg {...iconProps}>
      <path d="m12 3 1.9 5.8L19.7 10.7l-5.8 1.9L12 18.4l-1.9-5.8L4.3 10.7l5.8-1.9z" />
    </svg>
  );
}
