import assert from "node:assert/strict";
import { test } from "node:test";
import type { Entry } from "./storage.ts";
import type { Targets } from "./targets.ts";
import { summarizeWindow, windowDates } from "./week.ts";

const TODAY = "2026-10-18";
const MAINTENANCE = 2000;
const targets = {
  calories: { kind: "range", min: 1800, max: 2200 },
  protein: { kind: "range", min: 50, max: 100 },
  carbs: { kind: "range", min: 130, max: 300 },
  fat: { kind: "range", min: 40, max: 80 },
  fiber: { kind: "min", min: 28 },
  sodium: { kind: "max", max: 2300 },
  potassium: { kind: "min", min: 3400 },
  calcium: { kind: "min", min: 1000 },
  iron: { kind: "min", min: 8 },
  vitaminA: { kind: "min", min: 900 },
  vitaminC: { kind: "min", min: 90 },
} as Targets;

let id = 0;
function food(date: string, calories: number, extra: Entry["nutrients"] = {}): Entry {
  return { id: String(id++), date, name: "Food", servings: 1, nutrients: { calories, ...extra }, createdAt: `${date}T12:00:00Z` };
}

test("the window is the 7 days ending on the chosen date", () => {
  assert.deepEqual(windowDates("2026-10-15"), [
    "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15",
  ]);
});

test("past days count unless they look half-logged; unlogged days are gaps", () => {
  const entries = [
    food("2026-10-12", 2000),
    food("2026-10-13", 700), // under 40% of 2,000: looks incomplete
    food("2026-10-14", 2100),
  ];
  const s = summarizeWindow({ entries, completeDays: [] }, TODAY, TODAY, MAINTENANCE, targets);
  const state = (date: string) => s.days.find((day) => day.date === date)!.state;
  assert.equal(state("2026-10-12"), "complete");
  assert.equal(state("2026-10-13"), "incomplete");
  assert.equal(state("2026-10-15"), "missed");
  assert.equal(s.counted, 2);
  assert.equal(s.logged, 3);
  assert.equal(s.averages.calories, 2050); // gaps aren't zeros
});

test("today counts only once marked complete", () => {
  const entries = [food(TODAY, 900)];
  const before = summarizeWindow({ entries, completeDays: [] }, TODAY, TODAY, MAINTENANCE, targets);
  assert.equal(before.days.at(-1)!.state, "in-progress");
  assert.equal(before.counted, 0);
  const after = summarizeWindow({ entries, completeDays: [TODAY] }, TODAY, TODAY, MAINTENANCE, targets);
  assert.equal(after.days.at(-1)!.state, "complete");
  assert.equal(after.counted, 1);
});

test("marking a half-logged day complete counts it", () => {
  const entries = [food("2026-10-13", 700)];
  const s = summarizeWindow({ entries, completeDays: ["2026-10-13"] }, TODAY, TODAY, MAINTENANCE, targets);
  assert.equal(s.counted, 1);
});

test("coverage counts days with a value and days in range", () => {
  const entries = [
    food("2026-10-12", 2000, { fiber: 30 }),
    food("2026-10-13", 2000, { fiber: 10 }),
    food("2026-10-14", 2000),
  ];
  const s = summarizeWindow({ entries, completeDays: [] }, TODAY, TODAY, MAINTENANCE, targets);
  assert.deepEqual(s.coverage.fiber, { days: 2, inRange: 1 });
  assert.equal(s.averages.fiber, 20);
  assert.deepEqual(s.coverage.calories, { days: 3, inRange: 3 });
});

test("a past window works the same as the current one", () => {
  const entries = [food("2026-10-10", 2000), food("2026-10-16", 2000)];
  const s = summarizeWindow({ entries, completeDays: [] }, "2026-10-15", TODAY, MAINTENANCE, targets);
  assert.equal(s.start, "2026-10-09");
  assert.equal(s.counted, 1); // Oct 16 is outside Oct 9–15
});
