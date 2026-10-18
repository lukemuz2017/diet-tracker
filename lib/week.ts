// The rolling 7-day window (flows.md: How the 7-day window works). Pure
// functions, checked by lib/week.test.ts.

import { addDays } from "./dates.ts";
import { NUTRIENT_KEYS, statusFor, totalsFor } from "./log.ts";
import type { NutrientKey, Nutrients } from "./nutrients.ts";
import type { Entry } from "./storage.ts";
import type { Targets } from "./targets.ts";

export const WINDOW_DAYS = 7;
/** A logged day under this share of maintenance calories looks half-logged. */
export const INCOMPLETE_SHARE = 0.4;

export type DayState = "complete" | "incomplete" | "missed" | "in-progress";

export interface WindowDay {
  date: string;
  state: DayState;
  totals: Nutrients;
  foods: number;
}

export interface WindowSummary {
  start: string;
  end: string;
  days: WindowDay[];
  /** Days that count toward the averages. */
  counted: number;
  logged: number;
  averages: Nutrients;
  /** Per nutrient: counted days with a value, and how many were in range. */
  coverage: Record<NutrientKey, { days: number; inRange: number }>;
}

/** The 7 dates ending on `end`, oldest first. */
export function windowDates(end: string): string[] {
  return Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(end, i - (WINDOW_DAYS - 1)));
}

function dayState(date: string, foods: number, calories: number, markedComplete: boolean, today: string, maintenance: number): DayState {
  if (foods === 0) return date === today ? "in-progress" : "missed";
  if (markedComplete) return "complete";
  if (date >= today) return "in-progress";
  return calories < maintenance * INCOMPLETE_SHARE ? "incomplete" : "complete";
}

export function summarizeWindow(
  data: { entries: Entry[]; completeDays: string[] },
  end: string,
  today: string,
  maintenance: number,
  targets: Targets,
): WindowSummary {
  const dates = windowDates(end);
  const days: WindowDay[] = dates.map((date) => {
    const { totals, foods } = totalsFor(data.entries.filter((entry) => entry.date === date));
    const state = dayState(date, foods, totals.calories ?? 0, data.completeDays.includes(date), today, maintenance);
    return { date, state, totals, foods };
  });

  const counted = days.filter((day) => day.state === "complete");
  const averages: Nutrients = {};
  const coverage = {} as WindowSummary["coverage"];
  for (const key of NUTRIENT_KEYS) {
    const withValue = counted.filter((day) => day.totals[key] !== undefined);
    const inRange = withValue.filter((day) => statusFor(key, targets[key], day.totals[key]).kind === "in-range").length;
    coverage[key] = { days: withValue.length, inRange };
    if (withValue.length > 0) {
      averages[key] = withValue.reduce((sum, day) => sum + day.totals[key]!, 0) / withValue.length;
    }
  }

  return {
    start: dates[0],
    end,
    days,
    counted: counted.length,
    logged: days.filter((day) => day.foods > 0).length,
    averages,
    coverage,
  };
}
