"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CustomFoodForm } from "@/components/CustomFoodForm";
import { AmountSelect, FoodRow } from "@/components/FoodRow";
import { FoodSearch, type SearchOption } from "@/components/FoodSearch";
import { Button } from "@/components/ui/Button";
import { addFoods } from "@/lib/actions";
import { formatAmount, multipleFor, quantityFor } from "@/lib/amounts";
import { formatDay } from "@/lib/dates";
import { CATEGORY_ORDER, FOODS, amountFor, categoryOf } from "@/lib/foods";
import { formatValue, recentFoods } from "@/lib/log";
import { MEALS, type Meal } from "@/lib/meals";
import type { Nutrients } from "@/lib/nutrients";
import { warningsFor } from "@/lib/diet";
import { dietOf, type Diet } from "@/lib/profile";
import type { SavedData } from "@/lib/storage";

interface Choice {
  key: string;
  name: string;
  foodId?: string;
  perServing: Nutrients;
  multiple: number;
}

type Mode = "foods" | "meals";

/** A food picked but not added yet. */
interface Staged {
  uid: string;
  name: string;
  foodId?: string;
  perServing: Nutrients;
  multiple: number;
}

function toOption(choice: Choice, diet: Diet): SearchOption {
  const spec = amountFor(choice.foodId);
  const kcal = choice.perServing.calories;
  const warning = warningsFor(choice.foodId, diet).join(" · ");
  return {
    key: choice.key,
    name: choice.name,
    detail: `${formatAmount(spec, spec.base)}${kcal !== undefined ? ` · ${formatValue(kcal)} kcal` : ""}`,
    warning: warning || undefined,
  };
}

// Adding food to one meal: a search with a Foods / Meals & recipes toggle,
// plus links to browse all foods, add your own, or make a recipe. Picking a
// food puts it on a "To add" list (amounts can be changed there); one button
// adds the whole list to the meal. The page's "+ Add food" button opens it.
export function AddFoodPanel({
  data,
  date,
  meal,
  today,
  onDone,
}: {
  data: SavedData;
  date: string;
  meal: Meal;
  today: string;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>("foods");
  const [staged, setStaged] = useState<Staged[]>([]);
  const counter = useRef(0);
  const [extra, setExtra] = useState<"browse" | "own" | null>(null);
  const [ownName, setOwnName] = useState("");
  const isToday = date === today;
  const dayLabel = isToday ? "today" : formatDay(date);
  const diet = dietOf(data.profile!);

  const mealName = MEALS.find((item) => item.value === meal)!.label.toLowerCase();

  function stage(food: { name: string; foodId?: string; perServing: Nutrients }, multiple: number) {
    counter.current += 1;
    setStaged((list) => [...list, { uid: `staged-${counter.current}`, ...food, multiple }]);
  }

  function commit() {
    if (staged.length === 0) {
      onDone();
      return;
    }
    const where = `${isToday ? "" : `${formatDay(date)} `}${mealName}`;
    const [only] = staged;
    const spec = amountFor(only.foodId);
    const message =
      staged.length === 1
        ? `Added ${formatAmount(spec, quantityFor(spec, only.multiple))} of ${only.name.toLowerCase()} to ${where}`
        : `Added ${staged.length} foods to ${where}`;
    addFoods(
      staged.map((item) => ({ food: item, servings: item.multiple })),
      date,
      meal,
      message,
    );
    onDone();
  }

  const recent = recentFoods(data.entries, 100);
  const lastMultiple = (foodId: string) => recent.find((item) => item.foodId === foodId)?.lastServings ?? 1;

  // Foods: the common list, with the ones you've logged before first.
  const foodChoices: Choice[] = FOODS.map((food) => ({
    key: food.id,
    name: food.name,
    foodId: food.id,
    perServing: food.nutrients,
    multiple: lastMultiple(food.id),
  }));
  const recentFoodKeys = recent.filter((item) => item.foodId && !item.foodId.startsWith("recipe:")).map((item) => item.foodId!);

  // Meals & recipes: saved recipes plus foods you've added yourself, newest first.
  const mealChoices: Choice[] = [
    ...data.recipes
      .slice()
      .reverse()
      .map((recipe) => ({
        key: `recipe:${recipe.id}`,
        name: recipe.name,
        foodId: `recipe:${recipe.id}`,
        perServing: recipe.perServing,
        multiple: 1,
      })),
    ...recent
      .filter((item) => !item.foodId)
      .map((item) => ({ key: item.key, name: item.name, perServing: item.perServing, multiple: item.lastServings })),
  ];

  const choices = mode === "foods" ? foodChoices : mealChoices;
  const options = choices.map((choice) => toOption(choice, diet));
  const emptyOptions =
    mode === "foods"
      ? recentFoodKeys.map((key) => options.find((option) => option.key === key)).filter((option): option is SearchOption => Boolean(option))
      : options;
  const allChoices = [...foodChoices, ...mealChoices];
  const totalKcal = staged.reduce((sum, item) => sum + (item.perServing.calories ?? 0) * item.multiple, 0);

  function addOwn(name: string) {
    setOwnName(name);
    setExtra("own");
    requestAnimationFrame(() => document.getElementById("custom-calories")?.focus());
  }

  const modeButton = (value: Mode, label: string) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => {
        setMode(value);
      }}
      className={`min-h-11 flex-1 rounded-full px-4 text-sm font-bold ${
        mode === value ? "bg-soil text-paper" : "text-soil hover:bg-track"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
        <div role="group" aria-label="What to search" className="flex gap-1 rounded-full border-[1.5px] border-field bg-white p-1">
          {modeButton("foods", "Foods")}
          {modeButton("meals", "Meals & recipes")}
        </div>

        <FoodSearch
            key={mode}
            autoFocus
            label={mode === "foods" ? "Search foods" : "Search your meals and recipes"}
            placeholder={mode === "foods" ? "Try “eggs” or “rice”" : mealChoices.length ? "Type a name, or pick one below" : "No saved meals yet"}
            options={options}
            emptyOptions={emptyOptions}
            onPick={(key) => {
              const choice = allChoices.find((item) => item.key === key);
              if (choice) stage(choice, choice.multiple);
            }}
            onAddOwn={addOwn}
          />

        {staged.length > 0 && (
          <section aria-label="Foods to add" className="rounded-field border-[1.5px] border-leaf px-3 pb-1 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">
              To add to {mealName} · {dayLabel} · {formatValue(totalKcal)} kcal
            </h3>
            <ul className="divide-y divide-line">
              {staged.map((item) => {
                const spec = amountFor(item.foodId);
                const warnings = warningsFor(item.foodId, diet);
                return (
                  <li key={item.uid} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
                    <span className="min-w-0">
                      <b className="block leading-snug">{item.name}</b>
                      <span className="text-sm text-muted">{formatValue((item.perServing.calories ?? 0) * item.multiple)} kcal</span>
                      {warnings.map((warning) => (
                        <span key={warning} className="ml-2 rounded-full bg-carrot/25 px-2 py-0.5 text-xs font-bold">
                          {warning}
                        </span>
                      ))}
                    </span>
                    <span className="flex items-center gap-2">
                      <AmountSelect
                        id={`${item.uid}-amount`}
                        label={`Amount of ${item.name}`}
                        spec={spec}
                        quantity={quantityFor(spec, item.multiple)}
                        onChange={(quantity) =>
                          setStaged((list) =>
                            list.map((entry) => (entry.uid === item.uid ? { ...entry, multiple: multipleFor(spec, quantity) } : entry)),
                          )
                        }
                      />
                      <Button
                        variant="quiet"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => setStaged((list) => list.filter((entry) => entry.uid !== item.uid))}
                      >
                        Remove
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
          <button
            type="button"
            aria-expanded={extra === "browse"}
            onClick={() => setExtra(extra === "browse" ? null : "browse")}
            className="text-leaf underline underline-offset-[3px]"
          >
            Browse all foods
          </button>
          <button
            type="button"
            aria-expanded={extra === "own"}
            onClick={() => setExtra(extra === "own" ? null : "own")}
            className="text-leaf underline underline-offset-[3px]"
          >
            Add your own food
          </button>
          <Link href="/recipes" className="text-leaf underline underline-offset-[3px]">
            New recipe
          </Link>
        </div>

        {extra === "browse" &&
          CATEGORY_ORDER.map((category) => {
            const foods = FOODS.filter((food) => categoryOf(food) === category);
            if (foods.length === 0) return null;
            return (
              <section key={category}>
                <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">{category}</h3>
                <ul className="divide-y divide-line">
                  {foods.map((food) => (
                    <FoodRow
                      key={food.id}
                      name={food.name}
                      spec={amountFor(food.id)}
                      perBase={food.nutrients}
                      defaultMultiple={lastMultiple(food.id)}
                      warnings={warningsFor(food.id, diet)}
                      actionLabel="Select"
                      onAdd={(multiple) => stage({ name: food.name, foodId: food.id, perServing: food.nutrients }, multiple)}
                    />
                  ))}
                </ul>
              </section>
            );
          })}

        {extra === "own" && (
          <section className="flex flex-col gap-2 border-t border-line pt-4">
            <h3 className="font-display text-lg font-extrabold">Add your own food</h3>
            <p className="pb-2 text-[15px] text-muted">
              Enter the numbers for one portion of what you ate. Only the name and calories are required.
            </p>
            <CustomFoodForm
              key={ownName}
              initialName={ownName}
              date={date}
              today={today}
              onAdd={(name, nutrients) => {
                stage({ name, perServing: nutrients }, 1);
                setExtra(null);
              }}
            />
          </section>
        )}

        <Button className="self-end" onClick={commit}>
          {staged.length === 0 ? "Done" : `Add ${staged.length} ${staged.length === 1 ? "food" : "foods"} to ${mealName}`}
        </Button>
    </div>
  );
}
