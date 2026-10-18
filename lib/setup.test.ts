import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_SETUP, switchUnits, validateSetup, valuesFromProfile, type SetupValues } from "./setup.ts";

const filled: SetupValues = {
  units: "us",
  heightFt: "5",
  heightIn: "10",
  heightCm: "",
  weight: "160",
  age: "34",
  sex: "male",
  activity: "moderate",
};

test("an empty form gets a message for every field", () => {
  const { profile, errors } = validateSetup(EMPTY_SETUP);
  assert.equal(profile, null);
  assert.deepEqual(Object.keys(errors).sort(), ["activity", "age", "height", "sex", "weight"]);
});

test("a filled form becomes a metric profile", () => {
  const { profile, errors } = validateSetup(filled);
  assert.deepEqual(errors, {});
  assert.ok(profile);
  assert.equal(profile.heightCm, 70 * 2.54);
  assert.ok(Math.abs(profile.weightKg - 72.57) < 0.01);
});

test("messages say what to do next", () => {
  assert.equal(validateSetup({ ...filled, weight: "about 160" }).errors.weight, "Enter your weight in pounds, like 160.");
  assert.equal(validateSetup({ ...filled, heightIn: "13" }).errors.height, "Inches should be between 0 and 11.");
  assert.equal(validateSetup({ ...filled, heightFt: "8" }).errors.height, "Enter a height between 4 ft and 7 ft 6 in.");
  assert.match(validateSetup({ ...filled, age: "17" }).errors.age!, /between 19 and 100/);
  assert.equal(validateSetup({ ...filled, age: "34.5" }).errors.age, "Enter your age in whole years, like 34.");
});

test("height limits include exactly 4 ft and 7 ft 6 in", () => {
  assert.equal(validateSetup({ ...filled, heightFt: "4", heightIn: "" }).errors.height, undefined);
  assert.equal(validateSetup({ ...filled, heightFt: "7", heightIn: "6" }).errors.height, undefined);
  assert.ok(validateSetup({ ...filled, heightFt: "7", heightIn: "7" }).errors.height);
});

test("switching units converts what was typed", () => {
  const metric = switchUnits(filled, "metric");
  assert.equal(metric.heightCm, "178");
  assert.equal(metric.weight, "72.6");
  const back = switchUnits(metric, "us");
  assert.equal(back.heightFt, "5");
  assert.equal(back.heightIn, "10");
  assert.equal(back.weight, "160");
});

test("editing round-trips a saved profile", () => {
  const { profile } = validateSetup(filled);
  const values = valuesFromProfile(profile!);
  assert.equal(values.heightFt, "5");
  assert.equal(values.heightIn, "10");
  assert.equal(values.weight, "160");
});
