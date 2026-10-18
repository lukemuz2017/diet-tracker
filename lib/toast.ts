"use client";

import { useSyncExternalStore } from "react";

// One message at a time ("Added banana · Undo"), shown by <Toast /> in the
// layout so it survives moving from Add food to Today.

export interface ToastMessage {
  id: number;
  text: string;
  undo?: () => void;
}

let current: ToastMessage | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function showToast(text: string, undo?: () => void) {
  current = { id: nextId++, text, undo };
  emit();
}

export function dismissToast(id: number) {
  if (current?.id === id) {
    current = null;
    emit();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToast(): ToastMessage | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
