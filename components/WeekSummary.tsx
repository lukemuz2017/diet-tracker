"use client";

import { useId } from "react";
import type { Profile } from "@/lib/profile";
import type { SavedData } from "@/lib/storage";
import { summarize } from "@/lib/suggestions";
import { computeTargets } from "@/lib/targets";
import { summarizeWindow } from "@/lib/week";

// The top of This week: a verdict on the last 7 days in words, and up to three
// things to work on, each with a gentle suggestion (lib/suggestions.ts).
export function WeekSummary({ data, profile, today }: { data: SavedData; profile: Profile; today: string }) {
  const titleId = useId();
  const targets = computeTargets(profile, today);
  const window = summarizeWindow(data, today, targets);
  const { verdict, headline, focus } = summarize(window, targets, data.entries);

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
        <ul className="grid gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
          {focus.map((item) => (
            <li
              key={item.key}
              className={`flex flex-col gap-1 rounded-xl border-l-4 bg-celery/60 py-2.5 pl-3 pr-2 ${item.direction === "low" ? "border-lemon" : "border-carrot"}`}
            >
              <b className="text-[15px]">{item.title}</b>
              <span className="text-[13px] text-muted">{item.detail}</span>
              <span className="mt-1 text-sm">
                {/* Odd parts sit between ** markers: the foods, in bold. */}
                {item.tip.split("**").map((part, index) => (index % 2 ? <b key={index}>{part}</b> : part))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
