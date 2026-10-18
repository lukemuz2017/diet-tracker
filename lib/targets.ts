// Target ranges for maintaining weight (flows.md: What's tracked). Pure
// functions, checked by lib/targets.test.ts.

import { NUTRIENTS, type NutrientKey } from "./nutrients.ts";
import { ACTIVITY_OPTIONS, profileAge, type Profile } from "./profile.ts";

export type TargetKind = "range" | "min" | "max";

export interface Target {
  kind: TargetKind;
  /** Lower bound for "range" and "min". */
  min?: number;
  /** Upper bound for "range" and "max". */
  max?: number;
}

export type Targets = Record<NutrientKey, Target>;

// Dietary Reference Intake life-stage groups. An 18-year-old falls in 14–18.
type AgeBand = "14-18" | "19-30" | "31-50" | "51-70" | "71+";

export function ageBand(age: number): AgeBand {
  if (age <= 18) return "14-18";
  if (age <= 30) return "19-30";
  if (age <= 50) return "31-50";
  if (age <= 70) return "51-70";
  return "71+";
}

type ByBand = Record<AgeBand, number>;
const band = (teen: number, young: number, mid: number, older: number, oldest: number): ByBand => ({
  "14-18": teen,
  "19-30": young,
  "31-50": mid,
  "51-70": older,
  "71+": oldest,
});

// RDA, or AI where there is no RDA (potassium), per day.
const MICRONUTRIENTS: Record<"potassium" | "calcium" | "iron" | "vitaminA" | "vitaminC", { male: ByBand; female: ByBand }> = {
  potassium: { male: band(3000, 3400, 3400, 3400, 3400), female: band(2300, 2600, 2600, 2600, 2600) },
  calcium: { male: band(1300, 1000, 1000, 1000, 1200), female: band(1300, 1000, 1000, 1200, 1200) },
  iron: { male: band(11, 8, 8, 8, 8), female: band(15, 18, 18, 8, 8) },
  vitaminA: { male: band(900, 900, 900, 900, 900), female: band(700, 700, 700, 700, 700) },
  vitaminC: { male: band(75, 90, 90, 90, 90), female: band(65, 75, 75, 75, 75) },
};

/** Mifflin-St Jeor resting energy, in kcal/day. Non-binary uses the midpoint of the two equations. */
export function restingCalories(profile: Profile, today: string): number {
  const sexTerm = profile.sex === "male" ? 5 : profile.sex === "female" ? -161 : -78;
  return 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profileAge(profile, today) + sexTerm;
}

export function activityFactor(profile: Profile): number {
  return ACTIVITY_OPTIONS.find((option) => option.value === profile.activity)!.factor;
}

/** Estimated calories to maintain current weight, rounded to 10 kcal. */
export function maintenanceCalories(profile: Profile, today: string): number {
  return roundTo(restingCalories(profile, today) * activityFactor(profile), 10);
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** A micronutrient target for this person. Non-binary takes the higher of the two, so needs are covered. */
function micronutrient(key: keyof typeof MICRONUTRIENTS, profile: Profile, age: number): number {
  const values = MICRONUTRIENTS[key];
  const group = ageBand(age);
  if (profile.sex === "male") return values.male[group];
  if (profile.sex === "female") return values.female[group];
  return Math.max(values.male[group], values.female[group]);
}

export function computeTargets(profile: Profile, today: string): Targets {
  const kcal = maintenanceCalories(profile, today);
  const age = profileAge(profile, today);
  const proteinRda = age <= 18 ? 0.85 : 0.8;

  return {
    calories: { kind: "range", min: roundTo(kcal * 0.9, 10), max: roundTo(kcal * 1.1, 10) },
    protein: {
      kind: "range",
      min: Math.round(Math.max((kcal * 0.1) / 4, proteinRda * profile.weightKg)),
      max: Math.round((kcal * 0.35) / 4),
    },
    carbs: { kind: "range", min: Math.round((kcal * 0.45) / 4), max: Math.round((kcal * 0.65) / 4) },
    fat: { kind: "range", min: Math.round((kcal * 0.2) / 9), max: Math.round((kcal * 0.35) / 9) },
    fiber: { kind: "min", min: Math.round((kcal / 1000) * 14) },
    addedSugar: { kind: "max", max: Math.round((kcal * 0.1) / 4) },
    sodium: { kind: "max", max: 2300 },
    potassium: { kind: "min", min: micronutrient("potassium", profile, age) },
    calcium: { kind: "min", min: micronutrient("calcium", profile, age) },
    iron: { kind: "min", min: micronutrient("iron", profile, age) },
    vitaminA: { kind: "min", min: micronutrient("vitaminA", profile, age) },
    vitaminC: { kind: "min", min: micronutrient("vitaminC", profile, age) },
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

function groupName(profile: Profile, age: number): string {
  const who = profile.sex === "male" ? "men" : profile.sex === "female" ? "women" : "adults";
  const group = ageBand(age);
  return group === "14-18" ? `${who} 18 and under` : group === "71+" ? `${who} 71 and over` : `${who} ${group}`;
}

/** The ⓘ explanation for one range, using the person's own numbers. */
export function explainTarget(key: NutrientKey, profile: Profile, targets: Targets, today: string): string {
  const kcal = maintenanceCalories(profile, today);
  const age = profileAge(profile, today);
  const resting = formatAmount(Math.round(restingCalories(profile, today)));
  const activity = ACTIVITY_OPTIONS.find((option) => option.value === profile.activity)!;
  const kcalText = `${formatAmount(kcal)} kcal`;
  const nonbinary = profile.sex === "nonbinary";

  switch (key) {
    case "calories":
      return `Your maintenance estimate is ${kcalText}: a resting rate of ${resting} kcal (Mifflin-St Jeor equation${
        nonbinary ? ", midway between the female and male versions" : ""
      }) × ${activity.factor} for ${activity.label.toLowerCase()}. The range is 10% either side.`;
    case "protein":
      return `10–35% of your ${kcalText}, and never below ${age <= 18 ? 0.85 : 0.8} g per kg of body weight (${Math.round(
        (age <= 18 ? 0.85 : 0.8) * profile.weightKg,
      )} g for you).`;
    case "carbs":
      return `45–65% of your ${kcalText}, at 4 kcal per gram.`;
    case "fat":
      return `20–35% of your ${kcalText}, at 9 kcal per gram.`;
    case "fiber":
      return `14 g for every 1,000 kcal you eat, so ${targets.fiber.min} g at ${kcalText}.`;
    case "addedSugar":
      return `Under 10% of your ${kcalText}, at 4 kcal per gram. This counts sugar added to food, not the sugar in fruit or milk.`;
    case "sodium":
      return "Under 2,300 mg a day, the U.S. Dietary Guidelines limit for adults.";
    default:
      return `The Recommended Dietary Allowance for ${groupName(profile, age)}${
        key === "potassium" ? " (an Adequate Intake, since there's no RDA)" : ""
      }${nonbinary ? ", using the higher of the female and male values so your needs are covered" : ""}.`;
  }
}
