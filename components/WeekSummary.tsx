"use client";

import { useId } from "react";
import type { Profile } from "@/lib/profile";
import type { SavedData } from "@/lib/storage";
import { summarize } from "@/lib/suggestions";
import { computeTargets } from "@/lib/targets";
import { summarizeWindow } from "@/lib/week";

const KIND_LABEL = { good: "Going well", improve: "Could improve", big: "Bigger picture" } as const;
/** Left edge: in range, under, over, or a general habit (kraft). */
const TONE = { good: "border-leaf", low: "border-lemon", high: "border-carrot", big: "border-kraft" } as const;

// The top of This week, and the page's heading: the title and dates, a
// verdict on the last 7 days in words, and three tiles: going well, could
// improve, and a bigger-picture habit (lib/suggestions.ts). One card, to keep the
// page short.
export function WeekSummary({ data, profile, today, range }: { data: SavedData; profile: Profile; today: string; range: string }) {
  const verdictId = useId();
  const targets = computeTargets(profile, today);
  const window = summarizeWindow(data, today, targets);
  const { verdict, headline, tiles } = summarize(window, targets, data.entries);

  return (
    <section aria-describedby={verdictId} className="mb-4 mt-1 grid items-center gap-x-6 gap-y-3 rounded-card bg-paper p-4 sm:mt-3 sm:p-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <div>
        <h1 className="font-display text-[34px] font-extrabold leading-none tracking-tight">This week</h1>
        <p className="mt-1 text-sm text-muted">{range}</p>
        <p id={verdictId} className="mt-2.5 font-display text-lg font-extrabold leading-tight text-leaf">
          {headline}
        </p>
      </div>

      {verdict === "waiting" ? (
        <p className="text-[15px] text-muted">Log a day’s food and mark it complete to see how your week balances.</p>
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
          {tiles.map((tile) => (
            <li key={tile.kind} className={`flex flex-col gap-0.5 rounded-xl border-l-4 bg-celery/60 py-2 pl-3 pr-2 ${TONE[tile.tone]}`}>
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{KIND_LABEL[tile.kind]}</span>
              <b className="text-[15px]">{tile.title}</b>
              {tile.detail && <span className="text-[13px] text-muted">{tile.detail}</span>}
              <span className="mt-0.5 text-[13px] leading-snug">
                {/* Odd parts sit between ** markers: the foods, in bold. */}
                {tile.tip.split("**").map((part, index) => (index % 2 ? <b key={index}>{part}</b> : part))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
