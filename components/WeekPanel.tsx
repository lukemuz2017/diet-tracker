"use client";

import { useId, useState } from "react";
import { WindowView } from "@/components/WindowView";
import { formatDay } from "@/lib/dates";
import { NUTRIENT_KEYS, statusFor } from "@/lib/log";
import type { Profile } from "@/lib/profile";
import type { SavedData } from "@/lib/storage";
import { computeTargets, maintenanceCalories } from "@/lib/targets";
import { summarizeWindow } from "@/lib/week";

const OPEN_KEY = "diet-tracker:week-panel-open";

function readOpen(): boolean {
  try {
    return window.localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

// The 7 days ending on the day picked in the Food log, as a collapsible bar:
// a one-line summary when closed, the full day strip and bars when open.
export function WeekPanel({ data, profile, end, today }: { data: SavedData; profile: Profile; end: string; today: string }) {
  const [open, setOpen] = useState(readOpen);
  const panelId = useId();
  const targets = computeTargets(profile, today);
  const summary = summarizeWindow(data, end, today, maintenanceCalories(profile, today), targets);

  const counts = { "in-range": 0, "to-go": 0, over: 0 };
  if (summary.counted > 0) {
    for (const key of NUTRIENT_KEYS) {
      const kind = statusFor(key, targets[key], summary.averages[key]).kind;
      if (kind !== "unknown") counts[kind] += 1;
    }
  }

  function toggle() {
    setOpen((value) => {
      try {
        window.localStorage.setItem(OPEN_KEY, value ? "0" : "1");
      } catch {
        // Not saved; it just won't be remembered.
      }
      return !value;
    });
  }

  return (
    <section className="mb-5 rounded-card bg-paper">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-card px-5 py-4 text-left hover:bg-track/40"
      >
        <span className="flex flex-col">
          <span className="font-display text-xl font-extrabold">Dietary stats</span>
          <span className="text-sm text-muted">
            {formatDay(summary.start)} – {formatDay(summary.end)} · {summary.counted} complete
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
          {summary.counted === 0 ? (
            <span className="text-muted">Starts after your first complete day</span>
          ) : (
            <>
              <span className="rounded-full bg-leaf px-2.5 py-0.5 text-white">{counts["in-range"]} in range</span>
              <span className="rounded-full bg-lemon px-2.5 py-0.5 text-soil">{counts["to-go"]} to go</span>
              {counts.over > 0 && <span className="rounded-full bg-tomato px-2.5 py-0.5 text-white">{counts.over} over</span>}
            </>
          )}
          <span className="ml-1 text-sm text-leaf underline underline-offset-[3px]">{open ? "Hide" : "Show"}</span>
        </span>
      </button>
      <div id={panelId} hidden={!open} className="border-t border-line px-5 pb-5 pt-4">
        {open && <WindowView data={data} profile={profile} end={end} today={today} compact />}
      </div>
    </section>
  );
}
