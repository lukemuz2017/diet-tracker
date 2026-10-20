"use client";

import { Fragment, useState } from "react";
import { NutrientBar } from "@/components/NutrientBar";
import { StatusChip } from "@/components/ui/StatusChip";
import { DayBadge } from "@/components/WindowView";
import { addDays, formatDay } from "@/lib/dates";
import { NUTRIENT_KEYS, formatValue, statusFor } from "@/lib/log";
import { NUTRIENT_GROUPS, NUTRIENTS, type NutrientKey } from "@/lib/nutrients";
import type { Profile } from "@/lib/profile";
import type { SavedData } from "@/lib/storage";
import { computeTargets } from "@/lib/targets";
import { summarizeWindow, type DayState } from "@/lib/week";

const CELL: Record<string, string> = {
  "in-range": "bg-leaf",
  "to-go": "bg-lemon",
  over: "bg-carrot",
  unknown: "bg-track",
};
const COUNTED: DayState[] = ["complete"];
const GRID = "grid grid-cols-[8.5rem_repeat(7,minmax(2.25rem,1fr))_9.5rem] items-center gap-x-1.5";
// The summary column says only where the average stands; the amounts and how
// far to go are in the nutrient's detail.
const SUMMARY: Record<string, string> = { "to-go": "Under", "in-range": "In range", over: "Over" };

/**
 * Week ribbons: one row per nutrient, a cell per day (in range / under / over
 * / not logged) and the 7-day average that counts. Clicking a day opens that
 * day; clicking a nutrient expands its weekly detail.
 */
export function WeekRibbons({
  data,
  profile,
  today,
  end,
  onOpenDay,
}: {
  data: SavedData;
  profile: Profile;
  today: string;
  /** The window's last day: yesterday until today is marked complete. */
  end: string;
  onOpenDay: (date: string) => void;
}) {
  const [expanded, setExpanded] = useState<NutrientKey | null>(null);
  const targets = computeTargets(profile, today);
  const summary = summarizeWindow(data, end, targets);
  const dayLabel = (date: string) => (date === today ? "Today" : formatDay(date).slice(0, 3));
  const dayName = (date: string) => (date === today ? "Today" : date === addDays(today, -1) ? "Yesterday" : formatDay(date));

  const dayShare = summary.days.map((day) => {
    const known = NUTRIENT_KEYS.filter((key) => day.totals[key] !== undefined);
    if (known.length === 0) return null;
    return known.filter((key) => statusFor(key, targets[key], day.totals[key]).kind === "in-range").length / known.length;
  });

  return (
    <div className="rounded-card bg-paper p-4 sm:p-5">
      <div className="overflow-x-auto">
        <div className="min-w-[40rem]">
          {/* Column headers: each day's badge opens that day. */}
          <div className={`${GRID} pb-2`}>
            <span className="text-xs text-muted">Tap a day or a nutrient</span>
            {summary.days.map((day, index) => (
              <button
                key={day.date}
                type="button"
                onClick={() => onOpenDay(day.date)}
                aria-label={`Open ${dayName(day.date)}`}
                className="flex flex-col items-center gap-0.5 rounded-xl py-1 text-xs text-muted hover:bg-track"
              >
                <DayBadge state={day.state} share={dayShare[index]} />
                <span className={day.date === today ? "font-bold text-soil" : ""}>{dayLabel(day.date)}</span>
              </button>
            ))}
            <span className="pl-3 text-xs font-bold text-leaf">7-day average</span>
          </div>

          {NUTRIENT_GROUPS.flatMap((group) => group.keys).map((key) => {
            const { label, unit } = NUTRIENTS[key];
            const average = summary.averages[key];
            const status = statusFor(key, targets[key], summary.counted > 0 ? average : undefined);
            const open = expanded === key;
            return (
              <Fragment key={key}>
                <div className={`${GRID} border-t border-line py-1`}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setExpanded(open ? null : key)}
                    className="flex min-h-8 items-center gap-1.5 rounded-lg pr-2 text-left text-sm font-bold hover:text-leaf"
                  >
                    <span aria-hidden="true" className={`text-xs text-muted transition-transform ${open ? "rotate-90" : ""}`}>
                      ▸
                    </span>
                    {label}
                  </button>
                  {summary.days.map((day) => {
                    const value = day.totals[key];
                    const dayStatus = statusFor(key, targets[key], value);
                    const words =
                      day.foods === 0 ? "not logged" : value === undefined ? "no value" : `${formatValue(value)} ${unit}, ${dayStatus.text.toLowerCase()}`;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => onOpenDay(day.date)}
                        aria-label={`${label}, ${dayName(day.date)}: ${words}`}
                        title={`${dayName(day.date)}: ${words}`}
                        className={`h-6 rounded-md ${
                          day.foods === 0 ? "border-[1.5px] border-dashed border-field" : CELL[dayStatus.kind]
                        } ${day.foods > 0 && !COUNTED.includes(day.state) ? "opacity-55" : ""}`}
                      />
                    );
                  })}
                  <span className="pl-3">
                    {summary.counted > 0 && average !== undefined ? (
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setExpanded(open ? null : key)}
                        aria-label={`${label} 7-day average: ${status.text}. ${open ? "Hide" : "Show"} details`}
                        className="whitespace-nowrap rounded-full"
                      >
                        <StatusChip status={status.kind}>{SUMMARY[status.kind]}</StatusChip>
                      </button>
                    ) : (
                      <span className="text-sm text-muted">–</span>
                    )}
                  </span>
                </div>
                {open && <NutrientDetail data={data} nutrientKey={key} summary={summary} targets={targets} dayName={dayName} />}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span><span aria-hidden="true" className="mr-1 inline-block size-3 rounded-sm bg-leaf align-[-2px]" />In range that day</span>
        <span><span aria-hidden="true" className="mr-1 inline-block size-3 rounded-sm bg-lemon align-[-2px]" />Under</span>
        <span><span aria-hidden="true" className="mr-1 inline-block size-3 rounded-sm bg-carrot align-[-2px]" />Over</span>
        <span><span aria-hidden="true" className="mr-1 inline-block size-3 rounded-sm border-[1.5px] border-dashed border-field align-[-2px]" />Not logged</span>
        <span>Faded: not marked complete, so it doesn’t count yet.</span>
      </div>
    </div>
  );
}

/** Weekly detail for one nutrient: the bar against its target, then each day with its top food. */
function NutrientDetail({
  data,
  nutrientKey,
  summary,
  targets,
  dayName,
}: {
  data: SavedData;
  nutrientKey: NutrientKey;
  summary: ReturnType<typeof summarizeWindow>;
  targets: ReturnType<typeof computeTargets>;
  dayName: (date: string) => string;
}) {
  const { label, unit } = NUTRIENTS[nutrientKey];

  // The food that gave the most of this nutrient on each day (same food logged twice adds up).
  const topByDay = new Map<string, { name: string; value: number }>();
  for (const day of summary.days) {
    const byFood = new Map<string, number>();
    for (const entry of data.entries) {
      const value = entry.nutrients[nutrientKey];
      if (entry.date !== day.date || !value) continue;
      byFood.set(entry.name, (byFood.get(entry.name) ?? 0) + value);
    }
    const [name, value] = [...byFood].sort((a, b) => b[1] - a[1])[0] ?? [];
    if (name !== undefined) topByDay.set(day.date, { name, value: value! });
  }

  const countedDays = summary.coverage[nutrientKey].days;

  return (
    <div className="mb-2 flex flex-col gap-4 rounded-xl bg-celery/60 p-4">
      <NutrientBar nutrient={nutrientKey} target={targets[nutrientKey]} value={summary.counted > 0 ? summary.averages[nutrientKey] : undefined} />
      <table className="w-full text-sm">
        <caption className="sr-only">{label} each day, whether it counts toward the 7-day average, and the food that gave the most</caption>
        <thead>
          <tr className="text-left text-xs font-bold uppercase tracking-[0.08em] text-leaf">
            <th scope="col" className="pb-1 font-bold">Each day</th>
            <th scope="col" className="pb-1 text-right font-bold">{label}</th>
            <th scope="col" className="pb-1 pl-4 font-bold">In the average?</th>
            <th scope="col" className="pb-1 pl-4 font-bold">Top source</th>
          </tr>
        </thead>
        <tbody>
          {summary.days.map((day) => {
            const value = day.totals[nutrientKey];
            const top = topByDay.get(day.date);
            const counts = day.state === "complete" && value !== undefined;
            return (
              <tr key={day.date} className={counts ? "" : "text-muted"}>
                <th scope="row" className="py-1 text-left font-normal">{dayName(day.date)}</th>
                <td className={`py-1 text-right tabular-nums ${counts ? "font-bold" : ""}`}>
                  {day.foods === 0 ? "–" : value === undefined ? "no value" : `${formatValue(value)} ${unit}`}
                </td>
                <td className="py-1 pl-4">
                  {counts ? (
                    <span className="rounded-full bg-leaf-tint px-2 py-0.5 text-xs font-bold text-soil">✓ Counted</span>
                  ) : day.foods === 0 ? (
                    <span className="rounded-full border-[1.5px] border-dashed border-field px-2 py-0.5 text-xs font-bold">Not logged</span>
                  ) : day.state !== "complete" ? (
                    <span className="rounded-full border-[1.5px] border-field px-2 py-0.5 text-xs font-bold">Not complete</span>
                  ) : (
                    <span className="text-xs">No value logged</span>
                  )}
                </td>
                <td className="py-1 pl-4">
                  {top ? (
                    <>
                      {top.name}
                      <span className="tabular-nums text-muted"> · {formatValue(top.value)} {unit}</span>
                    </>
                  ) : (
                    <span className="text-muted">–</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-line">
            <th scope="row" className="pt-2 text-left font-bold">7-day average</th>
            <td className="pt-2 text-right font-bold tabular-nums">
              {summary.averages[nutrientKey] === undefined ? "–" : `${formatValue(summary.averages[nutrientKey]!)} ${unit}`}
            </td>
            <td colSpan={2} className="pt-2 pl-4 text-[13px] text-muted">
              {countedDays === 0
                ? "No complete days with a value yet. Mark a day complete to start the average."
                : `The average of the ${countedDays} counted ${countedDays === 1 ? "day" : "days"} above. Days not marked complete are left out.`}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
