import type { Metadata } from "next";
import { ComingNext } from "@/components/ComingNext";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Your details" };

export default function SetupPage() {
  return (
    <>
      <PageHeader
        eyebrow="Step 1 of 2"
        title="Your details"
        description="Six quick questions. We use them only to estimate your daily ranges, and they stay on this device."
      />
      <ComingNext
        items={[
          "Units, height, weight, age, sex and activity level, on one screen",
          "A “why we ask” hint on sensitive questions",
          "Errors next to the field that say what to do, without clearing what you typed",
        ]}
      />
    </>
  );
}
