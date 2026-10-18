"use client";

import Link from "next/link";
import { AmountSelect } from "@/components/FoodRow";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, Eyebrow, PageHeader } from "@/components/ui/Card";
import { StickerButton, type StickerTone } from "@/components/ui/Sticker";
import { CheckIcon } from "@/components/ui/icons";
import { addFood, changeServings, removeEntry, setDayComplete } from "@/lib/actions";
import { formatAmount, multipleFor, quantityFor } from "@/lib/amounts";
import { addDays, formatDay, weekdayName } from "@/lib/dates";
import { amountFor, quickPicks } from "@/lib/foods";
import { formatValue, totalsFor } from "@/lib/log";
import { NUTRIENT_GROUPS, NUTRIENTS } from "@/lib/nutrients";
import { useSavedData, type Entry } from "@/lib/storage";
import { useToday } from "@/lib/useToday";

const PICK_TONES: StickerTone[] = ["lemon", "lemon", "paper", "leaf", "kraft", "paper"];

// Today shows plain totals, with no targets: one day out of range (a dinner
// out, an event) doesn't matter. Ranges and judgments live on Last 7 days and
// History, because the 7-day average is what counts.
export function TodayView() {
  const data = useSavedData();
  const today = useToday();
  if (!data?.profile || !today) return <PageHeader title="Today" />;

  const entries = data.entries.filter((entry) => entry.date === today);
  const { totals, known, foods } = totalsFor(entries);
  const complete = data.completeDays.includes(today);
  const firstFood = data.entries.length === 1 && entries.length === 1 && !complete;
  const yesterday = addDays(today, -1);
  const missedYesterday =
    data.entries.some((entry) => entry.date < yesterday) && !data.entries.some((entry) => entry.date === yesterday);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Today" description={formatDay(today)} />
        <ButtonLink href="/log" className="mb-6">
          Add food
        </ButtonLink>
      </div>

      {missedYesterday && (
        <p className="mb-5 max-w-3xl rounded-2xl bg-lemon-tint px-4 py-3 text-[15px]">
          You didn’t log {weekdayName(yesterday)}.{" "}
          <Link href={`/log?date=${yesterday}`} className="font-bold text-leaf underline underline-offset-[3px]">
            Add it now
          </Link>
        </p>
      )}

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
          <Card className="flex flex-col gap-4">
            <p className="flex items-baseline gap-2">
              <span className="font-display text-[40px] font-extrabold leading-none">{formatValue(totals.calories ?? 0)}</span>
              <span className="text-lg">kcal so far</span>
            </p>
            <table className="w-full text-[15px]">
              <caption className="sr-only">Today’s totals</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Nutrient</th>
                  <th scope="col">Today</th>
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
            <Link href="/week" className="self-start text-sm font-bold text-leaf underline underline-offset-[3px]">
              See how your week is balancing out
            </Link>
          </Card>

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
      <p className="text-[15px] text-muted">Tap a food to log it.</p>
      <div className="flex flex-wrap gap-2.5 py-1">
        {quickPicks().map((food, index) => (
          <StickerButton
            key={food.id}
            tone={PICK_TONES[index]}
            index={index}
            onClick={() =>
              addFood({ name: food.name, foodId: food.id, perServing: food.nutrients }, 1, today, `Added ${formatAmount(amountFor(food.id), amountFor(food.id).base)} of ${food.name.toLowerCase()}`)
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
