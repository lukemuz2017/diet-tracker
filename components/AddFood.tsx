"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CustomFoodForm } from "@/components/CustomFoodForm";
import { FoodRow } from "@/components/FoodRow";
import { FoodSearch, type SearchOption } from "@/components/FoodSearch";
import { Card } from "@/components/ui/Card";
import { PlusIcon } from "@/components/ui/icons";
import { addFood } from "@/lib/actions";
import { formatAmount, quantityFor } from "@/lib/amounts";
import { formatDay } from "@/lib/dates";
import { CATEGORY_ORDER, FOODS, amountFor, categoryOf } from "@/lib/foods";
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

type Mode = "foods" | "meals";

function toOption(choice: Choice): SearchOption {
  const spec = amountFor(choice.foodId);
  const kcal = choice.perServing.calories;
  return {
    key: choice.key,
    name: choice.name,
    detail: `${formatAmount(spec, spec.base)}${kcal !== undefined ? ` · ${formatValue(kcal)} kcal` : ""}`,
  };
}

// The right side of the Food log. Closed, it's one "Add food" button; open,
// it's a search with a Foods / Meals & recipes toggle, so it stays compact.
export function AddFoodPanel({ data, date, today }: { data: SavedData; date: string; today: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("foods");
  const [picked, setPicked] = useState<string | null>(null);
  const [extra, setExtra] = useState<"browse" | "own" | null>(null);
  const [ownName, setOwnName] = useState("");
  const panelId = useId();
  const isToday = date === today;
  const dayLabel = isToday ? "today" : formatDay(date);

  function add(food: { name: string; foodId?: string; perServing: Nutrients }, multiple: number) {
    const spec = amountFor(food.foodId);
    const what = `${formatAmount(spec, quantityFor(spec, multiple))} of ${food.name.toLowerCase()}`;
    addFood(food, multiple, date, isToday ? `Added ${what}` : `Added ${what} to ${formatDay(date)}`);
    setPicked(null);
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
  const options = choices.map(toOption);
  const emptyOptions =
    mode === "foods"
      ? recentFoodKeys.map((key) => options.find((option) => option.key === key)).filter((option): option is SearchOption => Boolean(option))
      : options;
  const pickedChoice = [...foodChoices, ...mealChoices].find((choice) => choice.key === picked);

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
        setPicked(null);
      }}
      className={`min-h-11 flex-1 rounded-full px-4 text-sm font-bold ${
        mode === value ? "bg-soil text-paper" : "text-soil hover:bg-track"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Card className="flex flex-col gap-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-leaf px-6 font-display text-[17px] font-extrabold text-white hover:bg-leaf-dark"
      >
        <PlusIcon width={20} height={20} strokeWidth={2.25} className={`transition-transform ${open ? "rotate-45" : ""}`} />
        {open ? "Close" : `Add food to ${dayLabel}`}
      </button>

      <div id={panelId} hidden={!open} className="flex flex-col gap-4">
        <div role="group" aria-label="What to search" className="flex gap-1 rounded-full border-[1.5px] border-field bg-white p-1">
          {modeButton("foods", "Foods")}
          {modeButton("meals", "Meals & recipes")}
        </div>

        {open && (
          <FoodSearch
            key={mode}
            autoFocus
            label={mode === "foods" ? "Search foods" : "Search your meals and recipes"}
            placeholder={mode === "foods" ? "Try “eggs” or “rice”" : mealChoices.length ? "Type a name, or pick one below" : "No saved meals yet"}
            options={options}
            emptyOptions={emptyOptions}
            onPick={setPicked}
            onAddOwn={addOwn}
          />
        )}

        {pickedChoice && (
          <div className="rounded-field border-[1.5px] border-leaf px-3">
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">Add to {dayLabel}</span>
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
                      onAdd={(multiple) => add({ name: food.name, foodId: food.id, perServing: food.nutrients }, multiple)}
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
                add({ name, perServing: nutrients }, 1);
                setExtra(null);
              }}
            />
          </section>
        )}
      </div>
    </Card>
  );
}
