"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CustomFoodForm } from "@/components/CustomFoodForm";
import { FoodRow } from "@/components/FoodRow";
import { FoodSearch, type SearchOption } from "@/components/FoodSearch";
import { Card, PageHeader } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { addFood } from "@/lib/actions";
import { formatDay } from "@/lib/dates";
import { formatAmount, quantityFor } from "@/lib/amounts";
import { CATEGORY_ORDER, FOODS, amountFor, categoryOf, type Food } from "@/lib/foods";
import { formatValue, recentFoods } from "@/lib/log";
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
  const [picked, setPicked] = useState<string | null>(null);
  const [ownName, setOwnName] = useState("");

  const dateError = !ISO_DATE.test(date)
    ? "Choose the day you ate this."
    : date > today
      ? "Choose today or an earlier day."
      : undefined;
  const isToday = date === today;

  function add(food: { name: string; foodId?: string; perServing: Nutrients }, multiple: number) {
    if (dateError) {
      document.getElementById("log-date")?.focus();
      return;
    }
    const spec = amountFor(food.foodId);
    const what = `${formatAmount(spec, quantityFor(spec, multiple))} of ${food.name.toLowerCase()}`;
    addFood(food, multiple, date, isToday ? `Added ${what}` : `Added ${what} to ${formatDay(date)}`);
    if (isToday) router.push("/today");
  }

  const recent = recentFoods(entries);
  const lastMultiple = (food: Food) =>
    recentFoods(entries, 100).find((item) => item.foodId === food.id)?.lastServings ?? 1;

  // Search covers recent foods (including your own) first, then the common list.
  type Choice = { key: string; name: string; foodId?: string; perServing: Nutrients; multiple: number };
  const choices: Choice[] = [
    ...recent.map((food) => ({ key: food.key, name: food.name, foodId: food.foodId, perServing: food.perServing, multiple: food.lastServings })),
    ...FOODS.filter((food) => !recent.some((item) => item.foodId === food.id)).map((food) => ({
      key: food.id,
      name: food.name,
      foodId: food.id,
      perServing: food.nutrients,
      multiple: lastMultiple(food),
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
      document.getElementById("custom")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("custom-calories")?.focus({ preventScroll: true });
    });
  }

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
        <FoodSearch options={options} onPick={setPicked} onAddOwn={addOwn} />
        <a href="#custom" className="self-start text-sm font-bold text-leaf underline underline-offset-[3px]">
          Can’t find it? Add your own food
        </a>
      </Card>

      {pickedChoice && (
        <Card className="border-[1.5px] border-leaf">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-extrabold">Add this food</h2>
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
        </Card>
      )}

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

      {CATEGORY_ORDER.map((category) => {
        const foods = FOODS.filter((food) => categoryOf(food) === category);
        if (foods.length === 0) return null;
        return (
          <Card key={category}>
            <h2 className="font-display text-xl font-extrabold">{category}</h2>
            <ul className="divide-y divide-line">
              {foods.map((food) => (
                <FoodRow
                  key={food.id}
                  name={food.name}
                  spec={amountFor(food.id)}
                  perBase={food.nutrients}
                  defaultMultiple={lastMultiple(food)}
                  onAdd={(multiple) => add({ name: food.name, foodId: food.id, perServing: food.nutrients }, multiple)}
                />
              ))}
            </ul>
          </Card>
        );
      })}

      <Card id="custom" className="scroll-mt-6">
        <h2 className="pb-1 font-display text-xl font-extrabold">Add your own food</h2>
        <p className="pb-4 text-[15px] text-muted">
          Enter the numbers for one portion of what you ate. Only the name and calories are required.
        </p>
        <CustomFoodForm
          key={ownName}
          initialName={ownName}
          date={date}
          today={today}
          onAdd={(name, nutrients) => add({ name, perServing: nutrients }, 1)}
        />
      </Card>
    </div>
  );
}
