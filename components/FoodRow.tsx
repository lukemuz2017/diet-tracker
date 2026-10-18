"use client";

import { useId, useState } from "react";
import { Sticker, type StickerTone } from "@/components/ui/Sticker";
import { PlusIcon } from "@/components/ui/icons";
import { formatValue, goodSourceTags } from "@/lib/log";
import type { Nutrients } from "@/lib/nutrients";

export const SERVING_CHOICES = [0.5, 1, 1.5, 2, 3];

const TAG_TONES: StickerTone[] = ["lemon", "leaf", "kraft"];

/** One food you can add: name, serving, kcal, "what it adds" tags, amount and Add. */
export function FoodRow({
  name,
  serving,
  perServing,
  defaultServings = 1,
  onAdd,
}: {
  name: string;
  serving?: string;
  perServing: Nutrients;
  defaultServings?: number;
  onAdd: (servings: number) => void;
}) {
  const [servings, setServings] = useState(defaultServings);
  const selectId = useId();
  const tags = goodSourceTags(perServing);
  const choices = SERVING_CHOICES.includes(defaultServings)
    ? SERVING_CHOICES
    : [...SERVING_CHOICES, defaultServings].sort((a, b) => a - b);

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="font-bold">
          {name}
          <span className="font-normal text-muted">
            {serving && ` · ${serving}`}
            {perServing.calories !== undefined && ` · ${formatValue(perServing.calories)} kcal`}
          </span>
        </span>
        {tags.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            <span className="sr-only">Good source of {tags.join(", ")}</span>
            {tags.map((tag, index) => (
              <Sticker key={tag} tone={TAG_TONES[index]} index={index} aria-hidden="true" className="text-[11px]">
                {tag}
              </Sticker>
            ))}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          Servings of {name}
        </label>
        <select
          id={selectId}
          value={servings}
          onChange={(event) => setServings(Number(event.target.value))}
          className="h-11 rounded-field border-[1.5px] border-field bg-white px-2 text-[15px]"
        >
          {choices.map((choice) => (
            <option key={choice} value={choice}>
              {choice} {choice === 1 ? "serving" : "servings"}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onAdd(servings)}
          aria-label={`Add ${name}`}
          className="inline-flex min-h-11 items-center gap-1 rounded-full bg-leaf px-4 font-display text-[15px] font-extrabold text-white hover:bg-leaf-dark"
        >
          <PlusIcon width={18} height={18} strokeWidth={2.25} />
          Add
        </button>
      </div>
    </li>
  );
}
