"use client";

import Link from "next/link";
import { NutrientBar } from "@/components/NutrientBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { setDayComplete } from "@/lib/actions";
import { formatDay } from "@/lib/dates";
import { NUTRIENT_GROUPS } from "@/lib/nutrients";
import type { Profile } from "@/lib/profile";
import type { SavedData } from "@/lib/storage";
import { computeTargets, maintenanceCalories } from "@/lib/targets";
import { summarizeWindow, type DayState } from "@/lib/week";

const DOT: Record<DayState, string> = {
  complete: "bg-leaf",
  incomplete: "bg-lemon shadow-[inset_0_0_0_2px_var(--color-soil)]",
  missed: "border-2 border-field",
  "in-progress": "border-2 border-dashed border-soil",
};
const STATE_LABEL: Record<DayState, string> = {
  complete: "complete",
  incomplete: "looks incomplete",
  missed: "not logged",
  "in-progress": "in progress",
};

/** The 7 days ending on `end`: which days count, averages against targets, and half-logged days to fix. */
export function WindowView({ data, profile, end, today }: { data: SavedData; profile: Profile; end: string; today: string }) {
  const targets = computeTargets(profile, today);
  const summary = summarizeWindow(data, end, today, maintenanceCalories(profile, today), targets);
  const incomplete = summary.days.filter((day) => day.state === "incomplete");

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold">
            {formatDay(summary.start)} – {formatDay(summary.end)}
          </h2>
          <span className="text-[15px] text-muted">
            {summary.logged} of 7 days logged · {summary.counted} complete
          </span>
        </div>
        <ol className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted">
          {summary.days.map((day) => (
            <li key={day.date} className="flex flex-col items-center gap-1">
              <span aria-hidden="true" className={`size-7 rounded-full ${DOT[day.state]}`} />
              <span>{formatDay(day.date).slice(0, 3)}</span>
              <span className="sr-only">
                {formatDay(day.date)}: {STATE_LABEL[day.state]}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted">Filled: complete · Yellow: looks incomplete · Ring: not logged · Dashed: in progress</p>
      </Card>

      {incomplete.map((day) => (
        <div key={day.date} className="flex flex-col gap-2 rounded-2xl bg-lemon-tint px-4 py-3 text-[15px]">
          <span>
            <b>{formatDay(day.date)} looks incomplete</b> ({Math.round(day.totals.calories ?? 0).toLocaleString("en-US")}{" "}
            kcal logged), so it’s left out of the averages.
          </span>
          <span className="flex flex-wrap gap-x-4">
            <Link href={`/log?date=${day.date}`} className="font-bold text-leaf underline underline-offset-[3px]">
              Add food
            </Link>
            <Button variant="quiet" className="min-h-0 px-0" onClick={() => setDayComplete(day.date, true)}>
              Mark complete
            </Button>
          </span>
        </div>
      ))}

      {summary.counted === 0 ? (
        <Card>
          <p className="text-[15px]">
            {end === today
              ? "Your 7-day balance starts when you finish your first day. Mark today complete on the Today page, or come back tomorrow."
              : "No complete days in this week."}
          </p>
        </Card>
      ) : (
        NUTRIENT_GROUPS.map((group) => (
          <Card key={group.title} className="flex flex-col gap-5">
            <h2 className="font-display text-xl font-extrabold">{group.title}</h2>
            {group.keys.map((key) => {
              const { days, inRange } = summary.coverage[key];
              return (
                <NutrientBar
                  key={key}
                  nutrient={key}
                  target={targets[key]}
                  value={summary.averages[key]}
                  detail={days > 0 ? `In range on ${inRange} of ${days} ${days === 1 ? "day" : "days"}` : undefined}
                />
              );
            })}
          </Card>
        ))
      )}

      {summary.counted > 0 && summary.counted < 3 && (
        <p className="text-sm text-muted">Based on {summary.counted} complete {summary.counted === 1 ? "day" : "days"} so far.</p>
      )}
    </div>
  );
}
