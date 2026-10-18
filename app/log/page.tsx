import type { Metadata } from "next";
import { Suspense } from "react";
import { FoodLog } from "@/components/FoodLog";
import { RequireProfile } from "@/components/Gates";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "This week" };

export default function LogPage() {
  return (
    <>
      <RequireProfile />
      {/* FoodLog reads ?tab=, which needs a Suspense boundary. */}
      <Suspense fallback={<PageHeader title="This week" />}>
        <FoodLog />
      </Suspense>
    </>
  );
}
