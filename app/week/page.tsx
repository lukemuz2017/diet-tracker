import { redirect } from "next/navigation";

// Last 7 days now lives in the Food log's "Dietary stats" panel.
export default function WeekPage() {
  redirect("/log");
}
