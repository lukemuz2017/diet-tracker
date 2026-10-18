import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRecipeText, perServingFromIngredients } from "./recipe.ts";

test("reads a typical nutrition panel", () => {
  const text = `Weeknight Chicken Chili
Prep 15 min · Cook 30 min
Servings: 6

Ingredients
1 lb chicken breast
2 cans black beans

Nutrition (per serving)
Calories: 412kcal | Carbohydrates: 38g | Protein: 36g | Fat: 12g | Saturated Fat: 3g | Sodium: 780mg | Potassium: 950mg | Fiber: 11g | Vitamin A: 820IU | Vitamin C: 14mg | Calcium: 95mg | Iron: 4mg`;
  const parsed = parseRecipeText(text);
  assert.equal(parsed.name, "Weeknight Chicken Chili");
  assert.equal(parsed.servings, 6);
  assert.deepEqual(parsed.perServing, {
    calories: 412,
    protein: 36,
    carbs: 38,
    fat: 12, // not the saturated fat
    fiber: 11,
    sodium: 780,
    potassium: 950,
    calcium: 95,
    iron: 4,
    vitaminC: 14,
    // Vitamin A in IU can't be converted reliably, so it's left out.
  });
});

test("reads amounts written before the label, and percent Daily Values", () => {
  const parsed = parseRecipeText("Makes 4 servings. Per serving: 350 calories, 22g protein, 9 g fat, 40g carbs. Calcium 20%, Iron 10%");
  assert.equal(parsed.servings, 4);
  assert.equal(parsed.perServing.calories, 350);
  assert.equal(parsed.perServing.protein, 22);
  assert.equal(parsed.perServing.fat, 9);
  assert.equal(parsed.perServing.carbs, 40);
  assert.equal(parsed.perServing.calcium, 260); // 20% of 1,300 mg
  assert.equal(parsed.perServing.iron, 1.8); // 10% of 18 mg
});

test("finds nothing it can't see", () => {
  const parsed = parseRecipeText("Grandma's soup\nA family favorite.");
  assert.equal(parsed.servings, undefined);
  assert.deepEqual(parsed.found, []);
});

test("ingredients add up and divide by servings", () => {
  const per = perServingFromIngredients(
    [
      { name: "Rice", multiple: 2, nutrients: { calories: 496, protein: 11 } },
      { name: "Beans", multiple: 2, nutrients: { calories: 228, protein: 15.2, fiber: 15 } },
    ],
    4,
  );
  assert.equal(per.calories, 181);
  assert.equal(per.protein, 6.55);
  assert.equal(per.fiber, undefined); // rice has no fiber value here, so it's unknown
});
