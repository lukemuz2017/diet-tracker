"use client";

import Link from "next/link";
import { useState } from "react";
import { CustomFoodForm } from "@/components/CustomFoodForm";
import { FoodRow } from "@/components/FoodRow";
import { FoodSearch, type SearchOption } from "@/components/FoodSearch";
import { Card } from "@/components/ui/Card";
import { addFood } from "@/lib/actions";
import { formatAmount, quantityFor } from "@/lib/amounts";
import { formatDay } from "@/lib/dates";
import { CATEGORY_ORDER, FOODS, RECIPE_SERVINGS, amountFor, categoryOf } from "@/lib/foods";
import { formatValue, recentFoods } from "@/lib/log";
import type { Nutrients } from "@/lib/nutrients";
import type { SavedData } from "@/lib/storage";

interface Choice {
  key: string;
  name: string;
  foodId?: string;
  perServing: Nutrients;
  multiple: number;
}

// The right side of the Food log: everything for adding food to the chosen day.
export function AddFoodPanel({ data, date, today }: { data: SavedData; date: string; today: string }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [ownName, setOwnName] = useState("");
  const isToday = date === today;

  function add(food: { name: string; foodId?: string; perServing: Nutrients }, multiple: number) {
    const spec = amountFor(food.foodId);
    const what = `${formatAmount(spec, quantityFor(spec, multiple))} of ${food.name.toLowerCase()}`;
    addFood(food, multiple, date, isToday ? `Added ${what}` : `Added ${what} to ${formatDay(date)}`);
    setPicked(null);
  }

  const recent = recentFoods(data.entries);
  const lastMultiple = (foodId: string) => recentFoods(data.entries, 100).find((item) => item.foodId === foodId)?.lastServings ?? 1;
  const recipeChoices: Choice[] = data.recipes.map((recipe) => ({
    key: `recipe:${recipe.id}`,
    name: recipe.name,
    foodId: `recipe:${recipe.id}`,
    perServing: recipe.perServing,
    multiple: 1,
  }));

  // Search covers recent foods first, then your recipes, then the common list.
  const choices: Choice[] = [
    ...recent.map((food) => ({ key: food.key, name: food.name, foodId: food.foodId, perServing: food.perServing, multiple: food.lastServings })),
    ...recipeChoices.filter((choice) => !recent.some((item) => item.foodId === choice.foodId)),
    ...FOODS.filter((food) => !recent.some((item) => item.foodId === food.id)).map((food) => ({
      key: food.id,
      name: food.name,
      foodId: food.id,
      perServing: food.nutrients,
      multiple: lastMultiple(food.id),
    })),
  ];
  const options: SearchOption[] = choices.map((choice) => {
    const spec = amountFor(choice.foodId);
    const kcal = choice.perServing.calories;
    return {
      key: choice.key,
      name: choice.name,
      detail: `${formatAmount(spec, spec.base)}${kcal !== undefined ? ` · ${formatValue(kcal)} kcal` : ""}`,
    };
  });
  const pickedChoice = choices.find((choice) => choice.key === picked);

  function addOwn(name: string) {
    setOwnName(name);
    requestAnimationFrame(() => {
      const custom = document.getElementById("custom") as HTMLDetailsElement | null;
      if (custom) custom.open = true;
      custom?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("custom-calories")?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-extrabold">Add food to {isToday ? "today" : formatDay(date)}</h2>
        <FoodSearch options={options} onPick={setPicked} onAddOwn={addOwn} />
        {pickedChoice && (
          <div className="rounded-field border-[1.5px] border-leaf px-3">
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">Add this food</span>
              <button type="button" onClick={() => setPicked(null)} className="text-sm font-bold text-leaf underline underline-offset-[3px]">
                Clear
              </button>
            </div>
            <ul>
              <FoodRow
                key={pickedChoice.key}
                name={pickedChoice.name}
                spec={amountFor(pickedChoice.foodId)}
                perBase={pickedChoice.perServing}
                defaultMultiple={pickedChoice.multiple}
                onAdd={(multiple) => add(pickedChoice, multiple)}
              />
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold">Your recipes</h2>
          <Link href="/recipes" className="text-sm font-bold text-leaf underline underline-offset-[3px]">
            Add a recipe
          </Link>
        </div>
        {recipeChoices.length === 0 ? (
          <p className="pt-2 text-[15px] text-muted">Paste a recipe or build one from ingredients, then log it by the serving.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recipeChoices.map((choice) => (
              <FoodRow
                key={choice.key}
                name={choice.name}
                spec={RECIPE_SERVINGS}
                perBase={choice.perServing}
                onAdd={(multiple) => add(choice, multiple)}
              />
            ))}
          </ul>
        )}
      </Card>

      {recent.length > 0 && (
        <Card>
          <h2 className="font-display text-xl font-extrabold">Recent</h2>
          <ul className="divide-y divide-line">
            {recent.map((food) => (
              <FoodRow
                key={food.key}
                name={food.name}
                spec={amountFor(food.foodId)}
                perBase={food.perServing}
                defaultMultiple={food.lastServings}
                onAdd={(multiple) => add(food, multiple)}
              />
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between font-display text-xl font-extrabold">
            Browse common foods
            <span className="font-sans text-sm font-bold text-leaf group-open:hidden">Show</span>
            <span className="hidden font-sans text-sm font-bold text-leaf group-open:inline">Hide</span>
          </summary>
          {CATEGORY_ORDER.map((category) => {
            const foods = FOODS.filter((food) => categoryOf(food) === category);
            if (foods.length === 0) return null;
            return (
              <section key={category} className="pt-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">{category}</h3>
                <ul className="divide-y divide-line">
                  {foods.map((food) => (
                    <FoodRow
                      key={food.id}
                      name={food.name}
                      spec={amountFor(food.id)}
                      perBase={food.nutrients}
                      defaultMultiple={lastMultiple(food.id)}
                      onAdd={(multiple) => add({ name: food.name, foodId: food.id, perServing: food.nutrients }, multiple)}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </details>
      </Card>

      <Card>
        <details id="custom" className="group scroll-mt-6">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between font-display text-xl font-extrabold">
            Add your own food
            <span className="font-sans text-sm font-bold text-leaf group-open:hidden">Show</span>
            <span className="hidden font-sans text-sm font-bold text-leaf group-open:inline">Hide</span>
          </summary>
          <p className="pb-4 pt-1 text-[15px] text-muted">
            Enter the numbers for one portion of what you ate. Only the name and calories are required.
          </p>
          <CustomFoodForm
            key={ownName}
            initialName={ownName}
            date={date}
            today={today}
            onAdd={(name, nutrients) => add({ name, perServing: nutrients }, 1)}
          />
        </details>
      </Card>
    </div>
  );
}
