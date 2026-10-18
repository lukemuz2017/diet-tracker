import type { Metadata } from "next";
import { RequireProfile } from "@/components/Gates";
import { LastSevenDays } from "@/components/WeekView";

export const metadata: Metadata = { title: "Last 7 days" };

export default function WeekPage() {
  return (
    <>
      <RequireProfile />
      <LastSevenDays />
    </>
  );
}
