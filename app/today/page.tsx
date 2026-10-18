import type { Metadata } from "next";
import { ComingNext } from "@/components/ComingNext";
import { RequireProfile } from "@/components/Gates";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <>
      <RequireProfile />
      <PageHeader title="Today" />
      <ComingNext
        items={[
          "Today’s bars, with grams and what’s left for each nutrient",
          "The day’s foods, with edit and delete (and Undo)",
          "“Mark day complete”, and nudges for missed or half-logged days",
        ]}
      />
    </>
  );
}
