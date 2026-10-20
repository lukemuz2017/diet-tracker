"use client";

import { useId, useState, type FormEvent } from "react";
import { AmountSelect } from "@/components/FoodRow";
import { FoodSearch, type SearchOption } from "@/components/FoodSearch";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { ChoiceField, FieldError, TextField } from "@/components/ui/Field";
import { deleteRecipe, saveRecipe } from "@/lib/actions";
import { formatAmount, multipleFor, quantityFor } from "@/lib/amounts";
import { FOODS, amountFor } from "@/lib/foods";
import { NUTRIENT_KEYS, emptyCustomFood, formatValue, scaleNutrients, validateCustomFood, type CustomFoodValues } from "@/lib/log";
import { NUTRIENTS, type NutrientKey, type Nutrients } from "@/lib/nutrients";
import { parseRecipeText, perServingFromIngredients, type Ingredient, type Recipe } from "@/lib/recipe";
import { useSavedData } from "@/lib/storage";
import { useToday } from "@/lib/useToday";

const UNIT_NAMES = { kcal: "kilocalories", g: "grams", mg: "milligrams", mcg: "micrograms" } as const;

function servingsError(text: string): string | undefined {
  const value = Number(text.trim());
  if (!/^\d+$/.test(text.trim()) || value < 1 || value > 100) return "Enter how many servings the recipe makes, like 4.";
  return undefined;
}

export function RecipesScreen() {
  const data = useSavedData();
  const today = useToday();
  const [mode, setMode] = useState<"paste" | "build">("paste");
  const [justSaved, setJustSaved] = useState<Recipe | null>(null);
  const header = (
    <PageHeader
      title="Recipes"
      description="Save a recipe once, then log it by the serving. Paste a recipe with a nutrition panel, or build one from ingredients."
    />
  );
  if (!data?.profile || !today) return header;

  return (
    <>
      {header}
      <div className="flex max-w-2xl flex-col gap-5">
        {justSaved && (
          <p role="status" className="rounded-2xl bg-leaf-tint px-4 py-3 text-[15px]">
            <b>Saved {justSaved.name}.</b> It’s now in Meals & recipes when you add food.
          </p>
        )}

        <Card className="flex flex-col gap-5">
          <ChoiceField
            name="recipe-mode"
            legend="How would you like to add it?"
            options={[
              { value: "paste", label: "Paste a recipe" },
              { value: "build", label: "Build from ingredients" },
            ]}
            value={mode}
            onChange={setMode}
          />
          {mode === "paste" ? (
            <PasteRecipe today={today} onSaved={setJustSaved} />
          ) : (
            <BuildRecipe ownFoods={data.entries.filter((entry) => !entry.foodId)} onSaved={setJustSaved} />
          )}
        </Card>

        {data.recipes.length > 0 && (
          <Card>
            <h2 className="font-display text-xl font-extrabold">Your recipes</h2>
            <ul className="divide-y divide-line">
              {data.recipes.map((recipe) => (
                <li key={recipe.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span>
                    <b>{recipe.name}</b>
                    <span className="text-muted">
                      {" "}
                      · makes {recipe.servings} · {formatValue(recipe.perServing.calories ?? 0)} kcal a serving
                    </span>
                  </span>
                  <Button variant="quiet" onClick={() => deleteRecipe(recipe.id)} aria-label={`Delete ${recipe.name}`}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
            <ButtonLink href="/log" variant="quiet" className="mt-2">
              Log a recipe on Add food
            </ButtonLink>
          </Card>
        )}
      </div>
    </>
  );
}

function PasteRecipe({ today, onSaved }: { today: string; onSaved: (recipe: Recipe) => void }) {
  const textId = useId();
  const [text, setText] = useState("");
  const [found, setFound] = useState<NutrientKey[] | null>(null);
  const [values, setValues] = useState<CustomFoodValues>(() => emptyCustomFood(today));
  const [servings, setServings] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function read() {
    const parsed = parseRecipeText(text);
    const next = emptyCustomFood(today);
    next.name = parsed.name;
    for (const key of parsed.found) next.amounts[key] = String(parsed.perServing[key]);
    setValues(next);
    setServings(parsed.servings ? String(parsed.servings) : "");
    setFound(parsed.found);
    setSubmitted(false);
  }

  const { errors, nutrients } = validateCustomFood(values, today);
  const servingsProblem = servingsError(servings);
  const shown = submitted ? errors : {};

  function save(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!nutrients || servingsProblem) {
      const first = errors.name ? "paste-name" : servingsProblem ? "paste-servings" : `paste-${NUTRIENT_KEYS.find((key) => errors[key])}`;
      document.getElementById(first)?.focus();
      return;
    }
    onSaved(saveRecipe({ name: values.name.trim(), servings: Number(servings), perServing: nutrients }));
    setText("");
    setFound(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={textId} className="text-[15px] font-bold">
          Recipe text
        </label>
        <textarea
          id={textId}
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={6}
          placeholder="Paste the recipe, including its nutrition facts"
          className="rounded-field border-[1.5px] border-field bg-white p-3 text-[15px]"
        />
      </div>
      <Button variant="secondary" className="self-start" onClick={read} disabled={!text.trim()}>
        Read recipe
      </Button>

      {found && (
        <form noValidate onSubmit={save} className="flex flex-col gap-5 border-t border-line pt-5">
          <p role="status" className={`rounded-2xl px-4 py-3 text-[15px] ${found.length ? "bg-leaf-tint" : "bg-lemon-tint"}`}>
            {found.length
              ? `Found ${found.length} of 11 values per serving. Check them against the recipe and fill in anything missing.`
              : "No nutrition panel found. Enter the values per serving from the recipe, or build it from ingredients instead."}
          </p>
          <TextField
            id="paste-name"
            label="Recipe name"
            value={values.name}
            onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
            error={shown.name}
          />
          <TextField
            id="paste-servings"
            label="Servings it makes"
            inputMode="numeric"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
            error={submitted ? servingsProblem : undefined}
          />
          <fieldset className="flex flex-col gap-4">
            <legend className="pb-1 text-[15px] font-bold">Per serving</legend>
            {NUTRIENT_KEYS.map((key) => {
              const { label, unit } = NUTRIENTS[key];
              return (
                <TextField
                  key={key}
                  id={`paste-${key}`}
                  label={key === "calories" ? label : `${label} (optional)`}
                  unit={{ short: unit, long: UNIT_NAMES[unit] }}
                  inputMode="decimal"
                  value={values.amounts[key]}
                  onChange={(event) =>
                    setValues((v) => ({ ...v, amounts: { ...v.amounts, [key]: event.target.value } }))
                  }
                  error={shown[key]}
                />
              );
            })}
          </fieldset>
          <Button type="submit" className="self-start">
            Save recipe
          </Button>
        </form>
      )}
    </div>
  );
}

function BuildRecipe({
  ownFoods,
  onSaved,
}: {
  ownFoods: { name: string; servings: number; nutrients: Nutrients }[];
  onSaved: (recipe: Recipe) => void;
}) {
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [hint, setHint] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Common foods plus foods you've added yourself (by name, per portion).
  const own = new Map(ownFoods.map((entry) => [`own:${entry.name.toLowerCase()}`, entry]));
  const choices = [
    ...FOODS.map((food) => ({ key: food.id, name: food.name, foodId: food.id as string | undefined, perBase: food.nutrients })),
    ...[...own].map(([key, entry]) => ({ key, name: entry.name, foodId: undefined, perBase: scaleNutrients(entry.nutrients, 1 / entry.servings) })),
  ];
  const options: SearchOption[] = choices.map((choice) => {
    const spec = amountFor(choice.foodId);
    return { key: choice.key, name: choice.name, detail: `${formatAmount(spec, spec.base)} · ${formatValue(choice.perBase.calories ?? 0)} kcal` };
  });

  const nameProblem = name.trim() ? undefined : "Enter a recipe name, like Chicken chili.";
  const ingredientsProblem = ingredients.length ? undefined : "Add at least one ingredient.";
  // The recipe is one serving; log half or double of it when you add it.
  const perServing = ingredients.length ? perServingFromIngredients(ingredients, 1) : null;

  function save(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (nameProblem || ingredientsProblem) {
      document.getElementById(nameProblem ? "build-name" : "build-ingredients")?.focus();
      return;
    }
    onSaved(saveRecipe({ name: name.trim(), servings: 1, perServing: perServing!, ingredients }));
    setName("");
    setIngredients([]);
    setSubmitted(false);
  }

  return (
    <form noValidate onSubmit={save} className="flex flex-col gap-5">
      <TextField
        id="build-name"
        label="Recipe name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={submitted ? nameProblem : undefined}
      />
      <div className="flex flex-col gap-3">
        <FoodSearch
          label="Add to recipe"
          options={options}
          onPick={(key) => {
            // Picking adds it at the usual amount; change the amount in the list.
            const choice = choices.find((item) => item.key === key);
            if (choice) {
              setIngredients((list) => [
                ...list,
                { name: choice.name, foodId: choice.foodId, multiple: 1, nutrients: scaleNutrients(choice.perBase, 1) },
              ]);
            }
            setHint("");
          }}
          onAddOwn={(typed) =>
            setHint(`“${typed}” isn’t in the list. Add it once as your own food on the Add food page, and it’ll show up here.`)
          }
        />
        {hint && <p className="text-[13px] text-muted">{hint}</p>}
      </div>

      <div id="build-ingredients" tabIndex={-1} className="flex flex-col gap-2">
        <h3 className="font-bold">Ingredients</h3>
        {ingredients.length === 0 ? (
          <p className="text-[15px] text-muted">Search above to add the first ingredient.</p>
        ) : (
          <ul className="divide-y divide-line">
            {ingredients.map((item, index) => {
              const spec = amountFor(item.foodId);
              return (
                <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <b className="block leading-snug">{item.name}</b>
                    <span className="text-sm text-muted">{formatValue(item.nutrients.calories ?? 0)} kcal</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <AmountSelect
                      id={`ingredient-${index}`}
                      label={`Amount of ${item.name}`}
                      spec={spec}
                      quantity={quantityFor(spec, item.multiple)}
                      onChange={(quantity) => {
                        const multiple = multipleFor(spec, quantity);
                        const base = scaleNutrients(item.nutrients, 1 / item.multiple);
                        setIngredients((list) =>
                          list.map((entry, i) => (i === index ? { ...entry, multiple, nutrients: scaleNutrients(base, multiple) } : entry)),
                        );
                      }}
                    />
                  <Button
                    variant="quiet"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => setIngredients((list) => list.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {submitted && ingredientsProblem && <FieldError id="build-ingredients-error">{ingredientsProblem}</FieldError>}
      </div>

      {perServing && (
        <p className="rounded-2xl bg-leaf-tint px-4 py-3 text-[15px]">
          <b>Whole recipe:</b> {formatValue(perServing.calories ?? 0)} kcal
          {(["protein", "carbs", "fat"] as const).map((key) =>
            perServing[key] !== undefined ? ` · ${formatValue(perServing[key]!)} g ${NUTRIENTS[key].label.toLowerCase()}` : "",
          )}
        </p>
      )}

      <Button type="submit" className="self-start">
        Save recipe
      </Button>
    </form>
  );
}
