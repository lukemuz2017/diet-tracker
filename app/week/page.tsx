import { redirect } from "next/navigation";

// Last 7 days now lives in the Food log's "Your 7 days" panel.
export default function WeekPage() {
  redirect("/log");
}
