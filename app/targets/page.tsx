import type { Metadata } from "next";
import { RequireProfile } from "@/components/Gates";
import { TargetsView } from "@/components/TargetsView";

export const metadata: Metadata = { title: "Your ranges" };

export default function TargetsPage() {
  return (
    <>
      <RequireProfile />
      <TargetsView />
    </>
  );
}
