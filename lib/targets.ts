// Target ranges for maintaining weight (flows.md: What's tracked). Pure
// functions, checked by lib/targets.test.ts.

import { NUTRIENTS, type NutrientKey } from "./nutrients.ts";
import { ACTIVITY_OPTIONS, type Profile } from "./profile.ts";

export type TargetKind = "range" | "min" | "max";

export interface Target {
  kind: TargetKind;
  /** Lower bound for "range" and "min". */
  min?: number;
  /** Upper bound for "range" and "max". */
  max?: number;
}

export type Targets = Record<NutrientKey, Target>;

/** Mifflin-St Jeor resting energy, in kcal/day. */
export function restingCalories({ weightKg, heightCm, age, sex }: Profile): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
}

export function activityFactor(profile: Profile): number {
  return ACTIVITY_OPTIONS.find((option) => option.value === profile.activity)!.factor;
}

/** Estimated calories to maintain current weight, rounded to 10 kcal. */
export function maintenanceCalories(profile: Profile): number {
  return roundTo(restingCalories(profile) * activityFactor(profile), 10);
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function computeTargets(profile: Profile): Targets {
  const kcal = maintenanceCalories(profile);
  const male = profile.sex === "male";
  const older = profile.age >= 51;

  return {
    calories: { kind: "range", min: roundTo(kcal * 0.9, 10), max: roundTo(kcal * 1.1, 10) },
    protein: {
      kind: "range",
      min: Math.round(Math.max((kcal * 0.1) / 4, 0.8 * profile.weightKg)),
      max: Math.round((kcal * 0.35) / 4),
    },
    carbs: { kind: "range", min: Math.round((kcal * 0.45) / 4), max: Math.round((kcal * 0.65) / 4) },
    fat: { kind: "range", min: Math.round((kcal * 0.2) / 9), max: Math.round((kcal * 0.35) / 9) },
    fiber: { kind: "min", min: Math.round((kcal / 1000) * 14) },
    addedSugar: { kind: "max", max: Math.round((kcal * 0.1) / 4) },
    sodium: { kind: "max", max: 2300 },
    potassium: { kind: "min", min: male ? 3400 : 2600 },
    calcium: { kind: "min", min: (!male && older) || (male && profile.age >= 71) ? 1200 : 1000 },
    iron: { kind: "min", min: male || older ? 8 : 18 },
    vitaminA: { kind: "min", min: male ? 900 : 700 },
    vitaminC: { kind: "min", min: male ? 90 : 75 },
  };
}

export function formatAmount(value: number): string {
  return value.toLocaleString("en-US");
}

/** "2,110–2,580 kcal", "at least 33 g", "under 2,300 mg" */
export function formatTarget(key: NutrientKey, target: Target): string {
  const unit = NUTRIENTS[key].unit;
  if (target.kind === "range") return `${formatAmount(target.min!)}–${formatAmount(target.max!)} ${unit}`;
  if (target.kind === "min") return `at least ${formatAmount(target.min!)} ${unit}`;
  return `under ${formatAmount(target.max!)} ${unit}`;
}

function rdaGroup(profile: Profile): string {
  const sex = profile.sex === "male" ? "men" : "women";
  if (profile.age >= 71) return `${sex} 71 and over`;
  if (profile.age >= 51) return `${sex} 51–70`;
  return `${sex} 19–50`;
}

/** The ⓘ explanation for one range, using the person's own numbers. */
export function explainTarget(key: NutrientKey, profile: Profile, targets: Targets): string {
  const kcal = maintenanceCalories(profile);
  const resting = formatAmount(Math.round(restingCalories(profile)));
  const activity = ACTIVITY_OPTIONS.find((option) => option.value === profile.activity)!;
  const kcalText = `${formatAmount(kcal)} kcal`;

  switch (key) {
    case "calories":
      return `Your maintenance estimate is ${kcalText}: a resting rate of ${resting} kcal (Mifflin-St Jeor equation) × ${activity.factor} for ${activity.label.toLowerCase()}. The range is 10% either side.`;
    case "protein":
      return `10–35% of your ${kcalText}, and never below 0.8 g per kg of body weight (${Math.round(0.8 * profile.weightKg)} g for you).`;
    case "carbs":
      return `45–65% of your ${kcalText}, at 4 kcal per gram.`;
    case "fat":
      return `20–35% of your ${kcalText}, at 9 kcal per gram.`;
    case "fiber":
      return `14 g for every 1,000 kcal you eat, so ${targets.fiber.min} g at ${kcalText}.`;
    case "addedSugar":
      return `Under 10% of your ${kcalText}, at 4 kcal per gram. This counts sugar added to food, not the sugar in fruit or milk.`;
    case "sodium":
      return "Under 2,300 mg a day for adults, the U.S. Dietary Guidelines limit.";
    default:
      return `The Recommended Dietary Allowance for ${rdaGroup(profile)}${
        key === "potassium" ? " (an Adequate Intake, since there's no RDA)" : ""
      }.`;
  }
}
