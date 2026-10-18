import type { Metadata } from "next";
import { RequireProfile } from "@/components/Gates";
import { TodayView } from "@/components/TodayView";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <>
      <RequireProfile />
      <TodayView />
    </>
  );
}
