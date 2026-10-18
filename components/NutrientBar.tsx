import { StatusChip } from "@/components/ui/StatusChip";
import { formatValue, statusFor } from "@/lib/log";
import { NUTRIENTS, type NutrientKey } from "@/lib/nutrients";
import { formatTarget, type Target } from "@/lib/targets";

// design.md: Nutrient bar. The track shows the target as a band and the
// day's value as a thin bar; the chip and the line under it say it in words.

function scaleMax(target: Target): number {
  if (target.kind === "range") return target.max! * 1.25;
  if (target.kind === "min") return target.min! * 1.6;
  return target.max! * 1.3;
}

const pct = (value: number, max: number) => `${Math.min(100, (value / max) * 100)}%`;

export function NutrientBar({
  nutrient,
  target,
  value,
  known,
  foods,
}: {
  nutrient: NutrientKey;
  target: Target;
  value: number | undefined;
  /** Foods with a value for this nutrient, out of `foods`. */
  known: number;
  foods: number;
}) {
  const { label, unit } = NUTRIENTS[nutrient];
  const status = statusFor(nutrient, target, value);
  const max = scaleMax(target);
  const bandStart = target.kind === "max" ? 0 : target.min!;
  const bandEnd = target.kind === "min" ? max : target.max!;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold">{label}</span>
        <StatusChip status={status.kind}>{status.text}</StatusChip>
      </div>
      <div aria-hidden="true" className="relative h-4 overflow-hidden rounded-full bg-track">
        <div
          className="absolute inset-y-0 bg-band"
          style={{ left: pct(bandStart, max), width: `calc(${pct(bandEnd, max)} - ${pct(bandStart, max)})` }}
        />
        {value !== undefined && (
          <div className="absolute left-0 top-[5px] h-1.5 rounded-full bg-soil" style={{ width: pct(value, max) }} />
        )}
      </div>
      <p className="text-[13px] text-muted">
        {value === undefined ? "No values yet" : `${formatValue(value)} ${unit}`} of {formatTarget(nutrient, target)}
        {value !== undefined && known < foods && ` · based on ${known} of ${foods} foods`}
      </p>
    </div>
  );
}
