// The built-in common foods (static data, no API). Values come from USDA
// FoodData Central, per the serving shown; see lib/foods-data.ts.

import { FOOD_DATA } from "./foods-data.ts";
import type { Nutrients } from "./nutrients.ts";

export interface Food {
  id: string;
  name: string;
  /** Household serving, e.g. "1 medium". */
  serving: string;
  grams: number;
  /** Values for one serving. */
  nutrients: Nutrients;
  /** USDA FoodData Central id, for checking the numbers. */
  fdcId: number;
}

export type FoodCategory = "Fruit" | "Vegetables" | "Protein foods" | "Dairy" | "Grains" | "Other";

export const CATEGORY_ORDER: FoodCategory[] = ["Fruit", "Vegetables", "Protein foods", "Dairy", "Grains", "Other"];

const CATEGORY_OF: Record<string, FoodCategory> = {
  banana: "Fruit",
  apple: "Fruit",
  orange: "Fruit",
  strawberries: "Fruit",
  blueberries: "Fruit",
  avocado: "Fruit",
  spinach: "Vegetables",
  broccoli: "Vegetables",
  carrots: "Vegetables",
  sweetPotato: "Vegetables",
  potato: "Vegetables",
  tomato: "Vegetables",
  redBellPepper: "Vegetables",
  saladGreens: "Vegetables",
  eggs: "Protein foods",
  egg: "Protein foods",
  chickenBreast: "Protein foods",
  salmon: "Protein foods",
  tuna: "Protein foods",
  tofu: "Protein foods",
  blackBeans: "Protein foods",
  lentils: "Protein foods",
  chickpeas: "Protein foods",
  peanutButter: "Protein foods",
  almonds: "Protein foods",
  groundBeef: "Protein foods",
  greekYogurt: "Dairy",
  milk: "Dairy",
  cheddar: "Dairy",
  cheddarCheese: "Dairy",
  oatmeal: "Grains",
  brownRice: "Grains",
  whiteRice: "Grains",
  wholeWheatBread: "Grains",
  pasta: "Grains",
  quinoa: "Grains",
};

export const FOODS: Food[] = FOOD_DATA;

export function categoryOf(food: Food): FoodCategory {
  return CATEGORY_OF[food.id] ?? "Other";
}

export function findFood(id: string): Food | undefined {
  return FOODS.find((food) => food.id === id);
}

/** One-tap picks for an empty Today, in order of preference. */
export const QUICK_PICK_IDS = ["oatmeal", "banana", "egg", "eggs", "greekYogurt", "blackBeans", "brownRice", "apple", "chickenBreast"];

export function quickPicks(limit = 6): Food[] {
  return QUICK_PICK_IDS.map(findFood).filter((food): food is Food => Boolean(food)).slice(0, limit);
}
