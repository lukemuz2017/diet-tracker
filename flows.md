# User flows

The tool is built around three flows: the **first visit**, the **main task** (logging food), and **coming back** (the weekly review). Each step is its own route. The diagram below is also in `README.md`; when you change one, change both.

## Main task, as one sentence

> I log what I ate today → I see where each nutrient stands against my range → on Sunday I get my week in review and what to focus on next week.

## Diagram

```mermaid
flowchart TD
  subgraph FV["1 · First visit"]
    A(["Open app, nothing saved"]) --> B["Welcome · /<br/>what it does · Get started"]
    B --> C["Your details · /setup<br/>units, height, weight, age, sex, activity"]
    C -- "missing or out-of-range value:<br/>error by the field, input kept" --> C
    C --> D["Your ranges · /targets<br/>daily and weekly targets, explained"]
    D --> E["First log · /log<br/>tap a common food"]
  end

  subgraph MT["2 · Main task: log food"]
    T["Today · /today<br/>progress against each range"] --> L["Add food · /log<br/>common · recent · custom<br/>date defaults to today"]
    L -- "error by the field, input kept" --> L
    L -- "saved" --> T2["Today · /today<br/>bars update · 'Added oatmeal'"]
    T2 -- "edit or delete, with Undo" --> T2
  end

  subgraph CB["3 · Coming back"]
    R(["Return visit"]) --> W["Today · /today<br/>Welcome back · 4 of 7 days logged"]
    W -- "a day was missed" --> M["Missed-day nudge<br/>opens /log for that date"]
    W -- "week ended (Sunday)" --> V["Week review · /week<br/>days in range · weekly averages<br/>1–3 suggestions"]
    V --> N["New week starts Monday<br/>past weeks stay viewable"]
  end

  E --> T2
  M --> L
```

## Routes

Shared navigation, shown once setup is done: **Today · Log · Week · Targets**, with the current page marked.

| Route | What it's for |
|---|---|
| `/` | Welcome when nothing is saved; goes to `/today` once you're set up |
| `/setup` | Your details: units, height, weight, age, sex, activity level. Reused, prefilled, to edit them later |
| `/targets` | Your ranges and what each one means; link to edit your details |
| `/today` | Today's progress against every range; the day's entries, with edit and delete; nudges |
| `/log` | Add food: common, recent or custom. The date defaults to today, so you can catch up on earlier days |
| `/week` | Week review (Mon–Sun): days in range per nutrient, weekly vitamin and mineral averages, 1–3 suggestions; earlier weeks |

## States and errors

- **Nothing logged yet today:** quick-add foods and a "Log your first meal" action, never a blank page.
- **Thin week:** fewer than 4 days logged still gets a review, labeled "based on N days".
- **Missed day:** on return, "You didn't log Thursday. Add it?" opens `/log` with that date.
- **Week rollover:** a new week starts Monday; earlier reviews stay viewable.
- **Details changed:** a new weight or activity level recalculates the ranges.
- **Can't save:** if the browser blocks storage (e.g. private browsing), a banner says your data won't be kept.
- **Setup errors:** next to the field and say what to do, e.g. "Enter a height between 4 ft and 7 ft 6 in". What you typed stays.
- **Log errors:** food name missing, calories missing, a negative number, or a date in the future. What you typed stays.
- **Delete:** an Undo message right after.

## What's tracked, and how it's judged

The log form always shows food name, date, calories, protein, carbs and fat. The other eight nutrients are optional, under "More nutrients"; a blank means *unknown*, not zero. Quick-add foods fill in all twelve. Vitamins and minerals vary a lot from day to day, so they're judged on the weekly average.

| Nutrient | Kind | Judged | Target (adults) |
|---|---|---|---|
| Calories | range | daily | maintenance (Mifflin-St Jeor × activity) ±10% |
| Protein | range | daily | 10–35% of calories, at least 0.8 g per kg |
| Carbs | range | daily | 45–65% of calories |
| Fat | range | daily | 20–35% of calories |
| Fiber | minimum | daily | 14 g per 1,000 kcal |
| Added sugar | limit | daily | under 10% of calories |
| Sodium | limit | daily | under 2,300 mg |
| Potassium | minimum | weekly average | 3,400 mg (M) / 2,600 mg (F) |
| Calcium | minimum | weekly average | 1,000 mg (1,200 for women 51+ and men 71+) |
| Iron | minimum | weekly average | 8 mg (M, and F 51+) / 18 mg (F 19–50) |
| Vitamin A | minimum | weekly average | 900 mcg RAE (M) / 700 mcg RAE (F) |
| Vitamin C | minimum | weekly average | 90 mg (M) / 75 mg (F) |

Weekly suggestions come from simple rules, with no API. They name real foods from the built-in list that are high in whatever fell short.
