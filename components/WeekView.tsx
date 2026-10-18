"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { WindowView } from "@/components/WindowView";
import { PageHeader } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
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
    <PageHeader title="History" description="Pick a day to see the high-level stats for the 7 days that ended on it." />
  );
  if (!data?.profile || !today) return header;

  const end = requested && ISO_DATE.test(requested) && requested <= today ? requested : today;

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
      </div>
      <WindowView data={data} profile={data.profile} end={end} today={today} detail="charts" />
    </>
  );
}
