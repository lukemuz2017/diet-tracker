"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AddFoodPanel } from "@/components/AddFood";
import { AmountSelect } from "@/components/FoodRow";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow, PageHeader } from "@/components/ui/Card";
import { StickerButton, type StickerTone } from "@/components/ui/Sticker";
import { CheckIcon } from "@/components/ui/icons";
import { addFood, changeServings, removeEntry, setDayComplete } from "@/lib/actions";
import { formatAmount, multipleFor, quantityFor } from "@/lib/amounts";
import { addDays, formatDay, weekdayName } from "@/lib/dates";
import { amountFor, quickPicks } from "@/lib/foods";
import { formatValue, totalsFor } from "@/lib/log";
import { NUTRIENT_GROUPS, NUTRIENTS } from "@/lib/nutrients";
import { useSavedData, type Entry, type SavedData } from "@/lib/storage";
import { maintenanceCalories } from "@/lib/targets";
import { useToday } from "@/lib/useToday";
import { INCOMPLETE_SHARE, WINDOW_DAYS } from "@/lib/week";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PICK_TONES: StickerTone[] = ["lemon", "lemon", "paper", "leaf", "kraft", "paper"];

// The Food log: pick a day (today or up to 6 days back), see its totals and
// foods on the left, and add food to it on the right. Totals have no
// targets: one day out of range (a dinner out, an event) doesn't matter;
// Last 7 days and History judge the 7-day average.
export function FoodLog() {
  const data = useSavedData();
  const today = useToday();
  const router = useRouter();
  const requested = useSearchParams().get("date");
  if (!data?.profile || !today) return <PageHeader title="Food log" />;

  const earliest = addDays(today, -(WINDOW_DAYS - 1));
  const date = requested && ISO_DATE.test(requested) && requested >= earliest && requested <= today ? requested : today;
  const select = (day: string) => router.replace(day === today ? "/log" : `/log?date=${day}`, { scroll: false });
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(today, -i));
  const yesterday = addDays(today, -1);
  const missedYesterday =
    date === today &&
    data.entries.some((entry) => entry.date < yesterday) &&
    !data.entries.some((entry) => entry.date === yesterday);

  return (
    <>
      <PageHeader
        title="Food log"
        description={`${weekdayName(date)}, ${formatDay(date).slice(5)}${date === today ? " (today)" : ""}. Forgot a day? Pick it below and fill it in.`}
      />

      <fieldset className="mb-5">
        <legend className="sr-only">Day to log</legend>
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <button
              key={day}
              type="button"
              aria-pressed={day === date}
              onClick={() => select(day)}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${
                day === date ? "bg-leaf text-white" : "border-[1.5px] border-field bg-white text-soil hover:bg-track"
              }`}
            >
              {day === today ? "Today" : day === yesterday ? "Yesterday" : formatDay(day)}
            </button>
          ))}
        </div>
      </fieldset>

      {missedYesterday && (
        <p className="mb-5 max-w-3xl rounded-2xl bg-lemon-tint px-4 py-3 text-[15px]">
          You didn’t log {weekdayName(yesterday)}.{" "}
          <button type="button" onClick={() => select(yesterday)} className="font-bold text-leaf underline underline-offset-[3px]">
            Fill it in now
          </button>
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <DaySummary data={data} date={date} today={today} />
        <AddFoodPanel data={data} date={date} today={today} />
      </div>
    </>
  );
}

function DaySummary({ data, date, today }: { data: SavedData; date: string; today: string }) {
  const entries = data.entries.filter((entry) => entry.date === date);
  const { totals, known, foods } = totalsFor(entries);
  const firstFood = data.entries.length === 1 && entries.length === 1 && !data.completeDays.includes(date);

  return (
    <div className="flex flex-col gap-5">
      {firstFood && (
        <p role="status" className="rounded-2xl bg-leaf-tint px-4 py-3 text-[15px]">
          <b>First food logged.</b> When you’re done eating for the day, mark it complete and it joins your 7-day numbers.
        </p>
      )}

      {entries.length === 0 ? (
        <EmptyDay date={date} today={today} />
      ) : (
        <>
          <Card className="flex flex-col gap-4">
            <p className="flex items-baseline gap-2">
              <span className="font-display text-[40px] font-extrabold leading-none">{formatValue(totals.calories ?? 0)}</span>
              <span className="text-lg">kcal{date === today ? " so far" : ""}</span>
            </p>
            <table className="w-full text-[15px]">
              <caption className="sr-only">Totals for {formatDay(date)}</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Nutrient</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {NUTRIENT_GROUPS.flatMap((group) => group.keys)
                  .filter((key) => key !== "calories")
                  .map((key) => (
                    <tr key={key}>
                      <th scope="row" className="py-2 pr-3 text-left font-bold">{NUTRIENTS[key].label}</th>
                      <td className="py-2 text-right tabular-nums">
                        {totals[key] === undefined ? "–" : `${formatValue(totals[key]!)} ${NUTRIENTS[key].unit}`}
                        {totals[key] !== undefined && known[key] < foods && (
                          <span className="block text-xs text-muted">from {known[key]} of {foods} foods</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
          <FoodList entries={entries} title={date === today ? "Today’s foods" : `Foods on ${formatDay(date)}`} />
        </>
      )}

      <CompleteDay data={data} date={date} today={today} calories={totals.calories ?? 0} foods={foods} />
    </div>
  );
}

function EmptyDay({ date, today }: { date: string; today: string }) {
  const when = date === today ? "today" : `on ${weekdayName(date)}`;
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-[26px] font-extrabold leading-tight">What did you eat {when}?</h2>
      <p className="text-[15px] text-muted">Tap a food to log it, or search on the right.</p>
      <div className="flex flex-wrap gap-2.5 py-1">
        {quickPicks().map((food, index) => {
          const spec = amountFor(food.id);
          const what = `${formatAmount(spec, spec.base)} of ${food.name.toLowerCase()}`;
          return (
            <StickerButton
              key={food.id}
              tone={PICK_TONES[index]}
              index={index}
              onClick={() =>
                addFood(
                  { name: food.name, foodId: food.id, perServing: food.nutrients },
                  1,
                  date,
                  date === today ? `Added ${what}` : `Added ${what} to ${formatDay(date)}`,
                )
              }
            >
              + {food.name.split(",")[0]}
            </StickerButton>
          );
        })}
      </div>
    </Card>
  );
}

function FoodList({ entries, title }: { entries: Entry[]; title: string }) {
  const ordered = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <Card>
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      <ul className="divide-y divide-line">
        {ordered.map((entry) => {
          const spec = amountFor(entry.foodId);
          return (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
              <span className="min-w-0">
                <b>{entry.name}</b>
                {entry.nutrients.calories !== undefined && (
                  <span className="text-muted"> · {formatValue(entry.nutrients.calories)} kcal</span>
                )}
              </span>
              <span className="flex items-center gap-2">
                <AmountSelect
                  id={`amount-${entry.id}`}
                  label={`Amount of ${entry.name}`}
                  spec={spec}
                  quantity={quantityFor(spec, entry.servings)}
                  onChange={(quantity) => changeServings(entry.id, multipleFor(spec, quantity))}
                />
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

function CompleteDay({
  data,
  date,
  today,
  calories,
  foods,
}: {
  data: SavedData;
  date: string;
  today: string;
  calories: number;
  foods: number;
}) {
  const marked = data.completeDays.includes(date);
  const isToday = date === today;
  const halfLogged = foods > 0 && calories < maintenanceCalories(data.profile!, today) * INCOMPLETE_SHARE;

  if (marked) {
    return (
      <Card className="flex flex-col gap-2 bg-leaf-tint">
        <p className="flex items-center gap-2 font-bold">
          <CheckIcon className="text-leaf" strokeWidth={2.5} /> Day complete
        </p>
        <p className="text-[15px]">{isToday ? "Today" : "This day"} counts toward your 7-day numbers.</p>
        <Button variant="quiet" className="self-start" onClick={() => setDayComplete(date, false)}>
          Mark as not complete
        </Button>
      </Card>
    );
  }
  if (!isToday && !halfLogged) {
    return foods > 0 ? (
      <p className="text-sm text-muted">This day counts toward your 7-day numbers.</p>
    ) : null;
  }
  return (
    <Card className="flex flex-col gap-3">
      <Eyebrow>{isToday ? "Done eating for today?" : "This day looks incomplete"}</Eyebrow>
      <p className="text-[15px]">
        {isToday
          ? "Mark the day complete and it joins your 7-day numbers. Otherwise it counts automatically at midnight."
          : "It’s under 40% of your usual calories, so it’s left out of your 7-day numbers. Add what’s missing, or mark it complete if that’s all you ate."}
      </p>
      <Button variant="secondary" className="self-start" onClick={() => setDayComplete(date, true)}>
        Mark day complete
      </Button>
    </Card>
  );
}
