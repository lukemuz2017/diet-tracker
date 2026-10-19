"use client";

import { useId } from "react";
import { addFood } from "@/lib/actions";
import { formatAmount, quantityFor } from "@/lib/amounts";
import { amountFor, type Food } from "@/lib/foods";
import { mealAt } from "@/lib/meals";
import type { Profile } from "@/lib/profile";
import type { SavedData } from "@/lib/storage";
import { summarize } from "@/lib/suggestions";
import { computeTargets } from "@/lib/targets";
import { summarizeWindow } from "@/lib/week";

/** "Potato, baked (with skin)" → "potato" */
function shortName(food: Food): string {
  return food.name.split(",")[0].toLowerCase();
}

// The top of This week: a verdict on the last 7 days in words, and up to three
// things to work on. Low nutrients get a one-tap food (added to today, with
// Undo); high ones say where most of it came from.
export function WeekSummary({ data, profile, today }: { data: SavedData; profile: Profile; today: string }) {
  const titleId = useId();
  const targets = computeTargets(profile, today);
  const window = summarizeWindow(data, today, targets);
  const { verdict, headline, focus } = summarize(window, targets, data.entries);

  function add(food: Food) {
    const spec = amountFor(food.id);
    const what = `${formatAmount(spec, quantityFor(spec, 1))} of ${food.name.toLowerCase()}`;
    addFood({ name: food.name, foodId: food.id, perServing: food.nutrients }, 1, today, mealAt(new Date()), `Added ${what} to today. It counts once today is complete.`);
  }

  return (
    <section aria-labelledby={titleId} className="mb-5 grid items-center gap-4 rounded-card bg-paper p-4 sm:p-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">Your last 7 days</p>
        <h2 id={titleId} className="font-display text-2xl font-extrabold leading-tight">
          {headline}
        </h2>
      </div>

      {verdict === "waiting" ? (
        <p className="text-[15px] text-muted">Log a day’s food and mark it complete to see how your week balances.</p>
      ) : verdict === "balanced" ? (
        <p className="text-[15px] text-muted">Every nutrient’s 7-day average is in its range. Keep it up.</p>
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-3">
          {focus.map((item) => (
            <li
              key={item.key}
              className={`flex flex-col gap-1 rounded-xl border-l-4 bg-celery/60 py-2.5 pl-3 pr-2 ${item.direction === "low" ? "border-lemon" : "border-carrot"}`}
            >
              <b className="text-[15px]">{item.title}</b>
              <span className="text-[13px] text-muted">{item.detail}</span>
              {item.fix ? (
                <button
                  type="button"
                  onClick={() => add(item.fix!)}
                  aria-label={`Add ${formatAmount(amountFor(item.fix.id), quantityFor(amountFor(item.fix.id), 1))} of ${item.fix.name.toLowerCase()} to today`}
                  className="-ml-1.5 mt-auto inline-flex min-h-9 items-center self-start rounded-full px-1.5 text-sm font-bold text-leaf hover:bg-track"
                >
                  + Add {shortName(item.fix)}
                </button>
              ) : (
                item.topSource && <span className="mt-auto text-sm">Mostly from <b>{item.topSource.split(",")[0].toLowerCase()}</b></span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
