import { redirect } from "next/navigation";

// Last 7 days is the Progress tab of Dashboard (/log).
export default function WeekPage() {
  redirect("/log");
}
