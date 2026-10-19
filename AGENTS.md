<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Context for any coding agent working in this repo. Read it before doing anything. When a decision changes, update this file in the same commit.

## What we're building

A diet tracking and planning tool for keeping a **balanced diet**. It is not a weight-loss app: targets are set to *maintain* current weight.

1. **Set up once.** The person enters a few facts about themselves (height, weight, age, sex, activity level). The app estimates maintenance calories and sets target ranges for each tracked nutrient.
2. **Log food.** They log what they eat each day, or catch up on earlier days. Today shows where every nutrient stands against its daily range: under, in range, or over.
3. **Check the last 7 days.** Every nutrient is judged on its rolling 7-day average. The app shows days in range and suggests one to three things to focus on, each with a one-tap fix (e.g. "Potassium averaged 60% of target → Add a banana").

Working name: TBD. Repo folder: `health-tracker`.

## Project files

- `flows.md`: the three user flows (Mermaid diagram), routes, states and errors, and the table of nutrient targets. It's the source of truth for what the app does.
- `README.md`: shows the same diagram (keep the two copies in sync), plus the onboarding research and first-run check write-ups.
- `design.md`: the visual design (Market Stand): color tokens with checked contrast, type, spacing, component rules, imagery and voice. Follow it for every screen; `mood-board.pdf` shows it.
- `user-flows.pdf`: the diagram as a PDF, made with Mermaid CLI (`@mermaid-js/mermaid-cli`, run through `npx`, not a project dependency). Regenerate it whenever the diagram changes.
- `research/onboarding-research.md`: notes and sources from the onboarding research.
- `AGENTS.md`: this file, the only agent context file. If a tool generates `CLAUDE.md`, move anything useful here and delete it.

## Course context

- MPCS 51238 *Design, Build, Ship*, Assignment 3, "Patterns & Flows: An Everyday Tool". Due **Tue Oct 20, 2026, 5:30 PM**. The brief is `Assignment 3 - Patterns & Flows.pdf` in the repo root. It's gitignored, so never commit it.
- The student directs every change. Don't one-shot features: propose options, let the student choose, then build in small steps. A one-shot submission is marked incomplete.
- Graded: a working Vercel URL; a page per flow step with shared navigation; the flow diagram in `README.md`; a first visit that's useful right away; form errors next to the field that say what to do and keep what was typed; a reason to come back, with data that persists; keyboard access, real labels, contrast checked; the first-run check feedback in `README.md`; a commit history that shows progress.

## Hard constraints

- **Stack:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript, scaffolded with `create-next-app`. Deployed on Vercel's free Hobby plan from the student's own GitHub repo.
- **Storage:** browser `localStorage` only. No database, no backend or API routes for data, no accounts or sign-in, no external APIs (including nutrition lookup APIs). Data lives on the device the person used; "logging in" just means opening the app.
- **Dependencies:** add a package only when it's clearly needed, and ask first. Push back on a database, auth, state-management libraries or UI kits.
- **Dev machine:** Windows. Use `npm` (`npm run dev`, `npm run build`, `npm run lint`).

## Design rules (from the brief)

- **Flows first.** Three flows: first visit, main task (logging food), coming back (your last 7 days and suggestions). Each step is its own route; see `flows.md`.
- **The first visit is the onboarding.** Someone new understands what the tool is for and does something useful right away. Learn by doing: no tours, no dead-end empty screens.
- **Forms:** one column; a visible `<label>` on every field; errors sit next to the field and say what to do next ("Enter your weight in pounds", not "Invalid input"); never clear what the person typed when there's an error.
- **Shared components:** buttons, inputs, fields (label + hint + error) and navigation are built once in `components/` and used everywhere.
- **Navigation:** it's always clear where you are (active nav item, page title) and how to get back.
- **Accessibility:** everything works with a keyboard and has a visible focus state; real labels; text contrast checked with the agent (WCAG AA: 4.5:1 for body text).
- **Simplicity:** cut any step, field or tap that doesn't earn its place.

## Domain notes

Targets are estimates for maintaining weight, not medical advice. Say so once in the UI, plainly. The full target table is in `flows.md`.

- **All targets** follow `research/nutrition-targets.md` (sources cited there); don't change a rule without updating that file. Calories use the National Academies 2023 energy equations by sex and activity level (±10%); protein is per kg of body weight; calcium, iron and vitamin C have upper limits.
- **Rolling 7-day window:** every nutrient is judged on its average over today and the 6 days before; daily ranges are only a guide. The full rules (complete days, the 40% "looks incomplete" threshold, first-week stages, the 14-day weekend trend) are in `flows.md` under "How the 7-day window works". Keep this logic in pure functions in `lib/`.
- **Unknown values:** only food name, date, calories, protein, carbs and fat are required. A blank optional nutrient is unknown, not zero, and summaries say how many foods they're based on.
- **Common foods:** a static, bundled list (about 40 foods) with all 11 nutrients per standard serving. Values come from USDA FoodData Central, cited in the data file.

## Code conventions

- `app/` for routes, `components/` for shared UI, `lib/` for pure logic (target math, weekly summaries, suggestions, storage).
- All `localStorage` access goes through one module (`lib/storage.ts`). Store a `version` field so the saved shape can be migrated. Read only on the client, and handle missing or corrupt data without crashing.
- Keep target math, weekly summaries and suggestion rules in pure functions so they're easy to check.
- Tests: `npm test` runs Node's built-in test runner on `lib/**/*.test.ts` (Node 24 strips the types; no test package). Files in `lib/` import each other with the `.ts` extension (`./targets.ts`) so Node can run them directly; app code imports them as `@/lib/...`.
- Saved data and the current date are read only in the browser (`useSavedData()` returns null on the server). Reading either during server rendering breaks the build under Cache Components.
- Commit after each meaningful step, with a message that says what changed and why.

## Decisions log

- 2026-10-17: Tool chosen: a balanced-diet tracker with maintenance targets, daily logging and a weekly review.
- 2026-10-18 (flow session, in plan mode):
  - First visit: set up first, then log. Your personal ranges are the first useful thing, followed by a one-tap first log.
  - Nutrients: calories, protein, carbs, fat, fiber, added sugar, sodium, potassium, calcium, iron, vitamin A, vitamin C. "Sugar" means added sugar, the kind labels list and guidelines cover.
  - "Log weekly" means catching up on past days. The log form's date defaults to today.
  - Extras kept: common-foods quick add, recent foods in one tap, missed-day nudge, edit and delete with undo.
  - Routes: `/`, `/setup`, `/targets`, `/today`, `/log`, `/week`. Shared nav: Today · Log · Week · Targets.
- 2026-10-18 (onboarding research, step 3): studied MyFitnessPal, MyNetDiary and Noom (`research/onboarding-research.md`). Borrowing:
  - First visit: "why we ask" hints on sensitive setup fields; ⓘ info buttons on the ranges page that explain each range and its calculation (not always on screen); an inline "First food logged" message.
  - Logging: one-tap add with Undo and remembered serving size; bars show grams and what's left (going over a minimum is never red); "what it adds" tags instead of good/bad colors.
  - Coming back: suggestions with a one-tap fix; mark a day complete (half-logged days are flagged and left out of averages); weekend vs. weekday trend; days logged instead of streaks.
  - Not chosen for now: copy yesterday's food.
- 2026-10-18 (student's idea): judge nutrients on a **rolling 7-day window** (today and the 6 days before), not Monday–Sunday weeks. Daily ranges stay as a guide.
  - Only complete days count. Today counts once marked complete, or at midnight. Unlogged days are gaps, not zeros.
  - Suggestions refresh daily, from complete days only.
  - The first week unlocks in stages: averages after day 1, suggestions after 3 complete days, the full window on day 7, and the weekend trend once 14 days hold enough data.
  - "Load a sample 2 weeks" on `/targets` (with an on-page confirmation) so later features can be demoed.
  - `/week` is now "Last 7 days". Shared nav: Today · Log · Last 7 days · Targets.
- 2026-10-18 (design): chose the **Market Stand** direction from four mood boards (others: Nutrition Label, Steady Band, Riso Plate). Tokens and component rules are in `design.md`. Images, if any, come from Codex `$imagegen` and are saved as static files in `public/images/`. Codex is used only for images, never for code, so two agents don't edit the same files.
- 2026-10-18 (build): foundation done (theme, shared components, nav, route stubs). First visit done: setup form with validation, target math with tests, "Your ranges" with ⓘ explanations, saving, and redirects (welcome ↔ Today; nav only after setup). Ages 19–100 only, because the RDA tables used start at 19.
- 2026-10-18 (student): setup asks for date of birth (ages 18–100, checked to the day) instead of age, and adds a non-binary option (calories: midpoint of the female and male Mifflin-St Jeor equations; vitamins and minerals: the higher value). The welcome screen is an animated card (pop-in, stickers dropping on; still for reduced motion) with three steps and Get started.
- 2026-10-18 (build): logging done. 41 common foods from USDA FoodData Central (`lib/foods-data.ts`, fdcId on each); "what it adds" tags use the FDA good-source rule (≥10% Daily Value); Add food has date (catch-up), search, recent foods, common foods by category and a custom-food form; Today has calorie and nutrient bars, vitamins and minerals (collapsed), foods with servings and Remove, Undo messages that pause on hover or focus, Mark day complete, and the first-food note.
- 2026-10-18 (student): removed added sugar as a tracked nutrient. 11 nutrients now: calories, protein, carbs, fat, fiber, sodium, potassium, calcium, iron, vitamin A, vitamin C.
- 2026-10-18 (research): targets rebuilt on cited sources (`research/nutrition-targets.md`): NASEM 2023 energy equations instead of Mifflin-St Jeor × unsourced activity factors; protein 0.8–1.6 g/kg (age and activity adjusted, 2.0 if very active); carbs at least 130 g; fat 25–35% at 18; upper limits for calcium, iron, vitamin C. Activity labels now match the NASEM levels.
- 2026-10-18 (student): foods use natural units, not "servings": count (2 eggs, 1 slice), scoop (½ cup, 2 tbsp) or weigh (3 oz, with size hints); custom foods are "portions" (`lib/amounts.ts`, units in `lib/foods.ts`). Today shows plain totals only, with no targets; ranges, bars and judgments live on Last 7 days and a new History page (pick a day → the 7 days ending on it), because single days vary with events and meals out.
- 2026-10-18 (student): search shows a suggestion dropdown (ARIA combobox). Whole foods show bare numbers in the amount picker (1, ½, 2); measured foods keep units. Recipes: paste recipe text (per-serving nutrition panel is parsed; links can't be fetched, no APIs) or build from ingredients; logged by the serving (`lib/recipe.ts`, `/recipes`). Today and Add food merged into one Food log page (`/log`): day picker for today and the 6 days before, totals and foods on the left, add-food panel on the right; `/today` forwards to it. Nav: Food log · Last 7 days · History · Targets.
- 2026-10-18 (student): Last 7 days folded into the Food log as a collapsible "Your 7 days" panel under the day picker (inline disclosure rather than a drawer, so it doesn't cover the log; open state remembered per browser). It shows the 7 days ending on the picked day. `/week` forwards to `/log`; nav is Food log · History · Targets. Add food is one button that opens search ("Cancel" closes it).
- 2026-10-18 (student): the 7-day panel is titled "Dietary stats".
- 2026-10-18 (student): the logging page became **This week** (`/log`), modeled on Strava's profile tabs: a header "+ Add food" (opens a panel with a 7-day picker and search), and two tabs, Progress (7-day averages and day strip; the separate "looks incomplete" note was dropped since the yellow dot says it) and Foods (a card per day with its foods, status, Mark complete toggle and + Add). Nav: This week · History · Targets.
- 2026-10-18 (student): History shows high-level stats only for the 7 days ending on the picked day (default today): score card with the 7 badges, a Calories by day chart and a macro split chart (colors #2E8048 / #D29A12 / #B04E2C, validated with the dataviz palette checker; every segment labeled). No food log there.
- 2026-10-19 (student): no "X of 11 in range" or "N of 7 days logged" text. Each day badge is a ring that fills with the share of that day's nutrients in range, with a ✓ at 80%+ (screen readers get the counts in words). History uses an inline month calendar (`components/WeekCalendar.tsx`) instead of the browser date picker, which popped over the page.
- 2026-10-19 (student): Progress tab is the week ribbons (concept 6); Add food is a modal pop-up with a blurred backdrop; days open in a slide-in side panel (concept 1); nutrient rows expand to weekly detail. Modals use the native <dialog> (`components/ui/Dialog.tsx`) for focus trapping, Escape and focus return.
- Next: suggestions with one-tap fixes on Last 7 days, the weekend vs. weekday trend, sample data, then deploy to Vercel and run the first-run check.
