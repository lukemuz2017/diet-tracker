"use client";

import { useState } from "react";
import { addDays, toISODate } from "@/lib/dates";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthStart(iso: string): Date {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/**
 * An inline month calendar for History (the browser's own date picker pops
 * over the page). Clicking a day picks the 7 days ending on it; those days are
 * highlighted. Days after `max` can't be picked.
 */
export function WeekCalendar({ end, max, onPick }: { end: string; max: string; onPick: (date: string) => void }) {
  const [month, setMonth] = useState(() => monthStart(end));
  const start = addDays(end, -6);

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(month.getFullYear(), month.getMonth(), i + 1))),
  ];
  const title = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const atLatest = month.getFullYear() === monthStart(max).getFullYear() && month.getMonth() === monthStart(max).getMonth();
  const shift = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1));

  return (
    <div className="w-full max-w-sm rounded-card bg-paper p-4">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="grid size-11 place-items-center rounded-full text-lg font-bold hover:bg-track"
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
          const future = date > max;
          const selected = date === end;
          const inWeek = date >= start && date <= end;
          const label = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          return (
            <button
              key={date}
              type="button"
              disabled={future}
              aria-pressed={selected}
              aria-label={`Week ending ${label}`}
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
      <p className="mt-2 text-xs text-muted">Tap a day to see the 7 days ending on it.</p>
    </div>
  );
}
