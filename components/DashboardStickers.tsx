import type { CSSProperties } from "react";
import { formatValue } from "@/lib/log";
import { NUTRIENTS, type NutrientKey } from "@/lib/nutrients";
import type { WindowSummary } from "@/lib/week";

// The welcome screen's stickers, now showing your own week: the average a day
// for four nutrients, one sticker per color, two in each margin and unevenly
// spaced. The colors are decoration, not status (the ribbons carry that).
// Wide screens only: hidden on phones and narrow windows, and aria-hidden
// because the ribbons carry the same numbers in words.
const STICKERS: {
  key: NutrientKey;
  tone: string;
  ring: string;
  ground: string;
  tilt: string;
  /** Which margin, and how far down. */
  place: string;
}[] = [
  { key: "fiber", tone: "bg-leaf text-white", ring: "var(--color-paper)", ground: "var(--color-leaf)", tilt: "6deg", place: "left-full ml-3 top-8" },
  { key: "carbs", tone: "bg-tomato text-white", ring: "var(--color-paper)", ground: "var(--color-tomato)", tilt: "-7deg", place: "right-full mr-1 top-44" },
  { key: "potassium", tone: "bg-lemon text-soil", ring: "var(--color-soil)", ground: "var(--color-lemon)", tilt: "-4deg", place: "left-full ml-5 top-[21rem]" },
  { key: "vitaminC", tone: "bg-carrot text-soil", ring: "var(--color-soil)", ground: "var(--color-carrot)", tilt: "8deg", place: "right-full mr-0.5 top-[34rem]" },
];

export function DashboardStickers({ summary }: { summary: WindowSummary }) {
  if (summary.counted === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none hidden xl:block">
      {STICKERS.map((sticker, index) => {
        const average = summary.averages[sticker.key];
        if (average === undefined) return null;
        return (
          <div
            key={sticker.key}
            className={`sticker-in absolute flex h-24 w-32 flex-col items-center justify-center rounded-[50%] ${sticker.tone} ${sticker.place}`}
            style={
              {
                boxShadow: `inset 0 0 0 3.5px ${sticker.ground}, inset 0 0 0 5px ${sticker.ring}`,
                "--tilt": sticker.tilt,
                animationDelay: `${300 + index * 130}ms`,
              } as CSSProperties
            }
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{NUTRIENTS[sticker.key].label}</span>
            <span className="font-display text-[22px] font-extrabold leading-tight">
              {formatValue(average)} {NUTRIENTS[sticker.key].unit}
            </span>
            <span className="text-[11px]">a day, on average</span>
          </div>
        );
      })}
    </div>
  );
}
