import type { CSSProperties } from "react";
import { formatValue, statusFor } from "@/lib/log";
import { NUTRIENTS, type NutrientKey } from "@/lib/nutrients";
import type { Targets } from "@/lib/targets";
import type { WindowSummary } from "@/lib/week";

// The welcome screen's stickers, now showing your own week: the average a day
// for a few nutrients, colored by where it stands (green in range, yellow
// under, orange over). Wide screens only: they sit in the margin beside the
// Dashboard and are hidden on phones. Decorative, because the ribbons below
// carry the same numbers in words.
const SHOWN: NutrientKey[] = ["carbs", "fiber", "potassium", "vitaminC"];

const TONES = {
  "in-range": { tone: "bg-leaf text-white", ring: "var(--color-paper)", ground: "var(--color-leaf)" },
  "to-go": { tone: "bg-lemon text-soil", ring: "var(--color-soil)", ground: "var(--color-lemon)" },
  over: { tone: "bg-carrot text-soil", ring: "var(--color-soil)", ground: "var(--color-carrot)" },
} as const;

const TILTS = ["-7deg", "5deg", "-4deg", "8deg"];

export function DashboardStickers({ summary, targets }: { summary: WindowSummary; targets: Targets }) {
  if (summary.counted === 0) return null;

  const stickers = SHOWN.flatMap((key, index) => {
    const average = summary.averages[key];
    if (average === undefined) return [];
    const kind = statusFor(key, targets[key], average).kind;
    if (kind !== "in-range" && kind !== "to-go" && kind !== "over") return [];
    return [{ key, index, average, ...TONES[kind] }];
  });

  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-full top-6 ml-6 hidden flex-col gap-5 xl:flex">
      {stickers.map((sticker) => (
        <div
          key={sticker.key}
          className={`sticker-in flex h-28 w-40 flex-col items-center justify-center rounded-[50%] ${sticker.tone}`}
          style={
            {
              boxShadow: `inset 0 0 0 4px ${sticker.ground}, inset 0 0 0 5.5px ${sticker.ring}`,
              "--tilt": TILTS[sticker.index],
              animationDelay: `${300 + sticker.index * 120}ms`,
            } as CSSProperties
          }
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.1em]">{NUTRIENTS[sticker.key].label}</span>
          <span className="font-display text-[28px] font-extrabold leading-tight">
            {formatValue(sticker.average)} {NUTRIENTS[sticker.key].unit}
          </span>
          <span className="text-xs">a day, on average</span>
        </div>
      ))}
    </div>
  );
}
