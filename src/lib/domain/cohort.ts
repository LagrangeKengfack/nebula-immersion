/**
 * Règles métier des cohortes — fonctions pures, sans accès base.
 * Testées unitairement dans tests/cohort.test.ts
 */

export type CohortWindow = { startDate: Date; endDate: Date };

export const COHORT_CAPACITY_MIN = 1;
export const COHORT_CAPACITY_MAX = 20;
export const SESSION_COUNT_MIN = 2;
export const SESSION_COUNT_MAX = 4;

/** La date de fin doit être strictement postérieure à la date de début. */
export function isValidWindow({ startDate, endDate }: CohortWindow): boolean {
  return endDate.getTime() > startDate.getTime();
}

/** La capacité d'une cohorte est bornée par 1 et par la capacité max du programme (elle-même ≤ 20). */
export function isValidCapacity(capacity: number, programMaxCapacity: number): boolean {
  const ceiling = Math.min(programMaxCapacity, COHORT_CAPACITY_MAX);
  return Number.isInteger(capacity) && capacity >= COHORT_CAPACITY_MIN && capacity <= ceiling;
}

/** Une date de session doit tomber dans la fenêtre de la cohorte (bornes incluses, à la journée). */
export function isSessionInWindow(sessionDate: Date, window: CohortWindow): boolean {
  const day = startOfDay(sessionDate).getTime();
  return day >= startOfDay(window.startDate).getTime() && day <= startOfDay(window.endDate).getTime();
}

/** Statut effectif affiché aux étudiants : « Complet » est calculé, jamais stocké. */
export type EffectiveCohortStatus = "OPEN" | "FULL" | "CLOSED";

export function effectiveStatus(
  storedStatus: "OPEN" | "CLOSED",
  enrolledCount: number,
  capacity: number,
): EffectiveCohortStatus {
  if (storedStatus === "CLOSED") return "CLOSED";
  return enrolledCount >= capacity ? "FULL" : "OPEN";
}

export function canEnroll(status: EffectiveCohortStatus, alreadyEnrolled: boolean): { ok: true } | { ok: false; reason: string } {
  if (alreadyEnrolled) return { ok: false, reason: "Vous êtes déjà inscrit à cette promotion." };
  if (status === "FULL") return { ok: false, reason: "Cette promotion est complète." };
  if (status === "CLOSED") return { ok: false, reason: "Les inscriptions à cette promotion sont fermées." };
  return { ok: true };
}

/**
 * Bonus du sujet : propose des dates de sessions réparties uniformément sur la durée de la cohorte.
 * - Fenêtre assez longue (au moins autant de jours que de sessions) : une session par jour,
 *   première le jour de début, dernière le jour de fin, les autres équidistantes, à 18h00.
 * - Fenêtre courte (moins de jours que de sessions) : plusieurs sessions le même jour,
 *   sur des créneaux distincts (9h, 11h, 14h, 16h) pour qu'aucune ne chevauche une autre.
 * Le coach ajuste ensuite titres et horaires.
 */
export const SAME_DAY_SLOTS_HOURS = [9, 11, 14, 16];

export function suggestSessionDates(window: CohortWindow, sessionCount: number, hour = 18): Date[] {
  if (!isValidWindow(window) || sessionCount < 1) return [];
  const start = startOfDay(window.startDate).getTime();
  const end = startOfDay(window.endDate).getTime();
  if (sessionCount === 1) return [withHour(new Date(start), hour)];
  const DAY = 86_400_000;
  const totalDays = Math.round((end - start) / DAY);
  const dayCount = totalDays + 1;

  if (sessionCount > dayCount) {
    // Fenêtre courte : on répartit les sessions sur les jours disponibles, puis sur des créneaux horaires distincts
    const perDay = new Map<number, number>();
    return Array.from({ length: sessionCount }, (_, i) => {
      const dayIndex = Math.floor((i * dayCount) / sessionCount);
      const slot = perDay.get(dayIndex) ?? 0;
      perDay.set(dayIndex, slot + 1);
      const d = new Date(start);
      d.setDate(d.getDate() + dayIndex);
      return withHour(d, SAME_DAY_SLOTS_HOURS[slot] ?? SAME_DAY_SLOTS_HOURS.at(-1)!);
    });
  }

  const stepDays = totalDays / (sessionCount - 1);
  return Array.from({ length: sessionCount }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + Math.round(stepDays * i)); // arrondi au jour entier
    return withHour(d, hour);
  });
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function withHour(d: Date, hour: number): Date {
  const c = new Date(d);
  c.setHours(hour, 0, 0, 0);
  return c;
}
