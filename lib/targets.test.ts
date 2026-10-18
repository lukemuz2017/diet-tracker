import assert from "node:assert/strict";
import { test } from "node:test";
import type { Profile } from "./profile.ts";
import { computeTargets, formatTarget, maintenanceCalories, restingCalories } from "./targets.ts";

const man: Profile = { units: "metric", heightCm: 175, weightKg: 70, age: 30, sex: "male", activity: "moderate" };
const woman: Profile = { units: "metric", heightCm: 165, weightKg: 60, age: 40, sex: "female", activity: "sedentary" };

test("resting calories follow Mifflin-St Jeor", () => {
  // 10×70 + 6.25×175 − 5×30 + 5
  assert.equal(restingCalories(man), 1648.75);
  // 10×60 + 6.25×165 − 5×40 − 161
  assert.equal(restingCalories(woman), 1270.25);
});

test("maintenance applies the activity factor and rounds to 10 kcal", () => {
  assert.equal(maintenanceCalories(man), 2560); // 1648.75 × 1.55 = 2555.6
  assert.equal(maintenanceCalories(woman), 1520); // 1270.25 × 1.2 = 1524.3
});

test("calories are a range of 10% either side", () => {
  assert.deepEqual(computeTargets(man).calories, { kind: "range", min: 2300, max: 2820 });
});

test("macros follow the AMDR percentages", () => {
  const t = computeTargets(man); // 2,560 kcal
  assert.deepEqual(t.protein, { kind: "range", min: 64, max: 224 });
  assert.deepEqual(t.carbs, { kind: "range", min: 288, max: 416 });
  assert.deepEqual(t.fat, { kind: "range", min: 57, max: 100 });
});

test("protein never drops below 0.8 g per kg", () => {
  // Low calories, high weight: 0.8 g/kg beats 10% of calories.
  const heavy: Profile = { ...woman, weightKg: 140, age: 90, heightCm: 150 };
  const t = computeTargets(heavy);
  assert.equal(t.protein.min, 112);
});

test("fiber, added sugar and sodium scale or stay fixed as specified", () => {
  const t = computeTargets(man);
  assert.deepEqual(t.fiber, { kind: "min", min: 36 }); // 2.56 × 14
  assert.deepEqual(t.addedSugar, { kind: "max", max: 64 }); // 10% of 2,560 / 4
  assert.deepEqual(t.sodium, { kind: "max", max: 2300 });
});

test("vitamins and minerals use the RDA for sex and age", () => {
  const t = computeTargets(woman);
  assert.equal(t.iron.min, 18);
  assert.equal(t.calcium.min, 1000);
  assert.equal(t.potassium.min, 2600);
  assert.equal(t.vitaminA.min, 700);
  assert.equal(t.vitaminC.min, 75);

  const older = computeTargets({ ...woman, age: 55 });
  assert.equal(older.iron.min, 8);
  assert.equal(older.calcium.min, 1200);

  assert.equal(computeTargets(man).calcium.min, 1000);
  assert.equal(computeTargets({ ...man, age: 71 }).calcium.min, 1200);
});

test("targets read naturally", () => {
  const t = computeTargets(man);
  assert.equal(formatTarget("calories", t.calories), "2,300–2,820 kcal");
  assert.equal(formatTarget("fiber", t.fiber), "at least 36 g");
  assert.equal(formatTarget("sodium", t.sodium), "under 2,300 mg");
});
