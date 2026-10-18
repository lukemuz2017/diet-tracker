import type { Metadata } from "next";
import { Suspense } from "react";
import { FoodLog } from "@/components/FoodLog";
import { RequireProfile } from "@/components/Gates";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Food log" };

export default function LogPage() {
  return (
    <>
      <RequireProfile />
      {/* FoodLog reads ?date=, which needs a Suspense boundary. */}
      <Suspense fallback={<PageHeader title="Food log" />}>
        <FoodLog />
      </Suspense>
    </>
  );
}
