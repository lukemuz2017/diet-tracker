import { redirect } from "next/navigation";

// Last 7 days is the Progress tab of This week (/log).
export default function WeekPage() {
  redirect("/log");
}
