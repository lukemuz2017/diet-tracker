import type { Metadata } from "next";
import { ComingNext } from "@/components/ComingNext";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Last 7 days" };

export default function WeekPage() {
  return (
    <>
      <PageHeader
        title="Last 7 days"
        description="Your 7-day averages against your ranges, and what to focus on next."
      />
      <ComingNext
        items={[
          "Each nutrient’s 7-day average against its range, and days in range",
          "One to three suggestions, each with a one-tap fix",
          "A weekend vs. weekday trend once there’s about two weeks of data",
        ]}
      />
    </>
  );
}
