"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { WeekCalendar } from "@/components/WeekCalendar";
import { PageHeader } from "@/components/ui/Card";
import { CheckboxPills, ChoiceField, FieldError, TextField } from "@/components/ui/Field";
import {
  ACTIVITY_OPTIONS,
  ALLERGEN_OPTIONS,
  LIFE_STAGE_OPTIONS,
  PATTERN_OPTIONS,
  SEX_OPTIONS,
  asksLifeStage,
  type Profile,
} from "@/lib/profile";
import { EMPTY_SETUP, switchUnits, validateSetup, valuesFromProfile, type SetupField, type SetupValues } from "@/lib/setup";
import { updateData, useSavedData } from "@/lib/storage";
import { useToday } from "@/lib/useToday";

export function SetupScreen() {
  const data = useSavedData();
  const today = useToday();
  const editing = Boolean(data?.profile);

  return (
    <>
      <PageHeader
        eyebrow={editing ? undefined : "Step 1 of 2"}
        title={editing ? "Edit your details" : "Your details"}
        back={editing ? { href: "/profile", label: "Profile" } : undefined}
        description={
          editing
            ? "Change anything and save. Your ranges update to match."
            : "Six quick questions, plus optional diet notes. We use them only to estimate your daily ranges and tailor suggestions, and they stay on this device."
        }
      />
      {/* The form waits for saved data so editing starts prefilled. */}
      {data && today && <SetupForm key={editing ? "edit" : "new"} saved={data.profile} today={today} />}
    </>
  );
}

const WHY = "Used only to estimate your needs. Stays on this device.";

/** Where focus goes when a field has an error, in form order. */
function firstErrorTarget(field: SetupField, values: SetupValues) {
  if (field === "height") return values.units === "us" ? "setup-height-ft" : "setup-height-cm";
  if (field === "birthDate") return "setup-birth-button";
  if (field === "sex") return `sex-${values.sex ?? "female"}`;
  if (field === "activity") return `activity-${values.activity ?? "sedentary"}`;
  return `setup-${field}`;
}

/** The picked date as "YYYY-MM-DD", or null while the three parts aren't a number each. */
function pickedBirthDate(values: SetupValues): string | null {
  const { birthYear: y, birthMonth: m, birthDay: d } = values;
  if (!/^\d{4}$/.test(y) || !/^\d{1,2}$/.test(m) || !/^\d{1,2}$/.test(d)) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/**
 * Date of birth: a button showing the date that drops down a calendar, with
 * month and year menus so there's no clicking back through decades.
 */
function BirthDateField({
  values,
  set,
  today,
  error,
}: {
  values: SetupValues;
  set: (patch: Partial<SetupValues>) => void;
  today: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const calendarId = useId();
  const picked = pickedBirthDate(values);
  const thisYear = Number(today.slice(0, 4));
  // With nothing picked yet, the calendar opens on a typical adult's birth year.
  const start = picked ?? `${thisYear - 30}-${today.slice(5, 7)}-01`;
  const label = picked
    ? new Date(`${picked}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Select your date of birth";

  return (
    <fieldset
      className="flex flex-col gap-1.5"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
        }
      }}
    >
      <legend className="pb-1.5 text-[15px] font-bold">Date of birth</legend>
      <button
        id="setup-birth-button"
        type="button"
        aria-expanded={open}
        aria-controls={calendarId}
        aria-describedby={error ? "setup-birth-error" : undefined}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-field bg-white px-3.5 text-left text-base ${
          error ? "border-2 border-tomato" : "border-[1.5px] border-field"
        }`}
      >
        <span className={picked ? "" : "text-muted"}>{label}</span>
        <span aria-hidden="true" className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div id={calendarId} className="w-full rounded-card border-[1.5px] border-line shadow-sm">
          <WeekCalendar
            end={start}
            selected={picked}
            min={`${thisYear - 100}-01-01`}
            max={today}
            week={false}
            jump
            onPick={(date) => {
              const [year, month, day] = date.split("-");
              set({ birthYear: year, birthMonth: month, birthDay: day });
              setOpen(false);
            }}
          />
        </div>
      )}
      {error && <FieldError id="setup-birth-error">{error}</FieldError>}
    </fieldset>
  );
}

export function SetupForm({ saved, today }: { saved: Profile | null; today: string }) {
  const router = useRouter();
  const [values, setValues] = useState<SetupValues>(saved ? valuesFromProfile(saved) : EMPTY_SETUP);
  // Errors show after the first submit, then update as the person fixes them.
  const [submitted, setSubmitted] = useState(false);
  const { errors } = validateSetup(values, today);
  const shown = submitted ? errors : {};

  const set = (patch: Partial<SetupValues>) => setValues((current) => ({ ...current, ...patch }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const result = validateSetup(values, today);
    if (!result.profile) {
      const order: SetupField[] = ["height", "weight", "birthDate", "sex", "activity"];
      const first = order.find((field) => result.errors[field])!;
      document.getElementById(firstErrorTarget(first, values))?.focus();
      return;
    }
    const profile = result.profile;
    updateData((data) => ({ ...data, profile }));
    router.push("/profile");
  }

  const us = values.units === "us";

  return (
    <form noValidate onSubmit={handleSubmit} className="flex max-w-md flex-col gap-6">
      <ChoiceField
        name="units"
        legend="Units"
        options={[
          { value: "us", label: "ft, in, lb" },
          { value: "metric", label: "cm, kg" },
        ]}
        value={values.units}
        onChange={(units) => setValues((current) => switchUnits(current, units))}
      />

      {us ? (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="pb-1.5 text-[15px] font-bold">Height</legend>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="setup-height-ft"
              label="Feet"
              unit={{ short: "ft", long: "feet" }}
              inputMode="numeric"
              autoComplete="off"
              value={values.heightFt}
              onChange={(event) => set({ heightFt: event.target.value })}
              invalid={Boolean(shown.height)}
              aria-describedby={shown.height ? "setup-height-error" : undefined}
              className="[&_label]:sr-only"
            />
            <TextField
              id="setup-height-in"
              label="Inches"
              unit={{ short: "in", long: "inches" }}
              inputMode="numeric"
              autoComplete="off"
              value={values.heightIn}
              onChange={(event) => set({ heightIn: event.target.value })}
              invalid={Boolean(shown.height)}
              aria-describedby={shown.height ? "setup-height-error" : undefined}
              className="[&_label]:sr-only"
            />
          </div>
          {shown.height && <FieldError id="setup-height-error">{shown.height}</FieldError>}
        </fieldset>
      ) : (
        <TextField
          id="setup-height-cm"
          label="Height"
          unit={{ short: "cm", long: "centimeters" }}
          inputMode="decimal"
          autoComplete="off"
          value={values.heightCm}
          onChange={(event) => set({ heightCm: event.target.value })}
          error={shown.height}
        />
      )}

      <TextField
        id="setup-weight"
        label="Weight"
        hint={WHY}
        unit={us ? { short: "lb", long: "pounds" } : { short: "kg", long: "kilograms" }}
        inputMode="decimal"
        autoComplete="off"
        value={values.weight}
        onChange={(event) => set({ weight: event.target.value })}
        error={shown.weight}
      />

      <BirthDateField values={values} set={set} today={today} error={shown.birthDate} />

      <ChoiceField
        name="sex"
        legend="Sex"
        hint="Calorie and vitamin estimates differ by sex; non-binary uses a blend of both. Stays on this device."
        options={SEX_OPTIONS}
        value={values.sex}
        onChange={(sex) => set({ sex })}
        error={shown.sex}
      />

      <ChoiceField
        name="activity"
        legend="Activity in a typical week"
        options={ACTIVITY_OPTIONS}
        value={values.activity}
        onChange={(activity) => set({ activity })}
        error={shown.activity}
      />

      <fieldset className="flex flex-col gap-5 rounded-card border-[1.5px] border-line bg-paper p-4">
        <legend className="px-1 font-display text-lg font-extrabold">
          Diet notes <span className="text-sm font-normal text-muted">(optional)</span>
        </legend>
        <ChoiceField
          name="pattern"
          legend="How do you eat?"
          hint="Suggestions only name foods that fit."
          options={PATTERN_OPTIONS}
          value={values.pattern}
          onChange={(pattern) => set({ pattern })}
        />
        <CheckboxPills
          name="allergies"
          legend="Allergies or intolerances"
          hint="Foods that contain these are flagged when you search, and suggestions leave them out."
          options={ALLERGEN_OPTIONS}
          values={values.allergies}
          onChange={(allergies) => set({ allergies })}
        />
        {asksLifeStage(values.sex) && (
          <ChoiceField
            name="lifeStage"
            legend="Pregnant or breastfeeding?"
            hint="Uses the official calorie, protein, iron and vitamin values for pregnancy or breastfeeding."
            options={LIFE_STAGE_OPTIONS.map(({ value, label }) => ({ value, label }))}
            value={values.lifeStage}
            onChange={(lifeStage) => set({ lifeStage })}
          />
        )}
      </fieldset>

      <Button type="submit" className="min-h-12 self-start px-7 text-[17px]">
        {saved ? "Save and update my ranges" : "See my ranges"}
      </Button>
    </form>
  );
}
