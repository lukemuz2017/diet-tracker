import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Card";
import { RedirectIfSetUp } from "@/components/Gates";

// The produce stickers show the kind of thing the app tracks, with real
// numbers (USDA FoodData Central, per serving shown).
const stickers = [
  { food: "Banana", amount: "422 mg", nutrient: "potassium", className: "bg-lemon text-soil -rotate-6", ring: "var(--color-soil)", ground: "var(--color-lemon)" },
  { food: "½ avocado", amount: "7 g", nutrient: "fiber", className: "bg-leaf text-white rotate-3", ring: "var(--color-paper)", ground: "var(--color-leaf)" },
  { food: "Orange", amount: "70 mg", nutrient: "vitamin C", className: "bg-tomato text-white -rotate-3", ring: "var(--color-paper)", ground: "var(--color-tomato)" },
  { food: "Spinach, 1 cup", amount: "6 mg", nutrient: "iron (cooked)", className: "bg-paper text-leaf rotate-6", ring: "var(--color-leaf)", ground: "var(--color-paper)" },
];

export default function WelcomePage() {
  return (
    <div className="grid items-center gap-10 py-6 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <RedirectIfSetUp />
      <div className="flex flex-col gap-5">
        <Eyebrow>Balanced eating, not dieting</Eyebrow>
        <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-balance sm:text-[64px]">
          Eat a balanced week.
        </h1>
        <p className="max-w-[52ch] text-lg text-muted">
          Answer six quick questions and get your own ranges for calories, protein, fiber and key
          vitamins. Log what you eat, and see how your last 7 days balance out.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
          <ButtonLink href="/setup" className="min-h-12 px-7 text-[17px]">
            Get started
          </ButtonLink>
          <p className="text-sm text-muted">About a minute · No account · Saved on this device</p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="grid grid-cols-2 place-items-center gap-5 rounded-card bg-kraft p-6 sm:p-10"
      >
        {stickers.map((sticker) => (
          <div
            key={sticker.food}
            className={`flex aspect-[3/2] w-full max-w-44 flex-col items-center justify-center rounded-[50%] ${sticker.className}`}
            style={{ boxShadow: `inset 0 0 0 4px ${sticker.ground}, inset 0 0 0 5.5px ${sticker.ring}` }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.1em]">{sticker.food}</span>
            <span className="font-display text-2xl font-extrabold leading-tight sm:text-[28px]">
              {sticker.amount}
            </span>
            <span className="text-xs">{sticker.nutrient}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
