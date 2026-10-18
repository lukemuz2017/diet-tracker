import { redirect } from "next/navigation";

// Today and Add food merged into the Food log; keep old links working.
export default function TodayPage() {
  redirect("/log");
}
