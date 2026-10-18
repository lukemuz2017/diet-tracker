"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { WindowView } from "@/components/WindowView";
import { PageHeader } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { addDays, formatDay } from "@/lib/dates";
import { useSavedData } from "@/lib/storage";
import { useToday } from "@/lib/useToday";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** History: the 7-day window ending on any earlier day. */
export function History() {
  const data = useSavedData();
  const today = useToday();
  const router = useRouter();
  const requested = useSearchParams().get("end");
  const header = (
    <PageHeader title="History" description="Pick a day to see the 7 days that ended on it." />
  );
  if (!data?.profile || !today) return header;

  const end = requested && ISO_DATE.test(requested) && requested <= today ? requested : addDays(today, -1);
  const loggedDays = [...new Set(data.entries.map((entry) => entry.date))].filter((date) => date <= today).sort().reverse();

  return (
    <>
      {header}
      <div className="mb-5 flex max-w-3xl flex-col gap-3">
        <TextField
          id="history-end"
          type="date"
          label="Week ending"
          max={today}
          value={end}
          onChange={(event) => event.target.value && router.replace(`/history?end=${event.target.value}`)}
          className="max-w-xs"
        />
        {loggedDays.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-muted">Days you logged</span>
            <div className="flex flex-wrap gap-2">
              {loggedDays.slice(0, 14).map((date) => (
                <button
                  key={date}
                  type="button"
                  aria-pressed={date === end}
                  onClick={() => router.replace(`/history?end=${date}`)}
                  className={`min-h-11 rounded-full px-3.5 text-sm font-bold ${
                    date === end ? "bg-leaf text-white" : "border-[1.5px] border-field bg-white text-soil hover:bg-track"
                  }`}
                >
                  {formatDay(date)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <WindowView data={data} profile={data.profile} end={end} today={today} />
    </>
  );
}
