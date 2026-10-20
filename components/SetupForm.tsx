"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
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
        description="Six quick questions, plus optional diet notes. We use them only to estimate your daily ranges and tailor suggestions, and they stay on this device."
      />
      {/* The form waits for saved data so editing starts prefilled. */}
      {data && today && <SetupForm key={editing ? "edit" : "new"} saved={data.profile} today={today} />}
    </>
  );
}

const WHY = "Used only to estimate your needs. Stays on this device.";

function describedBy(...ids: (string | false | undefined)[]) {
  return ids.filter(Boolean).join(" ") || undefined;
}

/** Where focus goes when a field has an error, in form order. */
function firstErrorTarget(field: SetupField, values: SetupValues) {
  if (field === "height") return values.units === "us" ? "setup-height-ft" : "setup-height-cm";
  if (field === "birthDate") return "setup-birth-month";
  if (field === "sex") return `sex-${values.sex ?? "female"}`;
  if (field === "activity") return `activity-${values.activity ?? "sedentary"}`;
  return `setup-${field}`;
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

      <fieldset className="flex flex-col gap-1.5">
        <legend className="pb-1.5 text-[15px] font-bold">Date of birth</legend>
        <p id="setup-birth-hint" className="-mt-1.5 text-[13px] text-muted">
          For example, 03 14 1992. Used only to work out your age.
        </p>
        <div className="grid grid-cols-[1fr_1fr_1.6fr] gap-3">
          <TextField
            id="setup-birth-month"
            label="Month"
            inputMode="numeric"
            autoComplete="bday-month"
            maxLength={2}
            value={values.birthMonth}
            onChange={(event) => set({ birthMonth: event.target.value })}
            invalid={Boolean(shown.birthDate)}
            aria-describedby={describedBy("setup-birth-hint", shown.birthDate && "setup-birth-error")}
          />
          <TextField
            id="setup-birth-day"
            label="Day"
            inputMode="numeric"
            autoComplete="bday-day"
            maxLength={2}
            value={values.birthDay}
            onChange={(event) => set({ birthDay: event.target.value })}
            invalid={Boolean(shown.birthDate)}
            aria-describedby={describedBy("setup-birth-hint", shown.birthDate && "setup-birth-error")}
          />
          <TextField
            id="setup-birth-year"
            label="Year"
            inputMode="numeric"
            autoComplete="bday-year"
            maxLength={4}
            value={values.birthYear}
            onChange={(event) => set({ birthYear: event.target.value })}
            invalid={Boolean(shown.birthDate)}
            aria-describedby={describedBy("setup-birth-hint", shown.birthDate && "setup-birth-error")}
          />
        </div>
        {shown.birthDate && <FieldError id="setup-birth-error">{shown.birthDate}</FieldError>}
      </fieldset>

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
