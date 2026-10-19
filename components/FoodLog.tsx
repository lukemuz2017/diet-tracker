"use client";

import { useSearchParams } from "next/navigation";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { AddFoodPanel } from "@/components/AddFood";
import { AmountSelect } from "@/components/FoodRow";
import { WeekCalendar } from "@/components/WeekCalendar";
import { WeekRibbons } from "@/components/WeekRibbons";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Card, PageHeader } from "@/components/ui/Card";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import { changeServings, removeEntry, setDayComplete } from "@/lib/actions";
import { multipleFor, quantityFor } from "@/lib/amounts";
import { addDays, formatDay } from "@/lib/dates";
import { amountFor } from "@/lib/foods";
import { formatValue, totalsFor } from "@/lib/log";
import { NUTRIENT_GROUPS, NUTRIENTS } from "@/lib/nutrients";
import { useSavedData, type Entry, type SavedData } from "@/lib/storage";
import { maintenanceCalories } from "@/lib/targets";
import { useToday } from "@/lib/useToday";
import { INCOMPLETE_SHARE, WINDOW_DAYS, type DayState } from "@/lib/week";

type Tab = "progress" | "foods";
const TABS: { value: Tab; label: string }[] = [
  { value: "progress", label: "Progress" },
  { value: "foods", label: "Foods" },
];

// This week, one page with two views (like a profile's segmented tabs):
// Progress shows week ribbons (each nutrient, each day, and the 7-day average
// that counts); Foods lists what was eaten each day. "+ Add food" opens a
// pop-up form; clicking a day opens that day in a side panel.
export function FoodLog() {
  const data = useSavedData();
  const today = useToday();
  const requestedTab = useSearchParams().get("tab");
  const [tab, setTab] = useState<Tab>(requestedTab === "foods" ? "foods" : "progress");
  const [addDate, setAddDate] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  if (!data?.profile || !today) return <PageHeader title="This week" />;

  const start = addDays(today, -(WINDOW_DAYS - 1));
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(today, -i));
  const firstFood = data.entries.length === 1;

  function openAdd(date: string) {
    setAddDate(date);
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const next = (index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[next].value);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="This week" description={`${formatDay(start)} – ${formatDay(today)}`} />

      {/* The view toggle and Add food share one row. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="This week" className="flex min-w-0 max-w-md flex-1 gap-1 rounded-full border-[1.5px] border-field bg-white p-1">
          {TABS.map((item, index) => (
            <button
              key={item.value}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={tab === item.value}
              aria-controls={`${baseId}-panel-${item.value}`}
              tabIndex={tab === item.value ? 0 : -1}
              onClick={() => setTab(item.value)}
              onKeyDown={(event) => onTabKey(event, index)}
              className={`min-h-11 flex-1 rounded-full px-5 text-[15px] font-bold ${
                tab === item.value ? "bg-soil text-paper" : "text-soil hover:bg-track"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => openAdd(today)}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-leaf px-6 font-display text-[17px] font-extrabold text-white hover:bg-leaf-dark"
        >
          <PlusIcon width={20} height={20} strokeWidth={2.25} />
          Add food
        </button>
      </div>

      <Dialog open={addDate !== null} onClose={() => setAddDate(null)} title="Add food">
        {addDate && (
          <>
            <DayPicker date={addDate} today={today} earliest={start} onPick={setAddDate} />
            <AddFoodPanel key={addDate} data={data} date={addDate} today={today} />
            <Button className="self-end" onClick={() => setAddDate(null)}>
              Done
            </Button>
          </>
        )}
      </Dialog>

      <Dialog open={openDay !== null} onClose={() => setOpenDay(null)} title={openDay ? dayName(openDay, today) : ""} side="right">
        {openDay && <DayCard data={data} date={openDay} today={today} onAdd={() => openAdd(openDay)} inPanel />}
      </Dialog>

      {firstFood && (
        <p role="status" className="mb-5 rounded-2xl bg-leaf-tint px-4 py-3 text-[15px]">
          <b>First food logged.</b> When you’re done eating for the day, mark it complete on the Foods tab and it joins
          your 7-day numbers.
        </p>
      )}

      <div
        role="tabpanel"
        id={`${baseId}-panel-${tab}`}
        aria-labelledby={`${baseId}-tab-${tab}`}
        tabIndex={0}
        className="rounded-card focus-visible:outline-offset-4"
      >
        {tab === "progress" ? (
          <WeekRibbons data={data} profile={data.profile} today={today} onOpenDay={setOpenDay} />
        ) : (
          <div className="flex flex-col gap-5">
            {days.map((day) => (
              <DayCard key={day} data={data} date={day} today={today} onAdd={() => openAdd(day)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The day to add food to: a button showing the day that drops down a month
 * calendar, limited to today and the 6 days before.
 */
function DayPicker({ date, today, earliest, onPick }: { date: string; today: string; earliest: string; onPick: (date: string) => void }) {
  const [open, setOpen] = useState(false);
  const calendarId = useId();
  return (
    <div
      className="flex flex-col gap-2"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          // Close just the calendar, not the whole pop-up.
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <span className="text-[15px] font-bold">Day</span>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={calendarId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 max-w-xs items-center justify-between gap-3 rounded-field border-[1.5px] border-field bg-white px-3.5 text-left text-base"
      >
        <span>
          <b>{dayName(date, today)}</b>
          {(date === today || date === addDays(today, -1)) && <span className="text-muted"> · {formatDay(date)}</span>}
        </span>
        <span aria-hidden="true" className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div id={calendarId} className="w-full max-w-xs rounded-card border-[1.5px] border-line shadow-sm">
          <WeekCalendar
            end={date}
            min={earliest}
            max={today}
            week={false}
            onPick={(picked) => {
              onPick(picked);
              setOpen(false);
            }}
          />
        </div>
      )}
      <span className="text-[13px] text-muted">You can fill in today or any of the 6 days before.</span>
    </div>
  );
}

function dayName(day: string, today: string): string {
  if (day === today) return "Today";
  if (day === addDays(today, -1)) return "Yesterday";
  return formatDay(day);
}

const STATE_CHIP: Record<DayState, { text: string; className: string }> = {
  complete: { text: "Complete", className: "bg-leaf text-white" },
  incomplete: { text: "Looks incomplete", className: "bg-lemon text-soil" },
  missed: { text: "Not logged", className: "border-[1.5px] border-dashed border-muted text-muted" },
  "in-progress": { text: "In progress", className: "border-[1.5px] border-soil text-soil" },
};

/** One day on the Foods tab: name, calories, status, its foods, and actions. */
function DayCard({
  data,
  date,
  today,
  onAdd,
  inPanel = false,
}: {
  data: SavedData;
  date: string;
  today: string;
  onAdd: () => void;
  /** In the side panel: no card, and the panel title names the day. */
  inPanel?: boolean;
}) {
  const entries = data.entries.filter((entry) => entry.date === date);
  const { totals, known, foods } = totalsFor(entries);
  const marked = data.completeDays.includes(date);
  const halfLogged = foods > 0 && (totals.calories ?? 0) < maintenanceCalories(data.profile!, today) * INCOMPLETE_SHARE;
  const state: DayState =
    foods === 0
      ? date === today
        ? "in-progress"
        : "missed"
      : marked
        ? "complete"
        : date === today
          ? "in-progress"
          : halfLogged
            ? "incomplete"
            : "complete";
  const chip = STATE_CHIP[state];
  const Box = inPanel ? "div" : Card;
  const canToggle = foods > 0 && (date === today || halfLogged || marked);
  const showDate = date === today || date === addDays(today, -1);

  return (
    <Box className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {!inPanel && <h2 className="font-display text-xl font-extrabold">{dayName(date, today)}</h2>}
          {showDate && <span className="text-sm text-muted">{formatDay(date)}</span>}
          {foods > 0 && <span className="text-[15px] font-bold">{formatValue(totals.calories ?? 0)} kcal</span>}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${chip.className}`}>{chip.text}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canToggle && (
            <button
              type="button"
              aria-pressed={marked}
              onClick={() => setDayComplete(date, !marked)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${
                marked ? "bg-leaf text-white hover:bg-leaf-dark" : "border-[1.5px] border-soil text-soil hover:bg-track"
              }`}
            >
              {marked && <CheckIcon width={16} height={16} strokeWidth={2.5} />}
              {marked ? "Day complete" : "Mark complete"}
            </button>
          )}
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Add food to ${dayName(date, today)}`}
            className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-leaf hover:bg-track"
          >
            <PlusIcon width={18} height={18} strokeWidth={2.25} /> Add
          </button>
        </div>
      </div>

      {foods === 0 ? (
        <p className="text-[15px] text-muted">Nothing logged{date === today ? " yet" : ""}.</p>
      ) : (
        <>
          <FoodList entries={entries} />
          <details className="group">
            <summary className="min-h-11 cursor-pointer content-center text-sm font-bold text-leaf">
              <span className="group-open:hidden">Show this day’s totals</span>
              <span className="hidden group-open:inline">Hide totals</span>
            </summary>
            <table className="w-full max-w-md text-[15px]">
              <caption className="sr-only">Totals for {formatDay(date)}</caption>
              <tbody className="divide-y divide-line">
                {NUTRIENT_GROUPS.flatMap((group) => group.keys)
                  .filter((key) => key !== "calories")
                  .map((key) => (
                    <tr key={key}>
                      <th scope="row" className="py-1.5 pr-3 text-left font-bold">
                        {NUTRIENTS[key].label}
                      </th>
                      <td className="py-1.5 text-right tabular-nums">
                        {totals[key] === undefined ? "–" : `${formatValue(totals[key]!)} ${NUTRIENTS[key].unit}`}
                        {totals[key] !== undefined && known[key] < foods && (
                          <span className="block text-xs text-muted">from {known[key]} of {foods} foods</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </Box>
  );
}

function FoodList({ entries }: { entries: Entry[] }) {
  const ordered = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <ul className="divide-y divide-line">
      {ordered.map((entry) => {
        const spec = amountFor(entry.foodId);
        return (
          <li key={entry.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
            <span className="min-w-0">
              <b>{entry.name}</b>
              {entry.nutrients.calories !== undefined && (
                <span className="text-muted"> · {formatValue(entry.nutrients.calories)} kcal</span>
              )}
            </span>
            <span className="flex items-center gap-2">
              <AmountSelect
                id={`amount-${entry.id}`}
                label={`Amount of ${entry.name}`}
                spec={spec}
                quantity={quantityFor(spec, entry.servings)}
                onChange={(quantity) => changeServings(entry.id, multipleFor(spec, quantity))}
              />
              <Button variant="quiet" onClick={() => removeEntry(entry.id)} aria-label={`Remove ${entry.name}`}>
                Remove
              </Button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
