"use client";

import { scaleNutrients, withServings } from "./log.ts";
import type { Nutrients } from "./nutrients.ts";
import { updateData, type Entry } from "./storage.ts";
import { showToast } from "./toast.ts";

// Changes people make while logging, each with an Undo message.

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function addFood(food: { name: string; foodId?: string; perServing: Nutrients }, servings: number, date: string, message: string) {
  const entry: Entry = {
    id: newId(),
    date,
    name: food.name,
    servings,
    foodId: food.foodId,
    nutrients: scaleNutrients(food.perServing, servings),
    createdAt: new Date().toISOString(),
  };
  updateData((data) => ({ ...data, entries: [...data.entries, entry] }));
  showToast(message, () => removeEntry(entry.id, { silent: true }));
  return entry;
}

export function removeEntry(id: string, { silent = false } = {}) {
  let removed: Entry | undefined;
  updateData((data) => {
    removed = data.entries.find((entry) => entry.id === id);
    return { ...data, entries: data.entries.filter((entry) => entry.id !== id) };
  });
  if (removed && !silent) {
    const entry = removed;
    showToast(`Removed ${entry.name.toLowerCase()}`, () =>
      updateData((data) => ({ ...data, entries: [...data.entries, entry] })),
    );
  }
}

export function changeServings(id: string, servings: number) {
  updateData((data) => ({
    ...data,
    entries: data.entries.map((entry) => (entry.id === id ? withServings(entry, servings) : entry)),
  }));
}

export function setDayComplete(date: string, complete: boolean) {
  updateData((data) => ({
    ...data,
    completeDays: complete
      ? [...new Set([...data.completeDays, date])]
      : data.completeDays.filter((day) => day !== date),
  }));
}
