import type { Metadata } from "next";
import { ComingNext } from "@/components/ComingNext";
import { RequireProfile } from "@/components/Gates";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Add food" };

export default function LogPage() {
  return (
    <>
      <RequireProfile />
      <PageHeader title="Add food" description="Tap a food to log one serving, or add your own." />
      <ComingNext
        items={[
          "Common foods and your recent foods, one tap each",
          "A custom food form: name, calories, protein, carbs and fat, plus optional nutrients",
          "A date that defaults to today, so you can catch up on earlier days",
        ]}
      />
    </>
  );
}
