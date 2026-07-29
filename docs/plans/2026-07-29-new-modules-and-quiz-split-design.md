# Design: Dice roller, Nærmest tusen, Elevtrekker-historikk, Quiz-arena create/play split

Date: 2026-07-29

## Goals

- New module: **Terningkast** (dice roller) — configurable number and type of dice, similar to Google's dice roller.
- New module: **Nærmest tusen** — draws 9 digits (0–9) over 9 rounds; students build their own 3×3 grid on paper to get closest to 1000; app shows draw history and, once done, the mathematically optimal arrangement as a "fasit".
- **Elevtrekker** gains a visible draw-history sidebar showing the full class roster with drawn students marked.
- **Quiz-arena** is split into a quiz *editor* (create/save/edit quizzes with flexible category and point-level counts) and a *player* (run a saved quiz), with quizzes persisted so a teacher can build a library over time.

## Store changes

`src/store/useAppStore.js` gains a new persisted slice:

```js
quizzes: {}, // id -> { id, name, categories: string[], points: number[], cells: { "catIdx-points": { question, answer } } }
createQuiz: (name) => id,
updateQuiz: (id, partial) => void,
deleteQuiz: (id) => void,
```

Added to `partialize` alongside `classes`, `activeClassId`, `drawnStudents`, `settings`.

No store changes are needed for the dice roller or Nærmest tusen — both are ephemeral, session-only state local to their components (matching how `Jeopardy`'s board state works today).

## 1. Terningkast (dice roller)

New `src/modules/DiceRoller.jsx`, registered as module id `dice`.

- Controls: number of dice (1–6, stepper) and sides per die (d4/d6/d8/d10/d12/d20, button group). Local `useState`, not persisted.
- "Kast"-button runs a short randomized tick animation (reusing the `tick`/`tada` sound pattern already in `src/lib/sound.js`, respecting `prefers-reduced-motion` like `SpinWheel` does) then settles on final per-die values.
- Results shown as a row of die tiles plus the sum.
- Dashboard card: `Dices` icon (already used by Elevtrekker — pick a distinct lucide icon, e.g. `Dice5`), title "Terningkast".

## 2. Nærmest tusen

New `src/modules/NearestThousand.jsx`, registered as module id `nearestthousand`.

- Local state: `draws` (array of up to 9 digits 0–9), derived round counter "Kast X av 9".
- "Neste kast" button draws a random digit 0–9, appends to `draws`, disabled once `draws.length === 9`.
- History strip shows all drawn digits in order (chips), so students can copy them onto their own paper grid — the app itself has no digital placement grid.
- "Nullstill" resets `draws`.
- Once 9 digits are drawn, compute and display the optimal 3×3 "fasit" grid + resulting sum + difference from 1000.

**Fasit math:** a 3×3 grid of three 3-digit numbers sums to `100·(col0 sum) + 10·(col1 sum) + 1·(col2 sum)`. Only which 3 of the 9 digits land in the hundreds/tens/units column affects the total; row placement within a column doesn't change the sum. So: brute-force every way to split the 9 drawn digits into three labeled groups of 3 (hundreds/tens/units — ≤1680 combinations, computed instantly client-side), pick the split minimizing `|total - 1000|`, then arrange the winning groups into a 3×3 grid (any row pairing works since order within a column doesn't affect the sum) for display.

- Dashboard card: an icon like `Hash` or `Target`, title "Nærmest tusen".

## 3. Elevtrekker historikk

`src/modules/SpinWheel.jsx` changes from a single centered column to a two-column layout:

- Left (existing): draw display, "Trekk elev" / "Nullstill" buttons, "fjern etter trekning" checkbox.
- Right (new): full class roster list, each entry marked with its draw order number + a checkmark/strikethrough style once drawn, sourced from the existing `drawnStudents[activeClassId]` store state — no new store fields needed.

## 4. Quiz-arena: create vs. play

`src/modules/Jeopardy.jsx` is renamed `QuizArena.jsx` and becomes a small internal router (local `useState` view: `"list" | "edit" | "play"`) rather than a new top-level module — `jeopardy` module id is unchanged in `App.jsx`.

- **List view**: cards for each saved quiz (name, category/points counts) with Spill / Rediger / Slett actions, plus "Ny quiz".
- **Editor view**: quiz name field; add/remove category columns and point-level rows freely (replacing today's fixed `DEFAULT_CATEGORY_NAMES`/`POINTS` constants); a question + answer text field per cell (`cells["catIdx-points"]`). Saves via `updateQuiz`/`createQuiz` into the store.
- **Play view**: today's board experience (open cell → show question → reveal answer → award/deduct points per team), sourced from the selected quiz's `categories`/`points`/`cells`. Board "used" state and team scores are session-local (`useState`, reset each time Play is entered) and are never written back to the saved quiz definition.

## Out of scope

- No digital 3×3 placement grid for students in Nærmest tusen — paper/whiteboard only, app shows draws + fasit.
- No persistence of dice-roller settings or Nærmest tusen round state across sessions.
- No multi-user/network play for Quiz-arena — same single-device model as today.
- No changes to Nedtelling or Klasseliste modules.
