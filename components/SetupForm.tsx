"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Card";
import { ChoiceField, FieldError, TextField } from "@/components/ui/Field";
import { ACTIVITY_OPTIONS, type Profile } from "@/lib/profile";
import { EMPTY_SETUP, switchUnits, validateSetup, valuesFromProfile, type SetupField, type SetupValues } from "@/lib/setup";
import { updateData, useSavedData } from "@/lib/storage";

export function SetupScreen() {
  const data = useSavedData();
  const editing = Boolean(data?.profile);

  return (
    <>
      <PageHeader
        eyebrow={editing ? undefined : "Step 1 of 2"}
        title={editing ? "Edit your details" : "Your details"}
        description="Six quick questions. We use them only to estimate your daily ranges, and they stay on this device."
      />
      {/* The form waits for saved data so editing starts prefilled. */}
      {data && <SetupForm key={editing ? "edit" : "new"} saved={data.profile} />}
    </>
  );
}

const WHY = "Used only to estimate your needs. Stays on this device.";

/** Where focus goes when a field has an error, in form order. */
function firstErrorTarget(field: SetupField, values: SetupValues) {
  if (field === "height") return values.units === "us" ? "setup-height-ft" : "setup-height-cm";
  if (field === "sex") return `sex-${values.sex ?? "female"}`;
  if (field === "activity") return `activity-${values.activity ?? "sedentary"}`;
  return `setup-${field}`;
}

export function SetupForm({ saved }: { saved: Profile | null }) {
  const router = useRouter();
  const [values, setValues] = useState<SetupValues>(saved ? valuesFromProfile(saved) : EMPTY_SETUP);
  // Errors show after the first submit, then update as the person fixes them.
  const [submitted, setSubmitted] = useState(false);
  const { errors } = validateSetup(values);
  const shown = submitted ? errors : {};

  const set = (patch: Partial<SetupValues>) => setValues((current) => ({ ...current, ...patch }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const result = validateSetup(values);
    if (!result.profile) {
      const order: SetupField[] = ["height", "weight", "age", "sex", "activity"];
      const first = order.find((field) => result.errors[field])!;
      document.getElementById(firstErrorTarget(first, values))?.focus();
      return;
    }
    const profile = result.profile;
    updateData((data) => ({ ...data, profile }));
    router.push("/targets");
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

      <TextField
        id="setup-age"
        label="Age"
        unit={{ short: "years", long: "years" }}
        inputMode="numeric"
        autoComplete="off"
        value={values.age}
        onChange={(event) => set({ age: event.target.value })}
        error={shown.age}
      />

      <ChoiceField
        name="sex"
        legend="Sex"
        hint="Calorie and vitamin estimates differ by sex. Stays on this device."
        options={[
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
        ]}
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

      <Button type="submit" className="min-h-12 self-start px-7 text-[17px]">
        {saved ? "Save and update my ranges" : "See my ranges"}
      </Button>
    </form>
  );
}
