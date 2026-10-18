"use client";

import { CaloriesByDay, MacroSplit } from "@/components/HistoryCharts";
import { NutrientBar } from "@/components/NutrientBar";
import { Card } from "@/components/ui/Card";
import { formatDay } from "@/lib/dates";
import { NUTRIENT_KEYS, statusFor } from "@/lib/log";
import { NUTRIENT_GROUPS } from "@/lib/nutrients";
import { profileAge, type Profile } from "@/lib/profile";
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

/**
 * The 7 days ending on `end`: a score card ("X of 11 nutrients in range",
 * days logged, the day strip), then either each nutrient's bar against its
 * target ("bars", for This week) or high-level charts ("charts", for History).
 */
export function WindowView({
  data,
  profile,
  end,
  today,
  detail = "bars",
}: {
  data: SavedData;
  profile: Profile;
  end: string;
  today: string;
  detail?: "bars" | "charts";
}) {
  const targets = computeTargets(profile, today);
  const summary = summarizeWindow(data, end, today, maintenanceCalories(profile, today), targets);
  const counts = { "in-range": 0, "to-go": 0, over: 0 };
  if (summary.counted > 0) {
    for (const key of NUTRIENT_KEYS) {
      const kind = statusFor(key, targets[key], summary.averages[key]).kind;
      if (kind !== "unknown") counts[kind] += 1;
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[26px] font-extrabold leading-tight">
              {summary.counted > 0 ? `${counts["in-range"]} of ${NUTRIENT_KEYS.length} nutrients in range` : "No complete days yet"}
            </h2>
            {summary.counted > 0 && (
              <span className="flex flex-wrap gap-2 text-[13px] font-bold">
                <span className="rounded-full bg-leaf px-2.5 py-0.5 text-white">{counts["in-range"]} in range</span>
                <span className="rounded-full bg-lemon px-2.5 py-0.5 text-soil">{counts["to-go"]} to go</span>
                {counts.over > 0 && <span className="rounded-full bg-soil px-2.5 py-0.5 text-paper">{counts.over} over</span>}
              </span>
            )}
          </div>
          <span className="text-[15px] text-muted">
            {detail === "charts" && `${formatDay(summary.start)} – ${formatDay(summary.end)} · `}
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

      {detail === "charts" ? (
        <>
          {summary.logged > 0 && <CaloriesByDay summary={summary} target={targets.calories} />}
          {summary.counted > 0 && <MacroSplit averages={summary.averages} teen={profileAge(profile, today) <= 18} />}
        </>
      ) : summary.counted === 0 ? (
        <Card>
          <p className="text-[15px]">
            {end === today
              ? "Your 7-day balance starts when you finish your first day. Mark today complete on the Foods tab, or come back tomorrow."
              : "No complete days in this week."}
          </p>
        </Card>
      ) : (
        NUTRIENT_GROUPS.map((group) => (
          <Card key={group.title} className="flex flex-col gap-5">
            <h2 className="font-display text-xl font-extrabold">{group.title}</h2>
            {group.keys.map((key) => (
              <NutrientBar key={key} nutrient={key} target={targets[key]} value={summary.averages[key]} />
            ))}
          </Card>
        ))
      )}

      {summary.counted > 0 && summary.counted < 3 && (
        <p className="text-sm text-muted">Based on {summary.counted} complete {summary.counted === 1 ? "day" : "days"} so far.</p>
      )}
    </div>
  );
}
