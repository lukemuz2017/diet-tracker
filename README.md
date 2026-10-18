# Health Tracker (working name)

A diet tracker for keeping a **balanced diet** and maintaining your weight, not losing it. Enter a few details about yourself once, and it sets daily and weekly target ranges for calories, macros, fiber, added sugar, sodium and key vitamins and minerals. Log what you eat, see where each day stands, and get a short weekly review that tells you what to focus on next.

Built for MPCS 51238 *Design, Build, Ship*, Assignment 3: Patterns & Flows.

## The main task, in one sentence

> I log what I ate today → I see where each nutrient stands against my range → on Sunday I get my week in review and what to focus on next week.

## User flows

Three flows: the first visit, the main task, and coming back. Each step is its own page. Routes, states, errors and the full table of targets are in [`flows.md`](flows.md).

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

## How it works

- **No account.** Everything is saved in your browser (`localStorage`), so it remembers you on the device you used.
- **Targets** are estimates for maintaining your weight (Mifflin-St Jeor plus standard dietary guidelines), not medical advice.
- **Logging** needs a food name, calories, protein, carbs and fat. The other nutrients are optional, and the built-in common foods fill them all in.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Stack: Next.js, Tailwind CSS and TypeScript, deployed on Vercel.

## Onboarding research

_To do (step 3): how three similar tools welcome someone new, and what this tool borrows for its first visit._

## First-run check

_To do (step 8): an agent's usability feedback from using the deployed tool as a brand-new user, and what changed because of it._
