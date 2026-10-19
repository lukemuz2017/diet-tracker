// The summary at the top of This week: a verdict in words and three tiles,
// judged on the 7-day averages: one thing going well, one that could improve,
// and a bigger-picture habit drawn from the week as a whole. Suggestions stay
// at the food-group level, not a specific food to add. Foods in the text are
// wrapped in ** so the page can show them in bold.

import { formatValue, NUTRIENT_KEYS, statusFor } from "./log.ts";
import { NUTRIENTS, type NutrientKey } from "./nutrients.ts";
import type { Entry } from "./storage.ts";
import { formatTarget, type Targets } from "./targets.ts";
import type { WindowSummary } from "./week.ts";

/** What to try when a nutrient's average is low: food groups, with everyday examples. */
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

/** Which on-track nutrient to praise first: the harder wins lead. */
const GOOD_ORDER: NutrientKey[] = ["fiber", "vitaminC", "potassium", "calcium", "iron", "vitaminA", "protein", "carbs", "fat", "calories", "sodium"];
/** Staying under a limit or near maintenance is good, but no single food earns the credit. */
const NO_SOURCE: NutrientKey[] = ["calories", "sodium"];

export type TileKind = "good" | "improve" | "big";

export interface Tile {
  kind: TileKind;
  /** Tints the tile: in range, under, over, or a general habit. */
  tone: "good" | "low" | "high" | "big";
  /** "Fiber is on track", "Carbs are low", "Fill up on produce" */
  title: string;
  /** "Averaging 2,420 mg · at least 3,400 mg" (nutrient tiles only) */
  detail?: string;
  tip: string;
  key?: NutrientKey;
}

export type Verdict = "waiting" | "balanced" | "mostly" | "work";

export interface Summary {
  verdict: Verdict;
  headline: string;
  tiles: Tile[];
}

const HEADLINES: Record<Verdict, string> = {
  waiting: "Your summary starts once a day is complete.",
  balanced: "Balanced across the board.",
  mostly: "Mostly balanced.",
  work: "A few things to work on.",
};

/**
 * Bigger-picture habits, first match wins. `keys` lists the nutrients that
 * triggered a rule; a rule is skipped when it would only repeat the
 * "could improve" tile.
 */
const HABITS: { title: string; tip: string; keys: (low: Set<NutrientKey>, high: Set<NutrientKey>) => NutrientKey[] }[] = [
  {
    title: "Fill up on produce",
    tip: "Try making half your plate **vegetables** and **fruit** at two meals a day.",
    keys: (low) => {
      const produce = (["fiber", "potassium", "vitaminA", "vitaminC"] as NutrientKey[]).filter((key) => low.has(key));
      return produce.length >= 2 ? produce : [];
    },
  },
  {
    title: "Fuller days",
    tip: "Your days run light. Try a fuller lunch, or plan an afternoon snack like **nuts** or **yogurt**.",
    keys: (low) => (low.has("calories") && ["carbs", "protein", "fat"].some((key) => low.has(key as NutrientKey)) ? (["calories", "carbs", "protein", "fat"] as NutrientKey[]).filter((key) => low.has(key)) : []),
  },
  {
    title: "Ease up on salt",
    tip: "Salt adds up fast in packaged and restaurant food. Try cooking one more meal at home this week.",
    keys: (_, high) => (high.has("sodium") ? ["sodium"] : []),
  },
  {
    title: "Portion check",
    tip: "Try a slightly smaller portion at your biggest meal of the day.",
    keys: (_, high) => (high.has("calories") ? ["calories"] : []),
  },
  {
    title: "Protein at each meal",
    tip: "Build each meal around a protein, like **eggs**, **beans**, **fish** or **tofu**.",
    keys: (low) => (low.has("protein") ? ["protein"] : []),
  },
  {
    title: "Mix in minerals",
    tip: "Add a **dairy** food or **leafy greens** to one meal a day.",
    keys: (low) => (["calcium", "iron"] as NutrientKey[]).filter((key) => low.has(key)),
  },
];
const DEFAULT_HABIT = { title: "Keep it varied", tip: "Try a different **vegetable** each day this week; variety keeps vitamins and minerals in range." };

/** "Carbs are low", "Fiber is low" */
function verb(label: string): string {
  return label.endsWith("s") ? "are" : "is";
}

/** How far off the average is, as a share of the target edge it missed. */
function distance(value: number, edge: number): number {
  return Math.abs(value - edge) / edge;
}

export function summarize(summary: WindowSummary, targets: Targets, entries: Entry[]): Summary {
  if (summary.counted === 0) return { verdict: "waiting", headline: HEADLINES.waiting, tiles: [] };

  const counted = new Set(summary.days.filter((day) => day.state === "complete").map((day) => day.date));
  const inRange: NutrientKey[] = [];
  const off: { key: NutrientKey; direction: "low" | "high"; distance: number }[] = [];
  const detailFor = (key: NutrientKey) => `Averaging ${formatValue(summary.averages[key]!)} ${NUTRIENTS[key].unit} · ${formatTarget(key, targets[key])}`;

  for (const key of NUTRIENT_KEYS) {
    const value = summary.averages[key];
    if (value === undefined) continue;
    const target = targets[key];
    const status = statusFor(key, target, value).kind;
    if (status === "in-range") inRange.push(key);
    else if (status === "to-go") off.push({ key, direction: "low", distance: distance(value, target.min!) });
    else if (status === "over") {
      const edge = target.max !== undefined && value > target.max ? target.max : target.upper!;
      off.push({ key, direction: "high", distance: distance(value, edge) });
    }
  }
  off.sort((a, b) => b.distance - a.distance);

  const tiles: Tile[] = [];

  // Going well: the on-track nutrient that was in range on the most days.
  const share = (key: NutrientKey) => {
    const { days, inRange: good } = summary.coverage[key];
    return days === 0 ? 0 : good / days;
  };
  // Calories and sodium are only praised when nothing else is on track.
  const rank = (key: NutrientKey) => (NO_SOURCE.includes(key) ? 1 : 0);
  const good = [...inRange].sort((a, b) => rank(a) - rank(b) || share(b) - share(a) || GOOD_ORDER.indexOf(a) - GOOD_ORDER.indexOf(b))[0];
  if (good) {
    const { label } = NUTRIENTS[good];
    const source = NO_SOURCE.includes(good) ? undefined : topSource(entries, counted, good);
    tiles.push({
      kind: "good",
      tone: "good",
      key: good,
      title: `${label} ${verb(label)} on track`,
      detail: detailFor(good),
      tip: source ? `Mostly from **${shortName(source)}**. Keep it up.` : "Keep it up.",
    });
  }

  // Could improve: the nutrient furthest off.
  const worst = off[0];
  if (worst) {
    const { label } = NUTRIENTS[worst.key];
    const source = worst.direction === "high" ? topSource(entries, counted, worst.key) : undefined;
    tiles.push({
      kind: "improve",
      tone: worst.direction,
      key: worst.key,
      title: `${label} ${verb(label)} ${worst.direction}`,
      detail: detailFor(worst.key),
      tip:
        worst.direction === "low"
          ? LOW_TIPS[worst.key]
          : source
            ? `Mostly from **${shortName(source)}**. Consider having it a little less often this week.`
            : "Consider cutting back a little this week.",
    });
  }

  // Bigger picture: a habit from the week's overall pattern.
  const low = new Set(off.filter((item) => item.direction === "low").map((item) => item.key));
  const high = new Set(off.filter((item) => item.direction === "high").map((item) => item.key));
  const habit =
    HABITS.find((rule) => {
      const keys = rule.keys(low, high);
      return keys.length > 0 && !keys.every((key) => key === worst?.key);
    }) ?? DEFAULT_HABIT;
  tiles.push({ kind: "big", tone: "big", title: habit.title, tip: habit.tip });

  const verdict: Verdict = off.length === 0 ? "balanced" : off.length <= 3 && inRange.length >= off.length * 2 ? "mostly" : "work";
  return { verdict, headline: HEADLINES[verdict], tiles };
}

/** "Cheese pizza" → "cheese pizza"; "Lentils, cooked" → "lentils" */
function shortName(name: string): string {
  return name.split(",")[0].toLowerCase();
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
