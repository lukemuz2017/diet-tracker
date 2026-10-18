// Recipes: per-serving nutrition read from pasted recipe text, or added up
// from ingredients. Pure functions, checked by lib/recipe.test.ts.

import { DAILY_VALUES, NUTRIENT_KEYS, scaleNutrients } from "./log.ts";
import type { NutrientKey, Nutrients } from "./nutrients.ts";

export interface Ingredient {
  name: string;
  foodId?: string;
  /** Multiple of the food's base amount. */
  multiple: number;
  /** Totals for this ingredient. */
  nutrients: Nutrients;
}

export interface Recipe {
  id: string;
  name: string;
  /** How many servings the whole recipe makes. */
  servings: number;
  perServing: Nutrients;
  ingredients?: Ingredient[];
  createdAt: string;
}

const NUMBER = String.raw`(\d+(?:\.\d+)?)`;

// Label patterns per nutrient. "fat" must not match "saturated fat" etc.
const LABELS: Record<NutrientKey, { label: string; unit: string }> = {
  calories: { label: String.raw`(?:calories|energy)`, unit: String.raw`(?:kcal|cal)?` },
  protein: { label: "protein", unit: "g" },
  carbs: { label: String.raw`(?:total\s+)?(?:carbohydrates?|carbs)`, unit: "g" },
  fat: { label: String.raw`(?<!saturated\s|trans\s|unsaturated\s|monounsaturated\s|polyunsaturated\s)(?:total\s+)?fat`, unit: "g" },
  fiber: { label: String.raw`(?:dietary\s+)?fib(?:er|re)`, unit: "g" },
  sodium: { label: "sodium", unit: "mg" },
  potassium: { label: "potassium", unit: "mg" },
  calcium: { label: "calcium", unit: "mg" },
  iron: { label: "iron", unit: "mg" },
  vitaminA: { label: String.raw`vitamin\s*a`, unit: String.raw`(?:mcg|µg|μg)(?:\s*rae)?` },
  vitaminC: { label: String.raw`vitamin\s*c`, unit: "mg" },
};

function toNumber(text: string): number {
  return Number(text.replace(",", ""));
}

/** Finds one nutrient's per-serving value in recipe text, or undefined. */
function findNutrient(text: string, key: NutrientKey): number | undefined {
  const { label, unit } = LABELS[key];
  // "Protein: 32 g", "Sodium 640mg", "Calories 450"
  const after = new RegExp(String.raw`\b${label}\b\s*[:\-–]?\s*${NUMBER}\s*(${unit}|%)`, "i").exec(text);
  if (after) {
    const value = toNumber(after[1]);
    if (after[2] === "%") {
      const dv = DAILY_VALUES[key];
      return dv ? Math.round((value / 100) * dv * 10) / 10 : undefined;
    }
    return value;
  }
  // "450 calories" (the word is both unit and label), "32g protein"
  if (key === "calories") {
    const before = new RegExp(String.raw`${NUMBER}\s*(?:kcal|calories)\b`, "i").exec(text);
    if (before) return toNumber(before[1]);
  } else if (unit === "g") {
    const before = new RegExp(String.raw`${NUMBER}\s*g\s+${label}\b`, "i").exec(text);
    if (before) return toNumber(before[1]);
  }
  return undefined;
}

export interface ParsedRecipe {
  name: string;
  servings: number | undefined;
  perServing: Nutrients;
  /** Nutrients found in the text. */
  found: NutrientKey[];
}

/** Reads a recipe's name, servings and per-serving nutrition panel from pasted text. */
export function parseRecipeText(text: string): ParsedRecipe {
  const normalized = text.replace(/ /g, " ");
  const servingsMatch =
    /\b(?:serves|servings|yield|yields|makes)\b\s*[:\-–]?\s*(\d+)/i.exec(normalized) ??
    /(\d+)\s+servings\b/i.exec(normalized);
  const perServing: Nutrients = {};
  for (const key of NUTRIENT_KEYS) {
    const value = findNutrient(normalized, key);
    if (value !== undefined) perServing[key] = value;
  }
  const firstLine = normalized.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "";
  return {
    name: firstLine.length <= 60 ? firstLine : "",
    servings: servingsMatch ? Number(servingsMatch[1]) : undefined,
    perServing,
    found: Object.keys(perServing) as NutrientKey[],
  };
}

/** Per-serving nutrition from a list of ingredients. A nutrient is known only if every ingredient has it. */
export function perServingFromIngredients(ingredients: Ingredient[], servings: number): Nutrients {
  const total: Nutrients = {};
  for (const key of NUTRIENT_KEYS) {
    if (ingredients.length === 0 || ingredients.some((item) => item.nutrients[key] === undefined)) continue;
    total[key] = ingredients.reduce((sum, item) => sum + item.nutrients[key]!, 0);
  }
  return scaleNutrients(total, 1 / servings);
}

export const RECIPE_PREFIX = "recipe:";
