"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatDay } from "@/lib/dates";
import { formatValue, statusFor } from "@/lib/log";
import type { Nutrients } from "@/lib/nutrients";
import { formatTarget, type Target } from "@/lib/targets";
import type { WindowSummary } from "@/lib/week";

// Charts for History (dataviz skill): one measure per chart, recessive grid,
// status color always paired with words (tooltip, table), and a table view.

const STATUS_FILL = { "to-go": "bg-lemon", "in-range": "bg-leaf", over: "bg-eggplant", unknown: "bg-track" } as const;
const STATE_WORDS = { complete: "", incomplete: " · looks incomplete, not counted", missed: "", "in-progress": " · in progress, not counted yet" } as const;

/** Calories for each of the 7 days against the calorie range (shaded band). */
export function CaloriesByDay({ summary, target }: { summary: WindowSummary; target: Target }) {
  const [active, setActive] = useState<string | null>(null);
  const values = summary.days.map((day) => day.totals.calories ?? 0);
  const top = Math.max(target.max!, ...values) * 1.12;
  const y = (value: number) => `${(value / top) * 100}%`;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold">Calories by day</h2>
        <span className="text-[13px] text-muted">Shaded band: your range, {formatTarget("calories", target)}</span>
      </div>

      <div className="relative h-52 pl-12" aria-hidden="true">
        {/* Band and its edge labels */}
        <div className="absolute inset-x-12 right-0 bg-band/60" style={{ bottom: y(target.min!), height: `calc(${y(target.max!)} - ${y(target.min!)})` }} />
        {[target.min!, target.max!].map((value) => (
          <span key={value} className="absolute left-0 w-11 translate-y-1/2 text-right text-[11px] leading-none tabular-nums text-muted" style={{ bottom: y(value) }}>
            {formatValue(value)}
          </span>
        ))}
        <div className="absolute bottom-0 left-12 right-0 h-px bg-line" />
        <ol className="relative grid h-full grid-cols-7 items-end gap-2">
          {summary.days.map((day) => {
            const calories = day.totals.calories;
            const status = statusFor("calories", target, calories).kind;
            const label = `${formatDay(day.date)}: ${calories === undefined ? "not logged" : `${formatValue(calories)} kcal`}${STATE_WORDS[day.state]}`;
            return (
              <li key={day.date} className="relative flex h-full flex-col justify-end" onMouseEnter={() => setActive(day.date)} onMouseLeave={() => setActive(null)}>
                {active === day.date && (
                  <span className="absolute bottom-full left-1/2 z-10 mb-1 w-max max-w-48 -translate-x-1/2 rounded-lg bg-soil px-2.5 py-1.5 text-xs text-paper shadow">
                    {label}
                  </span>
                )}
                {calories === undefined ? (
                  <span className="mx-auto h-1.5 w-full rounded-full border-[1.5px] border-dashed border-field" />
                ) : (
                  <span
                    className={`w-full rounded-t-[4px] ${STATUS_FILL[status]} ${day.state !== "complete" ? "opacity-60" : ""}`}
                    style={{ height: y(calories) }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <ol className="grid grid-cols-7 gap-2 pl-12 text-center text-xs text-muted" aria-hidden="true">
        {summary.days.map((day) => (
          <li key={day.date}>{formatDay(day.date).slice(0, 3)}</li>
        ))}
      </ol>
      <p className="text-xs text-muted">Faded bars are days that don’t count yet (in progress or looks incomplete).</p>

      <details>
        <summary className="min-h-11 cursor-pointer content-center text-sm font-bold text-leaf">Show as a table</summary>
        <table className="w-full max-w-md text-[15px]">
          <caption className="sr-only">Calories by day, {formatDay(summary.start)} to {formatDay(summary.end)}</caption>
          <thead>
            <tr className="text-left text-[13px] text-muted">
              <th scope="col" className="py-1 font-normal">Day</th>
              <th scope="col" className="py-1 text-right font-normal">Calories</th>
              <th scope="col" className="py-1 pl-4 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {summary.days.map((day) => {
              const calories = day.totals.calories;
              return (
                <tr key={day.date}>
                  <th scope="row" className="py-1.5 text-left font-bold">{formatDay(day.date)}</th>
                  <td className="py-1.5 text-right tabular-nums">{calories === undefined ? "–" : formatValue(calories)}</td>
                  <td className="py-1.5 pl-4 text-[13px]">
                    {calories === undefined ? "Not logged" : statusFor("calories", target, calories).text}
                    {STATE_WORDS[day.state]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </Card>
  );
}

// Validated with the dataviz palette checker (light surface): all checks pass;
// carbs is below 3:1 contrast, so every segment carries a visible label.
const MACROS = [
  { key: "protein", label: "Protein", kcalPerGram: 4, color: "#2E8048", range: [10, 35] },
  { key: "carbs", label: "Carbs", kcalPerGram: 4, color: "#D29A12", range: [45, 65] },
  { key: "fat", label: "Fat", kcalPerGram: 9, color: "#B04E2C", range: [20, 35] },
] as const;

/** Share of calories from protein, carbs and fat (7-day averages), against their ranges. */
export function MacroSplit({ averages, teen }: { averages: Nutrients; teen: boolean }) {
  const kcal = MACROS.map((macro) => (averages[macro.key] ?? 0) * macro.kcalPerGram);
  const total = kcal.reduce((sum, value) => sum + value, 0);
  if (total === 0) return null;
  const shares = kcal.map((value) => (value / total) * 100);

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-extrabold">Where your calories came from</h2>
      <div className="flex h-10 w-full gap-0.5 overflow-hidden rounded-[6px]" aria-hidden="true">
        {MACROS.map((macro, index) =>
          shares[index] > 0 ? (
            <span key={macro.key} className="h-full first:rounded-l-[6px] last:rounded-r-[6px]" style={{ width: `${shares[index]}%`, background: macro.color }} title={`${macro.label}: ${Math.round(shares[index])}%`} />
          ) : null,
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {MACROS.map((macro, index) => {
          const [low, high] = macro.key === "fat" && teen ? [25, 35] : macro.range;
          const share = Math.round(shares[index]);
          const inRange = share >= low && share <= high;
          return (
            <li key={macro.key} className="flex items-start gap-2.5">
              <span aria-hidden="true" className="mt-1 size-3.5 flex-none rounded-[4px]" style={{ background: macro.color }} />
              <span className="flex flex-col">
                <span>
                  <b>{macro.label}</b> {share}%
                </span>
                <span className="text-[13px] text-muted">
                  Range {low}–{high}% · {inRange ? "in range" : share < low ? "below" : "above"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
