// The summary at the top of This week: a verdict in words and up to three
// things to work on, judged on the 7-day averages. A low nutrient comes with
// one food to add; a high one names where most of it came from.

import { findFood, type Food } from "./foods.ts";
import { formatValue, NUTRIENT_KEYS, statusFor } from "./log.ts";
import { NUTRIENTS, type NutrientKey } from "./nutrients.ts";
import type { Entry } from "./storage.ts";
import { formatTarget, type Targets } from "./targets.ts";
import type { WindowSummary } from "./week.ts";

export const MAX_FOCUS = 3;

/** Everyday foods rich in each nutrient, best first (values in lib/foods-data.ts). */
const FIXES: Record<NutrientKey, string[]> = {
  calories: ["peanutButter", "almonds", "avocado"],
  protein: ["chickenBreast", "greekYogurt", "lentils"],
  carbs: ["brownRice", "oatmeal", "banana"],
  fat: ["avocado", "almonds", "peanutButter"],
  fiber: ["blackBeans", "lentils", "chickpeas"],
  sodium: [],
  potassium: ["potato", "sweetPotato", "banana"],
  calcium: ["greekYogurt", "milk", "cheddar"],
  iron: ["lentils", "spinach", "blackBeans"],
  vitaminA: ["sweetPotato", "carrots", "spinach"],
  vitaminC: ["redBellPepper", "orange", "strawberries"],
};

export interface Focus {
  key: NutrientKey;
  direction: "low" | "high";
  /** "Potassium is low" */
  title: string;
  /** "Averaging 2,420 mg · at least 3,400 mg" */
  detail: string;
  /** A food to add for a low nutrient. */
  fix?: Food;
  /** For a high nutrient: the food that gave the most of it. */
  topSource?: string;
}

export type Verdict = "waiting" | "balanced" | "mostly" | "work";

export interface Summary {
  verdict: Verdict;
  headline: string;
  focus: Focus[];
}

const HEADLINES: Record<Verdict, string> = {
  waiting: "Your summary starts once a day is complete.",
  balanced: "Balanced across the board.",
  mostly: "Mostly balanced.",
  work: "A few things to work on.",
};

/** How far off the average is, as a share of the target edge it missed. */
function distance(value: number, edge: number): number {
  return Math.abs(value - edge) / edge;
}

export function summarize(summary: WindowSummary, targets: Targets, entries: Entry[]): Summary {
  if (summary.counted === 0) return { verdict: "waiting", headline: HEADLINES.waiting, focus: [] };

  const off: (Focus & { distance: number })[] = [];
  let inRange = 0;
  const counted = new Set(summary.days.filter((day) => day.state === "complete").map((day) => day.date));

  for (const key of NUTRIENT_KEYS) {
    const value = summary.averages[key];
    if (value === undefined) continue;
    const target = targets[key];
    const status = statusFor(key, target, value);
    const { label, unit } = NUTRIENTS[key];
    const detail = `Averaging ${formatValue(value)} ${unit} · ${formatTarget(key, target)}`;
    if (status.kind === "in-range") {
      inRange++;
    } else if (status.kind === "to-go") {
      off.push({ key, direction: "low", title: `${label} is low`, detail, distance: distance(value, target.min!) });
    } else if (status.kind === "over") {
      const edge = target.max !== undefined && value > target.max ? target.max : target.upper!;
      off.push({ key, direction: "high", title: `${label} is high`, detail, distance: distance(value, edge) });
    }
  }

  off.sort((a, b) => b.distance - a.distance);
  const used = new Set<string>();
  const focus = off.slice(0, MAX_FOCUS).map(({ key, direction, title, detail }): Focus => {
    const item = { key, direction, title, detail };
    if (item.direction === "low") {
      // A different food for each item, so three fixes aren't the same thing.
      const id = FIXES[item.key].find((foodId) => !used.has(foodId)) ?? FIXES[item.key][0];
      if (id) used.add(id);
      return { ...item, fix: id ? findFood(id) : undefined };
    }
    return { ...item, topSource: topSource(entries, counted, item.key) };
  });

  const verdict: Verdict = off.length === 0 ? "balanced" : off.length <= 3 && inRange >= off.length * 2 ? "mostly" : "work";
  return { verdict, headline: HEADLINES[verdict], focus };
}

function topSource(entries: Entry[], dates: Set<string>, key: NutrientKey): string | undefined {
  const byFood = new Map<string, number>();
  for (const entry of entries) {
    const value = entry.nutrients[key];
    if (!dates.has(entry.date) || !value) continue;
    byFood.set(entry.name, (byFood.get(entry.name) ?? 0) + value);
  }
  return [...byFood].sort((a, b) => b[1] - a[1])[0]?.[0];
}
