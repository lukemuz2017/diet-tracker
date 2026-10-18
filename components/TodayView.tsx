"use client";

import { NutrientBar } from "@/components/NutrientBar";
import { SERVING_CHOICES } from "@/components/FoodRow";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, Eyebrow, PageHeader } from "@/components/ui/Card";
import { StickerButton, type StickerTone } from "@/components/ui/Sticker";
import { CheckIcon } from "@/components/ui/icons";
import { addFood, changeServings, removeEntry, setDayComplete } from "@/lib/actions";
import { formatDay } from "@/lib/dates";
import { quickPicks } from "@/lib/foods";
import { formatValue, totalsFor } from "@/lib/log";
import type { NutrientKey } from "@/lib/nutrients";
import { useSavedData, type Entry } from "@/lib/storage";
import { computeTargets } from "@/lib/targets";
import { useToday } from "@/lib/useToday";

const DAILY_BARS: NutrientKey[] = ["protein", "carbs", "fat", "fiber", "addedSugar", "sodium"];
const WEEKLY_BARS: NutrientKey[] = ["potassium", "calcium", "iron", "vitaminA", "vitaminC"];
const PICK_TONES: StickerTone[] = ["lemon", "lemon", "paper", "leaf", "kraft", "paper"];

export function TodayView() {
  const data = useSavedData();
  const today = useToday();
  if (!data?.profile || !today) return <PageHeader title="Today" />;

  const targets = computeTargets(data.profile, today);
  const entries = data.entries.filter((entry) => entry.date === today);
  const { totals, known, foods } = totalsFor(entries);
  const complete = data.completeDays.includes(today);
  const firstFood = data.entries.length === 1 && entries.length === 1 && !complete;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Today" description={formatDay(today)} />
        <ButtonLink href="/log" className="mb-6">
          Add food
        </ButtonLink>
      </div>

      {firstFood && (
        <p role="status" className="mb-5 max-w-3xl rounded-2xl bg-leaf-tint px-4 py-3 text-[15px]">
          <b>First food logged.</b> When you’re done eating for the day, mark it complete and it joins your 7-day
          numbers.
        </p>
      )}

      {entries.length === 0 ? (
        <EmptyToday today={today} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Card className="flex flex-col gap-4">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-[40px] font-extrabold leading-none">
                  {formatValue(totals.calories ?? 0)}
                </span>
                <span className="text-lg">kcal so far</span>
              </p>
              <NutrientBar nutrient="calories" target={targets.calories} value={totals.calories} known={known.calories} foods={foods} />
            </Card>

            <Card className="flex flex-col gap-5">
              <h2 className="font-display text-xl font-extrabold">Today so far</h2>
              {DAILY_BARS.map((key) => (
                <NutrientBar key={key} nutrient={key} target={targets[key]} value={totals[key]} known={known[key]} foods={foods} />
              ))}
            </Card>

            <Card>
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between font-display text-xl font-extrabold">
                  Vitamins and minerals
                  <span className="font-sans text-sm font-bold text-leaf group-open:hidden">Show</span>
                  <span className="hidden font-sans text-sm font-bold text-leaf group-open:inline">Hide</span>
                </summary>
                <p className="pb-4 pt-1 text-sm text-muted">
                  These vary a lot from day to day, so your 7-day average matters more than today.
                </p>
                <div className="flex flex-col gap-5">
                  {WEEKLY_BARS.map((key) => (
                    <NutrientBar key={key} nutrient={key} target={targets[key]} value={totals[key]} known={known[key]} foods={foods} />
                  ))}
                </div>
              </details>
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            <FoodList entries={entries} />
            <CompleteDay today={today} complete={complete} />
          </div>
        </div>
      )}
    </>
  );
}

function EmptyToday({ today }: { today: string }) {
  return (
    <Card className="flex max-w-xl flex-col gap-3">
      <h2 className="font-display text-[26px] font-extrabold leading-tight">What did you eat today?</h2>
      <p className="text-[15px] text-muted">Tap a food to log one serving.</p>
      <div className="flex flex-wrap gap-2.5 py-1">
        {quickPicks().map((food, index) => (
          <StickerButton
            key={food.id}
            tone={PICK_TONES[index]}
            index={index}
            onClick={() =>
              addFood({ name: food.name, foodId: food.id, perServing: food.nutrients }, 1, today, `Added ${food.name.toLowerCase()}`)
            }
          >
            + {food.name.split(",")[0]}
          </StickerButton>
        ))}
      </div>
      <ButtonLink href="/log" variant="quiet" className="self-start">
        Search all foods or add your own
      </ButtonLink>
    </Card>
  );
}

function FoodList({ entries }: { entries: Entry[] }) {
  const ordered = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <Card>
      <h2 className="font-display text-xl font-extrabold">Today’s foods</h2>
      <ul className="divide-y divide-line">
        {ordered.map((entry) => {
          const choices = SERVING_CHOICES.includes(entry.servings)
            ? SERVING_CHOICES
            : [...SERVING_CHOICES, entry.servings].sort((a, b) => a - b);
          return (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
              <span className="min-w-0">
                <b>{entry.name}</b>
                {entry.nutrients.calories !== undefined && (
                  <span className="text-muted"> · {formatValue(entry.nutrients.calories)} kcal</span>
                )}
              </span>
              <span className="flex items-center gap-2">
                <label htmlFor={`servings-${entry.id}`} className="sr-only">
                  Servings of {entry.name}
                </label>
                <select
                  id={`servings-${entry.id}`}
                  value={entry.servings}
                  onChange={(event) => changeServings(entry.id, Number(event.target.value))}
                  className="h-11 rounded-field border-[1.5px] border-field bg-white px-2 text-[15px]"
                >
                  {choices.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice} {choice === 1 ? "serving" : "servings"}
                    </option>
                  ))}
                </select>
                <Button variant="quiet" onClick={() => removeEntry(entry.id)} aria-label={`Remove ${entry.name}`}>
                  Remove
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function CompleteDay({ today, complete }: { today: string; complete: boolean }) {
  return complete ? (
    <Card className="flex flex-col gap-2 bg-leaf-tint">
      <p className="flex items-center gap-2 font-bold">
        <CheckIcon className="text-leaf" strokeWidth={2.5} /> Day complete
      </p>
      <p className="text-[15px]">Today now counts toward your 7-day numbers.</p>
      <Button variant="quiet" className="self-start" onClick={() => setDayComplete(today, false)}>
        Mark as not complete
      </Button>
    </Card>
  ) : (
    <Card className="flex flex-col gap-3">
      <Eyebrow>Done eating for today?</Eyebrow>
      <p className="text-[15px]">
        Mark the day complete and it joins your 7-day numbers. Otherwise it counts automatically at midnight.
      </p>
      <Button variant="secondary" className="self-start" onClick={() => setDayComplete(today, true)}>
        Mark day complete
      </Button>
    </Card>
  );
}
