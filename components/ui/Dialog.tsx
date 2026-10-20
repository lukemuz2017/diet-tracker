"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

// A modal built on the native <dialog>: showModal() traps focus, makes the
// page behind inert, closes on Escape and returns focus when it closes. The
// backdrop is blurred. "center" is a pop-up form; "right" is a slide-in panel.
export function Dialog({
  open,
  onClose,
  title,
  side = "center",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  side?: "center" | "right";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // A backdrop tap closes only if it also started on the backdrop, so a tap that
  // slides onto it (the phone keyboard shifting the pop-up) doesn't close it.
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // Next keeps the page you left mounted but hidden, so close on the way out:
    // a modal left open stays in the top layer and blocks the next page.
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  const shape =
    side === "right"
      ? "m-0 ml-auto h-dvh max-h-dvh w-full max-w-lg rounded-l-card"
      : "mx-auto mb-auto mt-3 max-h-[92dvh] w-[min(44rem,calc(100vw-1.5rem))] rounded-card sm:my-auto sm:max-h-[88dvh] sm:w-[min(44rem,calc(100vw-2rem))]";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === ref.current;
      }}
      // A click on the backdrop lands on the <dialog> itself, not its content.
      onClick={(event) => {
        if (event.target === ref.current && pressedBackdrop.current) onClose();
        pressedBackdrop.current = false;
      }}
      className={`${shape} bg-paper p-0 text-soil shadow-2xl backdrop:bg-soil/35 backdrop:backdrop-blur-sm`}
    >
      {open && (
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="font-display text-2xl font-extrabold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-11 flex-none place-items-center rounded-full text-2xl leading-none hover:bg-track"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
