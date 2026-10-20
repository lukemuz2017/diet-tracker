// The person's details from setup, stored in metric at full precision so
// switching units and editing round-trip exactly. Age is worked out from the
// birth date each day, so it stays right over time.

import { ageOn } from "./dates.ts";

export type Units = "us" | "metric";
export type Sex = "female" | "male" | "nonbinary";
export type Activity = "sedentary" | "light" | "moderate" | "very";

export interface Profile {
  units: Units;
  heightCm: number;
  weightKg: number;
  /** "YYYY-MM-DD" */
  birthDate: string;
  sex: Sex;
  activity: Activity;
}

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "nonbinary", label: "Non-binary" },
];

// The National Academies' four activity levels (inactive, low active, active,
// very active), described with their example activities for adults.
export const ACTIVITY_OPTIONS: { value: Activity; label: string; description: string }[] = [
  { value: "sedentary", label: "Mostly sitting", description: "Daily routine and light chores, little exercise" },
  { value: "light", label: "Lightly active", description: "About an hour of walking most days, or similar" },
  { value: "moderate", label: "Active", description: "Walking plus regular exercise, like cycling or tennis" },
  { value: "very", label: "Very active", description: "Hard exercise or a physical job most days, like jogging" },
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

export function profileAge(profile: Profile, today: string): number {
  return ageOn(profile.birthDate, today);
}

/** Checks a stored profile has the current shape (older saves lack birthDate). */
export function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.heightCm === "number" &&
    typeof p.weightKg === "number" &&
    typeof p.birthDate === "string" &&
    SEX_OPTIONS.some((option) => option.value === p.sex) &&
    ACTIVITY_OPTIONS.some((option) => option.value === p.activity)
  );
}

/** "5 ft 10 in · 160 lb · 34 · male · moderately active" */
/** The profile as labeled facts, in the units the person chose. */
export function profileFacts(profile: Profile, today: string): { label: string; value: string }[] {
  const activity = ACTIVITY_OPTIONS.find((option) => option.value === profile.activity)!;
  const sex = SEX_OPTIONS.find((option) => option.value === profile.sex)!.label;
  const { feet, inches } = cmToFeetInches(profile.heightCm);
  return [
    { label: "Height", value: profile.units === "us" ? `${feet} ft ${inches} in` : `${Math.round(profile.heightCm)} cm` },
    { label: "Weight", value: profile.units === "us" ? `${Math.round(profile.weightKg / KG_PER_LB)} lb` : `${trimNumber(profile.weightKg)} kg` },
    { label: "Age", value: String(profileAge(profile, today)) },
    { label: "Sex", value: sex },
    { label: "Activity", value: activity.label },
  ];
}

export function describeProfile(profile: Profile, today: string): string {
  const activity = ACTIVITY_OPTIONS.find((option) => option.value === profile.activity)!;
  const sex = SEX_OPTIONS.find((option) => option.value === profile.sex)!.label.toLowerCase();
  const body =
    profile.units === "us"
      ? (() => {
          const { feet, inches } = cmToFeetInches(profile.heightCm);
          return `${feet} ft ${inches} in · ${Math.round(profile.weightKg / KG_PER_LB)} lb`;
        })()
      : `${Math.round(profile.heightCm)} cm · ${trimNumber(profile.weightKg)} kg`;
  return `${body} · ${profileAge(profile, today)} · ${sex} · ${activity.label.toLowerCase()}`;
}
