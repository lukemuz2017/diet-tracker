// The summary at the top of This week: a verdict in words and up to three
// things to work on, judged on the 7-day averages. Each comes with a gentle
// suggestion at the food-group level, not a specific food to add.

import { formatValue, NUTRIENT_KEYS, statusFor } from "./log.ts";
import { NUTRIENTS, type NutrientKey } from "./nutrients.ts";
import type { Entry } from "./storage.ts";
import { formatTarget, type Targets } from "./targets.ts";
import type { WindowSummary } from "./week.ts";

export const MAX_FOCUS = 3;

/**
 * What to try when a nutrient's average is low: food groups, with everyday
 * examples. Foods are wrapped in ** so the page can show them in bold.
 */
const LOW_TIPS: Record<NutrientKey, string> = {
  calories: "Consider slightly bigger portions or an extra snack, like **nuts** or **yogurt**, this week.",
  protein: "Consider adding protein foods, like **beans**, **eggs**, **fish** or **chicken**, this week.",
  carbs: "Consider adding some grains, like **rice**, **oats** or **whole-wheat bread**, this week.",
  fat: "Consider adding healthy fats, like **nuts**, **avocado** or **olive oil**, this week.",
  fiber: "Consider adding **beans**, **lentils** or **whole grains** this week.",
  sodium: "",
  potassium: "Consider adding **potatoes**, **beans** or **bananas** this week.",
  calcium: "Consider adding dairy, like **yogurt**, **milk** or **cheese**, this week.",
  iron: "Consider adding **beans**, **lentils** or **leafy greens** this week.",
  vitaminA: "Consider adding orange vegetables or leafy greens, like **sweet potatoes**, **carrots** or **spinach**, this week.",
  vitaminC: "Consider adding fruit or peppers, like **oranges**, **strawberries** or **bell peppers**, this week.",
};

export interface Focus {
  key: NutrientKey;
  direction: "low" | "high";
  /** "Potassium is low" */
  title: string;
  /** "Averaging 2,420 mg · at least 3,400 mg" */
  detail: string;
  /** A gentle suggestion, in words; foods are wrapped in **. */
  tip: string;
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

/** "Carbs are low", "Fiber is low" */
function verb(label: string): string {
  return label.endsWith("s") ? "are" : "is";
}

/** How far off the average is, as a share of the target edge it missed. */
function distance(value: number, edge: number): number {
  return Math.abs(value - edge) / edge;
}

export function summarize(summary: WindowSummary, targets: Targets, entries: Entry[]): Summary {
  if (summary.counted === 0) return { verdict: "waiting", headline: HEADLINES.waiting, focus: [] };

  const off: (Omit<Focus, "tip"> & { distance: number })[] = [];
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
      off.push({ key, direction: "low", title: `${label} ${verb(label)} low`, detail, distance: distance(value, target.min!) });
    } else if (status.kind === "over") {
      const edge = target.max !== undefined && value > target.max ? target.max : target.upper!;
      off.push({ key, direction: "high", title: `${label} ${verb(label)} high`, detail, distance: distance(value, edge) });
    }
  }

  off.sort((a, b) => b.distance - a.distance);
  const focus = off.slice(0, MAX_FOCUS).map(({ key, direction, title, detail }): Focus => {
    if (direction === "low") return { key, direction, title, detail, tip: LOW_TIPS[key] };
    const source = topSource(entries, counted, key);
    const tip = source
      ? `Mostly from **${source.split(",")[0].toLowerCase()}**. Consider having it a little less often this week.`
      : "Consider cutting back a little this week.";
    return { key, direction, title, detail, tip };
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
