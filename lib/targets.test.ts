import assert from "node:assert/strict";
import { test } from "node:test";
import type { Profile } from "./profile.ts";
import { computeTargets, formatTarget, maintenanceCalories, restingCalories } from "./targets.ts";

const TODAY = "2026-10-18";
// Aged 30 and 40 on TODAY.
const man: Profile = { units: "metric", heightCm: 175, weightKg: 70, birthDate: "1996-01-01", sex: "male", activity: "moderate" };
const woman: Profile = { units: "metric", heightCm: 165, weightKg: 60, birthDate: "1986-05-05", sex: "female", activity: "sedentary" };

test("resting calories follow Mifflin-St Jeor", () => {
  // 10×70 + 6.25×175 − 5×30 + 5
  assert.equal(restingCalories(man, TODAY), 1648.75);
  // 10×60 + 6.25×165 − 5×40 − 161
  assert.equal(restingCalories(woman, TODAY), 1270.25);
});

test("non-binary uses the midpoint of the two equations", () => {
  // Same body as `man`, sex term −78 instead of +5.
  assert.equal(restingCalories({ ...man, sex: "nonbinary" }, TODAY), 1565.75);
});

test("maintenance applies the activity factor and rounds to 10 kcal", () => {
  assert.equal(maintenanceCalories(man, TODAY), 2560); // 1648.75 × 1.55 = 2555.6
  assert.equal(maintenanceCalories(woman, TODAY), 1520); // 1270.25 × 1.2 = 1524.3
});

test("calories are a range of 10% either side", () => {
  assert.deepEqual(computeTargets(man, TODAY).calories, { kind: "range", min: 2300, max: 2820 });
});

test("age comes from the birth date and updates on the birthday", () => {
  const born = { ...man, birthDate: "1996-10-19" };
  // 29 the day before the 30th birthday, so resting calories are 5 higher.
  assert.equal(restingCalories(born, TODAY) - restingCalories(man, TODAY), 5);
});

test("fiber, added sugar and sodium scale or stay fixed as specified", () => {
  const t = computeTargets(man, TODAY);
  assert.deepEqual(t.fiber, { kind: "min", min: 36 }); // 2.56 × 14
  assert.deepEqual(t.addedSugar, { kind: "max", max: 64 }); // 10% of 2,560 / 4
  assert.deepEqual(t.sodium, { kind: "max", max: 2300 });
});

test("vitamins and minerals use the DRI for sex and age", () => {
  const t = computeTargets(woman, TODAY);
  assert.equal(t.iron.min, 18);
  assert.equal(t.calcium.min, 1000);
  assert.equal(t.potassium.min, 2600);
  assert.equal(t.vitaminA.min, 700);
  assert.equal(t.vitaminC.min, 75);

  const older = computeTargets({ ...woman, birthDate: "1971-01-01" }, TODAY); // 55
  assert.equal(older.iron.min, 8);
  assert.equal(older.calcium.min, 1200);

  assert.equal(computeTargets(man, TODAY).calcium.min, 1000);
  assert.equal(computeTargets({ ...man, birthDate: "1955-01-01" }, TODAY).calcium.min, 1200); // 71
});

test("an 18-year-old gets the 14–18 values", () => {
  const teen = computeTargets({ ...woman, birthDate: "2008-01-01" }, TODAY);
  assert.equal(teen.iron.min, 15);
  assert.equal(teen.calcium.min, 1300);
  assert.equal(teen.potassium.min, 2300);
  assert.equal(teen.vitaminC.min, 65);
});

test("non-binary gets the higher of the female and male values", () => {
  const t = computeTargets({ ...man, sex: "nonbinary" }, TODAY);
  assert.equal(t.iron.min, 18);
  assert.equal(t.potassium.min, 3400);
  assert.equal(t.vitaminA.min, 900);
  assert.equal(t.vitaminC.min, 90);
});

test("targets read naturally", () => {
  const t = computeTargets(man, TODAY);
  assert.equal(formatTarget("calories", t.calories), "2,300–2,820 kcal");
  assert.equal(formatTarget("fiber", t.fiber), "at least 36 g");
  assert.equal(formatTarget("sodium", t.sodium), "under 2,300 mg");
});
