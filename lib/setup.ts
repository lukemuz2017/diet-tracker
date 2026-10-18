// Validation for the setup form. Messages sit next to the field and say what
// to do next (AGENTS.md: Forms). Checked by lib/setup.test.ts.

import { CM_PER_INCH, KG_PER_LB, cmToFeetInches, trimNumber, type Activity, type Profile, type Sex, type Units } from "./profile.ts";

/** What the person typed, kept as strings so an error never changes it. */
export interface SetupValues {
  units: Units;
  heightFt: string;
  heightIn: string;
  heightCm: string;
  weight: string;
  age: string;
  sex: Sex | null;
  activity: Activity | null;
}

export type SetupField = "height" | "weight" | "age" | "sex" | "activity";
export type SetupErrors = Partial<Record<SetupField, string>>;

export const LIMITS = {
  heightCm: { min: 122, max: 229 },
  heightIn: { min: 48, max: 90 },
  weightKg: { min: 32, max: 318 },
  weightLb: { min: 70, max: 700 },
  age: { min: 19, max: 100 },
};

export const EMPTY_SETUP: SetupValues = {
  units: "us",
  heightFt: "",
  heightIn: "",
  heightCm: "",
  weight: "",
  age: "",
  sex: null,
  activity: null,
};

function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  return /^\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : null;
}

function readHeightCm(values: SetupValues): { cm?: number; error?: string } {
  if (values.units === "metric") {
    const cm = parseNumber(values.heightCm);
    if (cm === null) return { error: "Enter your height in centimeters, like 178." };
    if (cm < LIMITS.heightCm.min || cm > LIMITS.heightCm.max) {
      return { error: `Enter a height between ${LIMITS.heightCm.min} and ${LIMITS.heightCm.max} cm.` };
    }
    return { cm };
  }

  const feet = parseNumber(values.heightFt);
  const inches = values.heightIn.trim() === "" ? 0 : parseNumber(values.heightIn);
  if (feet === null || inches === null) return { error: "Enter your height in feet and inches, like 5 ft 10 in." };
  if (inches >= 12) return { error: "Inches should be between 0 and 11." };
  const totalInches = feet * 12 + inches;
  if (totalInches < LIMITS.heightIn.min || totalInches > LIMITS.heightIn.max) {
    return { error: "Enter a height between 4 ft and 7 ft 6 in." };
  }
  return { cm: totalInches * CM_PER_INCH };
}

function readWeightKg(values: SetupValues): { kg?: number; error?: string } {
  const value = parseNumber(values.weight);
  if (values.units === "metric") {
    if (value === null) return { error: "Enter your weight in kilograms, like 72." };
    if (value < LIMITS.weightKg.min || value > LIMITS.weightKg.max) {
      return { error: `Enter a weight between ${LIMITS.weightKg.min} and ${LIMITS.weightKg.max} kg.` };
    }
    return { kg: value };
  }
  if (value === null) return { error: "Enter your weight in pounds, like 160." };
  if (value < LIMITS.weightLb.min || value > LIMITS.weightLb.max) {
    return { error: `Enter a weight between ${LIMITS.weightLb.min} and ${LIMITS.weightLb.max} lb.` };
  }
  return { kg: value * KG_PER_LB };
}

export function validateSetup(values: SetupValues): { profile: Profile | null; errors: SetupErrors } {
  const errors: SetupErrors = {};
  const height = readHeightCm(values);
  const weight = readWeightKg(values);
  const age = parseNumber(values.age);

  if (height.error) errors.height = height.error;
  if (weight.error) errors.weight = weight.error;
  if (age === null || !Number.isInteger(age)) errors.age = "Enter your age in whole years, like 34.";
  else if (age < LIMITS.age.min || age > LIMITS.age.max) {
    errors.age = `Enter an age between ${LIMITS.age.min} and ${LIMITS.age.max}. These targets are for adults.`;
  }
  if (!values.sex) errors.sex = "Choose one so we can estimate your needs.";
  if (!values.activity) errors.activity = "Choose the option closest to a typical week.";

  if (Object.keys(errors).length > 0) return { profile: null, errors };
  return {
    profile: {
      units: values.units,
      heightCm: height.cm!,
      weightKg: weight.kg!,
      age: age!,
      sex: values.sex!,
      activity: values.activity!,
    },
    errors,
  };
}

/** Prefills the form from a saved profile, for editing. */
export function valuesFromProfile(profile: Profile): SetupValues {
  const { feet, inches } = cmToFeetInches(profile.heightCm);
  return {
    units: profile.units,
    heightFt: String(feet),
    heightIn: String(inches),
    heightCm: trimNumber(profile.heightCm),
    weight: profile.units === "us" ? trimNumber(profile.weightKg / KG_PER_LB) : trimNumber(profile.weightKg),
    age: String(profile.age),
    sex: profile.sex,
    activity: profile.activity,
  };
}

/** Switches units, converting whatever height and weight can be read. */
export function switchUnits(values: SetupValues, units: Units): SetupValues {
  if (units === values.units) return values;
  const height = readHeightCm(values);
  const weight = parseNumber(values.weight);
  const next: SetupValues = { ...values, units };

  if (height.cm !== undefined) {
    const { feet, inches } = cmToFeetInches(height.cm);
    next.heightFt = String(feet);
    next.heightIn = String(inches);
    next.heightCm = String(Math.round(height.cm));
  }
  if (weight !== null) {
    next.weight = units === "metric" ? trimNumber(weight * KG_PER_LB) : String(Math.round(weight / KG_PER_LB));
  }
  return next;
}
