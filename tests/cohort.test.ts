import { describe, it } from "node:test";
import assert from "node:assert/strict";
const expect = (v: unknown) => ({
  toBe: (e: unknown) => assert.equal(v, e),
  toEqual: (e: unknown) => assert.deepEqual(v, e),
});
import {
  canEnroll,
  effectiveStatus,
  isSessionInWindow,
  isValidCapacity,
  isValidWindow,
  suggestSessionDates,
} from "../src/lib/domain/cohort.ts";

const d = (s: string) => new Date(s);
const window = { startDate: d("2026-07-01"), endDate: d("2026-07-15") };

describe("fenêtre de cohorte", () => {
  it("accepte fin > début", () => expect(isValidWindow(window)).toBe(true));
  it("refuse fin == début", () => expect(isValidWindow({ startDate: d("2026-07-01"), endDate: d("2026-07-01") })).toBe(false));
  it("refuse fin < début", () => expect(isValidWindow({ startDate: d("2026-07-15"), endDate: d("2026-07-01") })).toBe(false));
});

describe("capacité de cohorte", () => {
  it("accepte 1..maxProgramme", () => {
    expect(isValidCapacity(1, 12)).toBe(true);
    expect(isValidCapacity(12, 12)).toBe(true);
  });
  it("refuse 0, > max programme, > 20, non entier", () => {
    expect(isValidCapacity(0, 12)).toBe(false);
    expect(isValidCapacity(13, 12)).toBe(false);
    expect(isValidCapacity(21, 50)).toBe(false);
    expect(isValidCapacity(3.5, 12)).toBe(false);
  });
});

describe("date de session dans la fenêtre", () => {
  it("accepte les bornes incluses", () => {
    expect(isSessionInWindow(d("2026-07-01T18:00"), window)).toBe(true);
    expect(isSessionInWindow(d("2026-07-15T23:00"), window)).toBe(true);
  });
  it("refuse hors fenêtre", () => {
    expect(isSessionInWindow(d("2026-06-30T23:59"), window)).toBe(false);
    expect(isSessionInWindow(d("2026-07-16T00:00"), window)).toBe(false);
  });
});

describe("statut effectif", () => {
  it("OPEN tant qu'il reste des places", () => expect(effectiveStatus("OPEN", 2, 3)).toBe("OPEN"));
  it("FULL dès que capacité atteinte", () => expect(effectiveStatus("OPEN", 3, 3)).toBe("FULL"));
  it("CLOSED prime sur tout", () => expect(effectiveStatus("CLOSED", 0, 3)).toBe("CLOSED"));
});

describe("inscription", () => {
  it("autorisée si OPEN et pas déjà inscrit", () => expect(canEnroll("OPEN", false)).toEqual({ ok: true }));
  it("refusée si déjà inscrit", () => expect(canEnroll("OPEN", true).ok).toBe(false));
  it("refusée si complète", () => expect(canEnroll("FULL", false).ok).toBe(false));
  it("refusée si fermée", () => expect(canEnroll("CLOSED", false).ok).toBe(false));
});

describe("planning automatique (bonus)", () => {
  it("répartit 4 sessions sur 14 jours : J0, J5, J9, J14", () => {
    const dates = suggestSessionDates(window, 4);
    expect(dates.map((x) => x.getDate())).toEqual([1, 6, 10, 15]);
  });
  it("2 sessions = début et fin", () => {
    const dates = suggestSessionDates(window, 2);
    expect(dates.map((x) => x.getDate())).toEqual([1, 15]);
  });
  it("toutes les dates proposées sont dans la fenêtre", () => {
    for (const n of [2, 3, 4]) {
      for (const dt of suggestSessionDates(window, n)) expect(isSessionInWindow(dt, window)).toBe(true);
    }
  });
  it("fenêtre invalide → aucune proposition", () => {
    expect(suggestSessionDates({ startDate: d("2026-07-15"), endDate: d("2026-07-01") }, 3)).toEqual([]);
  });
});
