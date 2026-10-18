"use client";

import { ButtonLink } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { InfoButton } from "@/components/ui/InfoButton";
import { NUTRIENT_GROUPS, NUTRIENTS } from "@/lib/nutrients";
import { describeProfile } from "@/lib/profile";
import { useSavedData } from "@/lib/storage";
import { computeTargets, explainTarget, formatTarget } from "@/lib/targets";

export function TargetsView() {
  const data = useSavedData();
  if (!data?.profile) return <PageHeader title="Your ranges" />;

  const { profile } = data;
  const targets = computeTargets(profile);
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
            <b>{describeProfile(profile)}</b>
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
                        {explainTarget(key, profile, targets)}
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

        <ButtonLink href={firstVisit ? "/log" : "/today"} className="min-h-12 self-start px-7 text-[17px]">
          {firstVisit ? "Log your first food" : "Back to Today"}
        </ButtonLink>
      </div>
    </>
  );
}
