import type { Metadata } from "next";
import { ComingNext } from "@/components/ComingNext";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Your ranges" };

export default function TargetsPage() {
  return (
    <>
      <PageHeader
        title="Your ranges"
        description="Daily targets for maintaining your weight, judged on your 7-day average."
      />
      <ComingNext
        items={[
          "Calories, protein, carbs, fat, fiber, added sugar, sodium and five vitamins and minerals",
          "An ⓘ button on each range explaining how it was calculated from your details",
          "Links to edit your details and to load sample data",
        ]}
      />
    </>
  );
}
