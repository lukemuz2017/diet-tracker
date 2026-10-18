import type { Metadata } from "next";
import { Suspense } from "react";
import { AddFoodScreen } from "@/components/AddFood";
import { RequireProfile } from "@/components/Gates";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Add food" };

export default function LogPage() {
  return (
    <>
      <RequireProfile />
      {/* AddFoodScreen reads ?date=, which needs a Suspense boundary. */}
      <Suspense fallback={<PageHeader title="Add food" />}>
        <AddFoodScreen />
      </Suspense>
    </>
  );
}
