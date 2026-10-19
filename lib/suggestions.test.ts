import assert from "node:assert/strict";
import { test } from "node:test";
import type { Entry } from "./storage.ts";
import { summarize } from "./suggestions.ts";
import type { Targets } from "./targets.ts";
import type { WindowSummary } from "./week.ts";

const targets = {
  calories: { kind: "range", min: 1800, max: 2200 },
  protein: { kind: "range", min: 50, max: 100 },
  carbs: { kind: "range", min: 130, max: 300 },
  fat: { kind: "range", min: 40, max: 80 },
  fiber: { kind: "min", min: 28 },
  sodium: { kind: "max", max: 2300 },
  potassium: { kind: "min", min: 3400 },
  calcium: { kind: "min", min: 1000, upper: 2500 },
  iron: { kind: "min", min: 8 },
  vitaminA: { kind: "min", min: 900 },
  vitaminC: { kind: "min", min: 90 },
} as Targets;

const balanced = { calories: 2000, protein: 80, carbs: 250, fat: 60, fiber: 30, sodium: 1800, potassium: 3500, calcium: 1100, iron: 10, vitaminA: 950, vitaminC: 100 };

function window(averages: WindowSummary["averages"], counted = 3): WindowSummary {
  return {
    days: [{ date: "2026-10-18", state: "complete" }],
    counted,
    averages,
  } as unknown as WindowSummary;
}

const pizza: Entry = { id: "p", date: "2026-10-18", name: "Cheese pizza", servings: 3, nutrients: { sodium: 1900 }, createdAt: "2026-10-18T19:00:00Z" };
const soup: Entry = { id: "s", date: "2026-10-18", name: "Soup", servings: 1, nutrients: { sodium: 700 }, createdAt: "2026-10-18T12:00:00Z" };

test("no complete days yet: a waiting message and nothing to work on", () => {
  const result = summarize(window({}, 0), targets, []);
  assert.equal(result.verdict, "waiting");
  assert.deepEqual(result.focus, []);
});

test("everything in range is balanced", () => {
  const result = summarize(window(balanced), targets, []);
  assert.equal(result.verdict, "balanced");
  assert.equal(result.focus.length, 0);
});

test("the furthest-off nutrients come first, at most three", () => {
  const result = summarize(window({ ...balanced, potassium: 1700, fiber: 20, vitaminC: 80, iron: 7 }), targets, []);
  assert.deepEqual(result.focus.map((item) => item.key), ["potassium", "fiber", "iron"]);
  assert.equal(result.verdict, "work");
});

test("a low nutrient gets a food-group suggestion", () => {
  const result = summarize(window({ ...balanced, carbs: 100 }), targets, []);
  assert.equal(result.verdict, "mostly");
  assert.match(result.focus[0].tip, /^Consider adding some grains/);
});

test("a high nutrient's suggestion names its biggest source", () => {
  const result = summarize(window({ ...balanced, sodium: 2600 }), targets, [soup, pizza]);
  assert.equal(result.focus[0].title, "Sodium is high");
  assert.match(result.focus[0].tip, /^Mostly from cheese pizza\./);
});

test("going over a minimum is fine; above a safe upper limit is high", () => {
  assert.equal(summarize(window({ ...balanced, fiber: 60 }), targets, []).verdict, "balanced");
  assert.equal(summarize(window({ ...balanced, calcium: 3000 }), targets, []).focus[0]?.title, "Calcium is high");
});
