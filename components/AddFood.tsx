"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CustomFoodForm } from "@/components/CustomFoodForm";
import { FoodRow } from "@/components/FoodRow";
import { Card, PageHeader } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { addFood } from "@/lib/actions";
import { formatDay } from "@/lib/dates";
import { CATEGORY_ORDER, FOODS, categoryOf, type Food } from "@/lib/foods";
import { recentFoods } from "@/lib/log";
import type { Nutrients } from "@/lib/nutrients";
import { useSavedData } from "@/lib/storage";
import { useToday } from "@/lib/useToday";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function AddFoodScreen() {
  const data = useSavedData();
  const today = useToday();
  const header = <PageHeader title="Add food" description="Pick a food to log it, or add your own." />;
  if (!data?.profile || !today) return header;
  return (
    <>
      {header}
      <AddFood today={today} entries={data.entries} />
    </>
  );
}

function AddFood({ today, entries }: { today: string; entries: Parameters<typeof recentFoods>[0] }) {
  const router = useRouter();
  // ?date= comes from the missed-day nudge; anything odd falls back to today.
  const requested = useSearchParams().get("date");
  const [date, setDate] = useState(requested && ISO_DATE.test(requested) && requested <= today ? requested : today);
  const [query, setQuery] = useState("");

  const dateError = !ISO_DATE.test(date)
    ? "Choose the day you ate this."
    : date > today
      ? "Choose today or an earlier day."
      : undefined;
  const isToday = date === today;

  function add(food: { name: string; foodId?: string; perServing: Nutrients }, servings: number) {
    if (dateError) {
      document.getElementById("log-date")?.focus();
      return;
    }
    const name = food.name.toLowerCase();
    addFood(food, servings, date, isToday ? `Added ${name}` : `Added ${name} to ${formatDay(date)}`);
    if (isToday) router.push("/today");
  }

  const search = query.trim().toLowerCase();
  const matches = (name: string) => name.toLowerCase().includes(search);
  const recent = recentFoods(entries).filter((food) => matches(food.name));
  const common = FOODS.filter((food) => matches(food.name));
  const lastServings = (food: Food) =>
    recentFoods(entries, 100).find((item) => item.foodId === food.id)?.lastServings ?? 1;

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <TextField
          id="log-date"
          type="date"
          label="Day"
          hint={isToday ? "Today. Pick an earlier day to catch up." : `Catching up on ${formatDay(date)}.`}
          max={today}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          error={dateError}
        />
        <TextField
          id="food-search"
          type="search"
          label="Search foods"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <a href="#custom" className="self-start text-sm font-bold text-leaf underline underline-offset-[3px]">
          Can’t find it? Add your own food
        </a>
      </Card>

      {recent.length > 0 && (
        <Card>
          <h2 className="font-display text-xl font-extrabold">Recent</h2>
          <ul className="divide-y divide-line">
            {recent.map((food) => (
              <FoodRow
                key={food.key}
                name={food.name}
                perServing={food.perServing}
                defaultServings={food.lastServings}
                onAdd={(servings) => add(food, servings)}
              />
            ))}
          </ul>
        </Card>
      )}

      {CATEGORY_ORDER.map((category) => {
        const foods = common.filter((food) => categoryOf(food) === category);
        if (foods.length === 0) return null;
        return (
          <Card key={category}>
            <h2 className="font-display text-xl font-extrabold">{category}</h2>
            <ul className="divide-y divide-line">
              {foods.map((food) => (
                <FoodRow
                  key={food.id}
                  name={food.name}
                  serving={food.serving}
                  perServing={food.nutrients}
                  defaultServings={lastServings(food)}
                  onAdd={(servings) => add({ name: food.name, foodId: food.id, perServing: food.nutrients }, servings)}
                />
              ))}
            </ul>
          </Card>
        );
      })}

      {search && recent.length === 0 && common.length === 0 && (
        <Card>
          <p>
            No foods match “{query.trim()}”. <a href="#custom" className="font-bold text-leaf underline">Add it as your own food</a>.
          </p>
        </Card>
      )}

      <Card id="custom" className="scroll-mt-6">
        <h2 className="pb-1 font-display text-xl font-extrabold">Add your own food</h2>
        <p className="pb-4 text-[15px] text-muted">
          Use the numbers for what you ate. Only the name and calories are required.
        </p>
        <CustomFoodForm
          date={date}
          today={today}
          onAdd={(name, nutrients) => add({ name, perServing: nutrients }, 1)}
        />
      </Card>
    </div>
  );
}
