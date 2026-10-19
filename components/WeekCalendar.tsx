"use client";

import { useState } from "react";
import { addDays, toISODate } from "@/lib/dates";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthStart(iso: string): Date {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/**
 * An inline month calendar (the browser's own date picker pops over the
 * page). On History it picks the 7 days ending on a day and highlights them
 * (`week`); in Add food it picks a single day. Days outside min–max can't be
 * picked.
 */
export function WeekCalendar({
  end,
  min,
  max,
  week = true,
  onPick,
}: {
  end: string;
  min?: string;
  max: string;
  /** Highlight the 7 days ending on the selected day. */
  week?: boolean;
  onPick: (date: string) => void;
}) {
  const [month, setMonth] = useState(() => monthStart(end));
  const start = week ? addDays(end, -6) : end;

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(month.getFullYear(), month.getMonth(), i + 1))),
  ];
  const title = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  const atLatest = sameMonth(month, monthStart(max));
  const atEarliest = min !== undefined && sameMonth(month, monthStart(min));
  const shift = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));

  return (
    <div className="w-full max-w-sm rounded-card bg-paper p-4">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={atEarliest}
          aria-label="Previous month"
          className="grid size-11 place-items-center rounded-full text-lg font-bold hover:bg-track disabled:opacity-30"
        >
          ‹
        </button>
        <span className="font-display text-lg font-extrabold" aria-live="polite">
          {title}
        </span>
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={atLatest}
          aria-label="Next month"
          className="grid size-11 place-items-center rounded-full text-lg font-bold hover:bg-track disabled:opacity-30"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} />;
          const outside = date > max || (min !== undefined && date < min);
          const selected = date === end;
          const inWeek = date >= start && date <= end;
          const label = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          return (
            <button
              key={date}
              type="button"
              disabled={outside}
              aria-pressed={selected}
              aria-label={week ? `Week ending ${label}` : label}
              onClick={() => onPick(date)}
              className={`grid aspect-square place-items-center rounded-full text-sm font-bold tabular-nums disabled:cursor-not-allowed disabled:text-field ${
                selected ? "bg-leaf text-white" : inWeek ? "bg-leaf-tint text-soil hover:bg-band" : "text-soil hover:bg-track"
              }`}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
      {week && <p className="mt-2 text-xs text-muted">Tap a day to see the 7 days ending on it.</p>}
    </div>
  );
}
