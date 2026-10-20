"use client";

import { useEffect, useState } from "react";
import { dismissToast, useToast } from "@/lib/toast";

const SHOW_FOR_MS = 1800;

// design.md: Messages. Sits above the phone tab bar; announced politely.
// The timer pauses while the pointer is over it or focus is inside it, so
// there's always time to reach Undo.
export function Toast() {
  const toast = useToast();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!toast || paused) return;
    const timer = setTimeout(() => dismissToast(toast.id), SHOW_FOR_MS);
    return () => clearTimeout(timer);
  }, [toast, paused]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 sm:bottom-8"
    >
      {toast && (
        <div
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-4 rounded-2xl bg-soil px-4 py-3 text-[15px] text-paper shadow-lg"
        >
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo!();
                dismissToast(toast.id);
                setPaused(false);
              }}
              className="rounded-md px-1.5 py-1 font-bold text-lemon underline underline-offset-[3px] focus-visible:outline-lemon"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
