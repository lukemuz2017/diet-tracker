// The person's details from setup, stored in metric at full precision so
// switching units and editing round-trip exactly.

export type Units = "us" | "metric";
export type Sex = "female" | "male";
export type Activity = "sedentary" | "light" | "moderate" | "very";

export interface Profile {
  units: Units;
  heightCm: number;
  weightKg: number;
  age: number;
  sex: Sex;
  activity: Activity;
}

export const ACTIVITY_OPTIONS: { value: Activity; label: string; description: string; factor: number }[] = [
  { value: "sedentary", label: "Mostly sitting", description: "Desk job, little exercise", factor: 1.2 },
  { value: "light", label: "Lightly active", description: "Light exercise or walks 1–3 days a week", factor: 1.375 },
  { value: "moderate", label: "Moderately active", description: "Exercise 3–5 days a week", factor: 1.55 },
  { value: "very", label: "Very active", description: "Hard exercise 6–7 days a week", factor: 1.725 },
];

export const CM_PER_INCH = 2.54;
export const KG_PER_LB = 0.45359237;

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

/** Rounds to at most one decimal and drops a trailing ".0". */
export function trimNumber(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/** "5 ft 10 in · 160 lb · 34 · male · moderately active" */
export function describeProfile(profile: Profile): string {
  const activity = ACTIVITY_OPTIONS.find((option) => option.value === profile.activity)!;
  const body =
    profile.units === "us"
      ? (() => {
          const { feet, inches } = cmToFeetInches(profile.heightCm);
          return `${feet} ft ${inches} in · ${Math.round(profile.weightKg / KG_PER_LB)} lb`;
        })()
      : `${Math.round(profile.heightCm)} cm · ${trimNumber(profile.weightKg)} kg`;
  return `${body} · ${profile.age} · ${profile.sex} · ${activity.label.toLowerCase()}`;
}
