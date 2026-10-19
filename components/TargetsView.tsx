"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { NUTRIENT_GROUPS, NUTRIENTS } from "@/lib/nutrients";
import { addDays, formatDay } from "@/lib/dates";
import { describeProfile } from "@/lib/profile";
import { isSample, SAMPLE_DAYS, withSample, withoutSample } from "@/lib/sample";
import { updateData, useSavedData, type SavedData } from "@/lib/storage";
import { showToast } from "@/lib/toast";
import { useToday } from "@/lib/useToday";
import { computeTargets, explainTarget, formatTarget, maintenanceCalories } from "@/lib/targets";

export function TargetsView() {
  const data = useSavedData();
  const today = useToday();
  if (!data?.profile || !today) return <PageHeader title="Your ranges" />;

  const { profile } = data;
  const targets = computeTargets(profile, today);
  const firstVisit = data.entries.length === 0;

  return (
    <>
      <PageHeader
        eyebrow={firstVisit ? "Step 2 of 2" : undefined}
        title="Your ranges"
        description="What a balanced day looks like for you, to maintain your weight."
      />
      <div className="flex max-w-2xl flex-col gap-5">
        <Card className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="text-[15px]">
            <span className="text-muted">Based on </span>
            <b>{describeProfile(profile, today)}</b>
          </p>
          <ButtonLink href="/setup" variant="quiet">
            Edit details
          </ButtonLink>
        </Card>

        {NUTRIENT_GROUPS.map((group) => (
          <Card key={group.title} className="flex flex-col gap-1">
            <h2 className="font-display text-xl font-extrabold">{group.title}</h2>
            <ul className="divide-y divide-line">
              {group.keys.map((key) => {
                const { label } = NUTRIENTS[key];
                const range = formatTarget(key, targets[key]);
                return (
                  <li key={key} className="relative flex items-center justify-between gap-4 py-3">
                    <span className="flex items-center gap-2 font-bold">
                      {label}
                      <InfoButton label={`About the ${label.toLowerCase()} range`} anchor="parent">
                        <b>
                          {label}: {range} a day.
                        </b>{" "}
                        {explainTarget(key, profile, targets, today)}
                      </InfoButton>
                    </span>
                    <span className="text-right tabular-nums">{range}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}

        <p className="max-w-[60ch] text-sm text-muted">
          Each nutrient is judged on its average over your last 7 days, so a day out of range is
          normal. These are estimates for maintaining your weight, not medical advice.
        </p>

        <ButtonLink href="/log" className="min-h-12 self-start px-7 text-[17px]">
          {firstVisit ? "Log your first food" : "Back to This week"}
        </ButtonLink>

        <SampleData data={data} today={today} />
      </div>
    </>
  );
}

/**
 * Two weeks of example meals, for trying the app (or showing it) without
 * logging every day by hand. Asks on the page before changing anything.
 */
function SampleData({ data, today }: { data: SavedData; today: string }) {
  const [confirming, setConfirming] = useState(false);
  const hasSample = data.entries.some(isSample);
  const range = `${formatDay(addDays(today, -SAMPLE_DAYS))} – ${formatDay(addDays(today, -1))}`;

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-extrabold">Sample data</h2>
      {hasSample ? (
        <>
          <p className="text-[15px] text-muted">Example meals are loaded for the days before today. Clearing them keeps everything you logged.</p>
          <Button
            variant="secondary"
            className="self-start"
            onClick={() => {
              updateData(withoutSample);
              showToast("Removed the sample meals");
            }}
          >
            Clear sample data
          </Button>
        </>
      ) : confirming ? (
        <>
          <p className="text-[15px]">
            Add example meals for <b>{range}</b>? Days you already logged are left alone, and you can clear the samples
            here later.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                updateData((saved) => withSample(saved, today, data.profile ? maintenanceCalories(data.profile, today) : undefined));
                setConfirming(false);
                showToast("Added two weeks of sample meals");
              }}
            >
              Yes, add sample meals
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[15px] text-muted">Want to see how full weeks look? Load two weeks of example meals.</p>
          <Button variant="secondary" className="self-start" onClick={() => setConfirming(true)}>
            Load a sample 2 weeks
          </Button>
        </>
      )}
    </Card>
  );
}
