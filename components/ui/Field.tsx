import type { ComponentProps, ReactNode } from "react";
import { AlertIcon } from "./icons";

// Shared form fields (design.md: Form field). Every field has a visible label,
// an optional hint for "why we ask", and an error next to the field that says
// what to do. Callers keep the typed value in state, so an error never clears it.

function describedBy(...ids: (string | undefined)[]) {
  return ids.filter(Boolean).join(" ") || undefined;
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm font-bold text-tomato">
      <AlertIcon width={16} height={16} className="flex-none" />
      {children}
    </p>
  );
}

export function TextField({
  id,
  label,
  hint,
  error,
  unit,
  className = "",
  ...inputProps
}: Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Shown after the input; `long` is read out with the label. */
  unit?: { short: string; long: string };
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[15px] font-bold">
        {label}
        {unit && <span className="sr-only"> in {unit.long}</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-[13px] text-muted">
          {hint}
        </p>
      )}
      <div
        className={`field-box flex h-12 items-center gap-2 rounded-field bg-white px-3.5 ${
          error ? "border-2 border-tomato" : "border-[1.5px] border-field"
        }`}
      >
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hintId, errorId)}
          className="min-w-0 flex-1 bg-transparent text-base text-soil"
          {...inputProps}
        />
        {unit && (
          <span className="text-muted" aria-hidden="true">
            {unit.short}
          </span>
        )}
      </div>
      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

export function ChoiceField<T extends string>({
  name,
  legend,
  hint,
  error,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  hint?: ReactNode;
  error?: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={describedBy(hintId, errorId)}>
      <legend className="pb-1.5 text-[15px] font-bold">{legend}</legend>
      {hint && (
        <p id={hintId} className="-mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] border-field bg-white px-4 text-[15px] font-bold has-checked:border-leaf has-checked:bg-leaf has-checked:text-white has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-soil has-focus-visible:outline-solid"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}
