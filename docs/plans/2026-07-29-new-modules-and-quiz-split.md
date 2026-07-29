# New Modules & Quiz-arena Split Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Terningkast (dice roller) module, a Nærmest tusen module, a draw-history sidebar in Elevtrekker, and split Quiz-arena into separate create/edit and play experiences with persisted, named quizzes.

**Architecture:** Two new standalone modules (`DiceRoller`, `NearestThousand`) registered like the existing five; `SpinWheel` gains a sidebar sourced from existing store state; `Jeopardy.jsx` is replaced by a `src/modules/quiz/` folder with a small router (`QuizArena`) over three views (`QuizList`, `QuizEditor`, `QuizPlayer`), backed by a new persisted `quizzes` slice in the Zustand store.

**Tech Stack:** React 19, Zustand (persisted via `tauri-plugin-store`), Tailwind v4, lucide-react icons. See `docs/plans/2026-07-29-new-modules-and-quiz-split-design.md` for the approved design.

**Testing note:** This project has no automated test runner configured (no vitest/jest in `package.json`), and none of the existing modules have tests. Rather than bolting on a new test framework mid-feature, each task below is verified manually — `npm run dev` + interacting in the browser — matching how the existing baseline was built. The one piece of pure logic (the "fasit" math in Task 2) is additionally sanity-checked with a quick `node` one-liner before it's wired into UI, since that's cheap and catches arithmetic bugs early.

**Data model refinement vs. the design doc:** the design doc's quiz shape uses `categories: string[]` / `points: number[]` with cell keys `"catIdx-points"`. Implementing that literally means every category/point removal has to reindex all cell keys for surviving columns/rows — fiddly and bug-prone. This plan instead gives categories and points stable ids (`{ id, name }` / `{ id, value }`) and keys cells as `"catId-pointId"`, so removing one column/row never disturbs any other. Same user-facing behavior, simpler removal logic.

---

### Task 1: Add persisted `quizzes` slice to the store

**Files:**
- Modify: `src/store/useAppStore.js`

**Step 1: Add the quiz state and actions**

Insert after the `settings` block (after line 63, before the closing of the store creator function):

```js
      quizzes: {},

      createQuiz: (name) => {
        const id = crypto.randomUUID();
        set((s) => ({
          quizzes: {
            ...s.quizzes,
            [id]: {
              id,
              name,
              categories: [
                { id: crypto.randomUUID(), name: "Kategori 1" },
                { id: crypto.randomUUID(), name: "Kategori 2" },
              ],
              points: [
                { id: crypto.randomUUID(), value: 100 },
                { id: crypto.randomUUID(), value: 200 },
                { id: crypto.randomUUID(), value: 300 },
              ],
              cells: {},
            },
          },
        }));
        return id;
      },

      updateQuiz: (id, partial) =>
        set((s) => ({
          quizzes: { ...s.quizzes, [id]: { ...s.quizzes[id], ...partial } },
        })),

      deleteQuiz: (id) =>
        set((s) => {
          const quizzes = { ...s.quizzes };
          delete quizzes[id];
          return { quizzes };
        }),
```

**Step 2: Persist `quizzes`**

In the `partialize` function (currently lines 68-73), add `quizzes: s.quizzes,` alongside the existing fields:

```js
      partialize: (s) => ({
        classes: s.classes,
        activeClassId: s.activeClassId,
        drawnStudents: s.drawnStudents,
        settings: s.settings,
        quizzes: s.quizzes,
      }),
```

**Step 3: Verify**

Run: `npm run dev`, open the app in the browser, open devtools console, and run:

```js
useAppStore.getState().createQuiz("Test")
```

This won't be available on `window` by default — instead just confirm the app still starts with no console errors (the store change is exercised properly in Task 6-9's manual verification). If you want an immediate check, temporarily add `window.useAppStore = useAppStore` at the bottom of `src/store/useAppStore.js`, run the snippet above in devtools, confirm it returns a uuid and `useAppStore.getState().quizzes` has one entry, then remove the temporary line.

**Step 4: Commit**

```bash
git add src/store/useAppStore.js
git commit -m "feat: add persisted quizzes slice to store"
```

---

### Task 2: "Nærmest tusen" math helper

**Files:**
- Create: `src/lib/nearestThousand.js`

**Step 1: Write the pure function**

```js
function combinations(items, k) {
  const results = [];
  function helper(start, combo) {
    if (combo.length === k) {
      results.push(combo);
      return;
    }
    for (let i = start; i < items.length; i++) {
      helper(i + 1, [...combo, items[i]]);
    }
  }
  helper(0, []);
  return results;
}

export function findClosestArrangement(digits) {
  if (digits.length !== 9) {
    throw new Error("findClosestArrangement requires exactly 9 digits");
  }

  const indices = digits.map((_, i) => i);
  let best = null;

  for (const hIdx of combinations(indices, 3)) {
    const remaining = indices.filter((i) => !hIdx.includes(i));
    for (const tIdx of combinations(remaining, 3)) {
      const uIdx = remaining.filter((i) => !tIdx.includes(i));
      const hSum = hIdx.reduce((a, i) => a + digits[i], 0);
      const tSum = tIdx.reduce((a, i) => a + digits[i], 0);
      const uSum = uIdx.reduce((a, i) => a + digits[i], 0);
      const total = hSum * 100 + tSum * 10 + uSum;
      const diff = Math.abs(total - 1000);
      if (!best || diff < best.diff) {
        best = {
          diff,
          total,
          hundreds: hIdx.map((i) => digits[i]),
          tens: tIdx.map((i) => digits[i]),
          units: uIdx.map((i) => digits[i]),
        };
      }
    }
  }

  const rows = [0, 1, 2].map((r) => [
    best.hundreds[r],
    best.tens[r],
    best.units[r],
  ]);

  return { rows, total: best.total, difference: best.total - 1000 };
}
```

**Step 2: Sanity-check with node**

Run:

```bash
node -e "
const { findClosestArrangement } = require('./src/lib/nearestThousand.js');
" 2>&1 || true
```

That will fail because the file uses ESM `export`. Instead verify interactively:

```bash
node --input-type=module -e "
import { findClosestArrangement } from './src/lib/nearestThousand.js';
console.log(findClosestArrangement([9,9,9,0,0,0,0,0,0]));
console.log(findClosestArrangement([3,3,3,3,3,3,3,3,3]));
console.log(findClosestArrangement([1,2,3,4,5,6,7,8,9]));
"
```

Expected: first call's `total` is close to 999 (three 9-hundreds-ish arrangement is impossible with only three 9s, but the search should still find the split minimizing distance to 1000 — eyeball that `Math.abs(total-1000) <= Math.abs(anyOtherObviousSplit-1000)`); second call gives exactly `total: 999` (333+333+333); third call runs without throwing and returns a `rows`/`total`/`difference` shape. No exceptions in any case.

**Step 3: Commit**

```bash
git add src/lib/nearestThousand.js
git commit -m "feat: add nearest-to-1000 arrangement solver"
```

---

### Task 3: Nærmest tusen module

**Files:**
- Create: `src/modules/NearestThousand.jsx`
- Modify: `src/App.jsx`
- Modify: `src/modules/Dashboard.jsx`

**Step 1: Create the component**

```jsx
import { useState } from "react";
import { Hash, RotateCcw } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playSound } from "../lib/sound";
import { findClosestArrangement } from "../lib/nearestThousand";

const TOTAL_ROUNDS = 9;

function NearestThousand() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const [draws, setDraws] = useState([]);

  const done = draws.length === TOTAL_ROUNDS;
  const fasit = done ? findClosestArrangement(draws) : null;

  function drawNext() {
    if (done) return;
    const digit = Math.floor(Math.random() * 10);
    const next = [...draws, digit];
    setDraws(next);
    playSound(next.length === TOTAL_ROUNDS ? "tada" : "tick", soundEnabled);
  }

  function reset() {
    setDraws([]);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
      <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
        Nærmest tusen
      </h2>
      <p className="mb-8 text-lg text-ink/70">
        Kast {draws.length} av {TOTAL_ROUNDS} — bygg et 3×3-rutenett med tre
        tresifrede tall som kommer nærmest 1000.
      </p>

      <div className="mb-8 flex min-h-[120px] w-full flex-wrap items-center justify-center gap-3 rounded-xl2 border-2 border-ink/10 bg-surface px-8 py-8 shadow-clay">
        {draws.length === 0 ? (
          <span className="font-heading text-2xl text-ink/50">
            Klar for første kast?
          </span>
        ) : (
          draws.map((d, i) => (
            <span
              key={i}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 font-heading text-2xl font-bold text-primary"
            >
              {d}
            </span>
          ))
        )}
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={drawNext}
          disabled={done}
          className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Hash size={24} aria-hidden="true" />
          {done ? "Alle kast trukket" : "Neste kast"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <RotateCcw size={22} aria-hidden="true" />
          Nullstill
        </button>
      </div>

      {fasit && (
        <div className="w-full rounded-xl2 border-2 border-accent-lime/40 bg-accent-lime/10 p-6">
          <h3 className="mb-4 font-heading text-2xl font-semibold text-ink">
            Fasit — nærmeste mulige sum
          </h3>
          <div className="mx-auto mb-4 grid w-fit grid-cols-3 gap-2">
            {fasit.rows.map((row, r) =>
              row.map((digit, c) => (
                <span
                  key={`${r}-${c}`}
                  className="flex h-14 w-14 items-center justify-center rounded-xl2 border-2 border-accent-lime/50 bg-surface font-heading text-2xl font-bold text-ink"
                >
                  {digit}
                </span>
              ))
            )}
          </div>
          <p className="font-heading text-xl font-semibold text-ink">
            Sum: {fasit.total} ({fasit.difference >= 0 ? "+" : ""}
            {fasit.difference} fra 1000)
          </p>
        </div>
      )}
    </div>
  );
}

export default NearestThousand;
```

**Step 2: Register the module in `src/App.jsx`**

Add the import alongside the others, and add `nearestthousand: NearestThousand,` to `MODULE_COMPONENTS`.

**Step 3: Add a Dashboard card in `src/modules/Dashboard.jsx`**

Add `Hash` to the `lucide-react` import, and append to `MODULES`:

```js
  {
    id: "nearestthousand",
    icon: Hash,
    title: "Nærmest tusen",
    description: "Trekk 9 siffer og kom nærmest 1000.",
    accent: "peach",
  },
```

**Step 4: Verify manually**

Run `npm run dev`, open the app, click into "Nærmest tusen" from the dashboard, click "Neste kast" 9 times, confirm: the history strip fills up left-to-right, the button disables after the 9th draw, and a fasit grid + sum appears. Click "Nullstill" and confirm it clears back to the empty state.

**Step 5: Commit**

```bash
git add src/App.jsx src/modules/Dashboard.jsx src/modules/NearestThousand.jsx
git commit -m "feat: add Nærmest tusen module"
```

---

### Task 4: Terningkast (dice roller) module

**Files:**
- Create: `src/modules/DiceRoller.jsx`
- Modify: `src/App.jsx`
- Modify: `src/modules/Dashboard.jsx`

**Step 1: Create the component**

```jsx
import { useState } from "react";
import { Dice5, Minus, Plus } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playSound } from "../lib/sound";

const SIDE_OPTIONS = [4, 6, 8, 10, 12, 20];
const ROLL_STEPS = 10;
const ROLL_BASE_DELAY = 60;

function rollOne(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function DiceRoller() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const [numDice, setNumDice] = useState(2);
  const [sides, setSides] = useState(6);
  const [values, setValues] = useState(null);
  const [rolling, setRolling] = useState(false);

  function roll() {
    if (rolling) return;
    setRolling(true);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const final = Array.from({ length: numDice }, () => rollOne(sides));

    if (prefersReduced) {
      setValues(final);
      setRolling(false);
      playSound("tada", soundEnabled);
      return;
    }

    let step = 0;
    const runStep = () => {
      setValues(Array.from({ length: numDice }, () => rollOne(sides)));
      playSound("tick", soundEnabled);
      step += 1;
      if (step < ROLL_STEPS) {
        setTimeout(runStep, ROLL_BASE_DELAY + step * 8);
      } else {
        setValues(final);
        setRolling(false);
        playSound("tada", soundEnabled);
      }
    };
    runStep();
  }

  const sum = values?.reduce((a, b) => a + b, 0) ?? null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
      <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
        Terningkast
      </h2>
      <p className="mb-8 text-lg text-ink/70">
        Velg antall terninger og type, og kast.
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-6">
        <div className="flex items-center gap-3">
          <span className="font-heading font-semibold text-ink">Antall</span>
          <button
            type="button"
            onClick={() => setNumDice((n) => Math.max(1, n - 1))}
            aria-label="Færre terninger"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-colors hover:bg-ink/5"
          >
            <Minus size={20} aria-hidden="true" />
          </button>
          <span className="w-8 font-heading text-2xl font-bold text-primary">
            {numDice}
          </span>
          <button
            type="button"
            onClick={() => setNumDice((n) => Math.min(6, n + 1))}
            aria-label="Flere terninger"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-colors hover:bg-ink/5"
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SIDE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSides(s)}
              className={`min-h-touch cursor-pointer rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
                sides === s
                  ? "border-primary bg-primary text-white"
                  : "border-ink/10 text-ink hover:bg-ink/5"
              }`}
            >
              d{s}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 flex min-h-[160px] w-full flex-wrap items-center justify-center gap-4 rounded-xl2 border-2 border-ink/10 bg-surface px-8 py-10 shadow-clay">
        {values ? (
          values.map((v, i) => (
            <span
              key={i}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 font-heading text-3xl font-bold text-primary"
            >
              {v}
            </span>
          ))
        ) : (
          <span className="font-heading text-2xl text-ink/50">
            Klar for å kaste?
          </span>
        )}
      </div>

      {sum !== null && numDice > 1 && (
        <p className="mb-6 font-heading text-xl font-semibold text-ink">
          Sum: {sum}
        </p>
      )}

      <button
        type="button"
        onClick={roll}
        disabled={rolling}
        className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Dice5 size={26} aria-hidden="true" />
        {rolling ? "Kaster…" : "Kast"}
      </button>
    </div>
  );
}

export default DiceRoller;
```

**Step 2: Register the module in `src/App.jsx`**

Add the import and `dice: DiceRoller,` to `MODULE_COMPONENTS`.

**Step 3: Add a Dashboard card in `src/modules/Dashboard.jsx`**

Add `Dice5` to the `lucide-react` import, and append to `MODULES`:

```js
  {
    id: "dice",
    icon: Dice5,
    title: "Terningkast",
    description: "Kast en eller flere terninger.",
    accent: "coral",
  },
```

**Step 4: Verify manually**

Run `npm run dev`, open "Terningkast", change the dice count and side count, click "Kast" repeatedly, confirm the tick/settle animation runs, values land within the selected side range, and the sum only shows when more than 1 die is selected.

**Step 5: Commit**

```bash
git add src/App.jsx src/modules/Dashboard.jsx src/modules/DiceRoller.jsx
git commit -m "feat: add Terningkast dice roller module"
```

---

### Task 5: Elevtrekker draw-history sidebar

**Files:**
- Modify: `src/modules/SpinWheel.jsx`

**Step 1: Replace the return statement's outer wrapper and add a roster sidebar**

Replace the JSX from the opening `<div className="mx-auto flex max-w-2xl flex-col items-center text-center">` (line 94) through its closing `</div>` (line 141) with a two-column layout — the existing content becomes the left column, unchanged internally, and a new `<aside>` is added as the right column:

```jsx
    <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col items-center text-center">
        <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
          Elevtrekker
        </h2>
        <p className="mb-8 text-lg text-ink/70">
          {pool.length} av {students.length} elever igjen å trekke
        </p>

        <div className="mb-8 flex min-h-[160px] w-full items-center justify-center rounded-xl2 border-2 border-ink/10 bg-surface px-8 py-10 shadow-clay">
          <span className="font-heading text-4xl font-bold text-primary">
            {allDrawn
              ? "Alle har blitt trukket! 🎉"
              : (displayName ?? winner ?? "Klar for å trekke?")}
          </span>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={draw}
            disabled={spinning || allDrawn || pool.length === 0}
            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Dices size={26} aria-hidden="true" />
            {spinning ? "Trekker…" : "Trekk elev"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            <RotateCcw size={22} aria-hidden="true" />
            Nullstill
          </button>
        </div>

        <label className="flex cursor-pointer items-center gap-3 font-body text-lg text-ink">
          <input
            type="checkbox"
            checked={removeAfterDraw}
            onChange={(e) => setRemoveAfterDraw(e.target.checked)}
            className="h-6 w-6 cursor-pointer accent-primary"
          />
          Fjern elev etter trekning (alle trekkes etter tur)
        </label>
      </div>

      <aside className="w-full shrink-0 rounded-xl2 border-2 border-ink/10 bg-surface p-5 text-left shadow-clay lg:w-72">
        <h3 className="mb-4 font-heading text-xl font-semibold text-ink">
          Trekkhistorikk
        </h3>
        <ul className="flex flex-col gap-2">
          {students.map((name) => {
            const order = drawnStudents.indexOf(name);
            const isDrawn = order !== -1;
            return (
              <li
                key={name}
                className={`flex items-center gap-3 rounded-xl2 px-3 py-2 font-body text-base ${
                  isDrawn
                    ? "bg-accent-lime/10 text-ink/60 line-through"
                    : "text-ink"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold ${
                    isDrawn
                      ? "bg-accent-lime/40 text-ink"
                      : "bg-ink/5 text-ink/40"
                  }`}
                >
                  {isDrawn ? order + 1 : ""}
                </span>
                {name}
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
```

**Step 2: Verify manually**

Run `npm run dev`, go to Klasseliste and ensure a class has students, open Elevtrekker, confirm the roster sidebar lists every student unmarked, click "Trekk elev" a few times and confirm drawn students get a numbered badge + strikethrough in the sidebar in draw order, and "Nullstill" clears the sidebar's marks too.

**Step 3: Commit**

```bash
git add src/modules/SpinWheel.jsx
git commit -m "feat: show draw history sidebar in Elevtrekker"
```

---

### Task 6: Quiz-arena — list view

**Files:**
- Create: `src/modules/quiz/QuizList.jsx`

**Step 1: Create the component**

```jsx
import { Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function QuizList({ onEdit, onPlay }) {
  const quizzes = useAppStore((s) => s.quizzes);
  const createQuiz = useAppStore((s) => s.createQuiz);
  const deleteQuiz = useAppStore((s) => s.deleteQuiz);

  const list = Object.values(quizzes);

  function handleNewQuiz() {
    const name = `Quiz ${list.length + 1}`;
    const id = createQuiz(name);
    onEdit(id);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-ink">
          Quiz-arena
        </h2>
        <button
          type="button"
          onClick={handleNewQuiz}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={20} aria-hidden="true" />
          Ny quiz
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-lg text-ink/60">
          Ingen quizer laget ennå. Klikk «Ny quiz» for å komme i gang.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((quiz) => (
            <li
              key={quiz.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay"
            >
              <div>
                <p className="font-heading text-xl font-semibold text-ink">
                  {quiz.name}
                </p>
                <p className="text-base text-ink/60">
                  {quiz.categories.length} kategorier ·{" "}
                  {quiz.points.length} poengnivåer
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPlay(quiz.id)}
                  className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-4 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <Play size={18} aria-hidden="true" />
                  Spill
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(quiz.id)}
                  className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  <Pencil size={18} aria-hidden="true" />
                  Rediger
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuiz(quiz.id)}
                  aria-label={`Slett ${quiz.name}`}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default QuizList;
```

**Step 2: Commit**

This component isn't wired up yet (no router exists to render it), so defer verification to Task 9. Stage it now:

```bash
git add src/modules/quiz/QuizList.jsx
git commit -m "feat: add quiz list view"
```

---

### Task 7: Quiz-arena — editor view

**Files:**
- Create: `src/modules/quiz/QuizEditor.jsx`

**Step 1: Create the component**

```jsx
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function makeId() {
  return crypto.randomUUID();
}

function QuizEditor({ quizId, onDone }) {
  const quiz = useAppStore((s) => s.quizzes[quizId]);
  const updateQuiz = useAppStore((s) => s.updateQuiz);

  if (!quiz) return null;

  function setCell(catId, pointId, partial) {
    const key = `${catId}-${pointId}`;
    updateQuiz(quizId, {
      cells: {
        ...quiz.cells,
        [key]: { ...quiz.cells[key], ...partial },
      },
    });
  }

  function addCategory() {
    updateQuiz(quizId, {
      categories: [
        ...quiz.categories,
        { id: makeId(), name: `Kategori ${quiz.categories.length + 1}` },
      ],
    });
  }

  function removeCategory(catId) {
    const cells = { ...quiz.cells };
    Object.keys(cells)
      .filter((k) => k.startsWith(`${catId}-`))
      .forEach((k) => delete cells[k]);
    updateQuiz(quizId, {
      categories: quiz.categories.filter((c) => c.id !== catId),
      cells,
    });
  }

  function renameCategory(catId, name) {
    updateQuiz(quizId, {
      categories: quiz.categories.map((c) =>
        c.id === catId ? { ...c, name } : c
      ),
    });
  }

  function addPointLevel() {
    const maxValue = quiz.points.reduce((m, p) => Math.max(m, p.value), 0);
    updateQuiz(quizId, {
      points: [...quiz.points, { id: makeId(), value: maxValue + 100 }],
    });
  }

  function removePointLevel(pointId) {
    const cells = { ...quiz.cells };
    Object.keys(cells)
      .filter((k) => k.endsWith(`-${pointId}`))
      .forEach((k) => delete cells[k]);
    updateQuiz(quizId, {
      points: quiz.points.filter((p) => p.id !== pointId),
      cells,
    });
  }

  function renamePointValue(pointId, value) {
    updateQuiz(quizId, {
      points: quiz.points.map((p) =>
        p.id === pointId ? { ...p, value } : p
      ),
    });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onDone}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
          aria-label="Tilbake til quizliste"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <input
          value={quiz.name}
          onChange={(e) => updateQuiz(quizId, { name: e.target.value })}
          className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-heading text-2xl font-semibold text-ink"
        />
        <button
          type="button"
          onClick={addCategory}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <Plus size={18} aria-hidden="true" />
          Kategori
        </button>
        <button
          type="button"
          onClick={addPointLevel}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <Plus size={18} aria-hidden="true" />
          Poengnivå
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-2">
          <thead>
            <tr>
              <th />
              {quiz.categories.map((cat) => (
                <th key={cat.id} className="min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <input
                      value={cat.name}
                      onChange={(e) => renameCategory(cat.id, e.target.value)}
                      className="min-h-touch flex-1 rounded-xl2 border-2 border-primary/30 bg-primary/10 px-3 py-2 text-center font-heading text-lg font-semibold text-primary"
                    />
                    {quiz.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(cat.id)}
                        aria-label={`Fjern ${cat.name}`}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quiz.points.map((point) => (
              <tr key={point.id}>
                <td className="whitespace-nowrap align-top">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={point.value}
                      onChange={(e) =>
                        renamePointValue(point.id, Number(e.target.value))
                      }
                      className="min-h-touch w-20 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-heading text-lg font-semibold text-ink"
                    />
                    {quiz.points.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePointLevel(point.id)}
                        aria-label={`Fjern poengnivå ${point.value}`}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </td>
                {quiz.categories.map((cat) => {
                  const key = `${cat.id}-${point.id}`;
                  const cell = quiz.cells[key] ?? { question: "", answer: "" };
                  return (
                    <td key={key} className="align-top">
                      <textarea
                        value={cell.question}
                        onChange={(e) =>
                          setCell(cat.id, point.id, {
                            question: e.target.value,
                          })
                        }
                        placeholder="Spørsmål"
                        rows={2}
                        className="mb-2 w-full rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2 font-body text-base text-ink"
                      />
                      <textarea
                        value={cell.answer}
                        onChange={(e) =>
                          setCell(cat.id, point.id, { answer: e.target.value })
                        }
                        placeholder="Svar"
                        rows={2}
                        className="w-full rounded-xl2 border-2 border-accent-lime/40 bg-accent-lime/10 px-3 py-2 font-body text-base text-ink"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QuizEditor;
```

**Step 2: Commit**

Not yet wired up (no router); defer verification to Task 9.

```bash
git add src/modules/quiz/QuizEditor.jsx
git commit -m "feat: add quiz editor view"
```

---

### Task 8: Quiz-arena — player view

**Files:**
- Create: `src/modules/quiz/QuizPlayer.jsx`

**Step 1: Create the component**

```jsx
import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function makeInitialBoard(quiz) {
  const board = {};
  quiz.categories.forEach((cat) => {
    quiz.points.forEach((point) => {
      board[`${cat.id}-${point.id}`] = { used: false };
    });
  });
  return board;
}

function makeInitialTeams() {
  return [
    { id: "a", name: "Lag A", score: 0 },
    { id: "b", name: "Lag B", score: 0 },
  ];
}

function QuizPlayer({ quizId, onDone }) {
  const quiz = useAppStore((s) => s.quizzes[quizId]);
  const [board, setBoard] = useState(() => makeInitialBoard(quiz));
  const [teams, setTeams] = useState(makeInitialTeams);
  const [activeCell, setActiveCell] = useState(null);
  const [answerVisible, setAnswerVisible] = useState(false);

  if (!quiz) return null;

  function openCell(catId, pointId) {
    const key = `${catId}-${pointId}`;
    if (board[key].used) return;
    setActiveCell({ catId, pointId });
    setAnswerVisible(false);
  }

  function closeCell() {
    if (activeCell) {
      const key = `${activeCell.catId}-${activeCell.pointId}`;
      setBoard((b) => ({ ...b, [key]: { ...b[key], used: true } }));
    }
    setActiveCell(null);
  }

  function adjustScore(teamId, delta) {
    setTeams((ts) =>
      ts.map((t) => (t.id === teamId ? { ...t, score: t.score + delta } : t))
    );
  }

  function resetBoard() {
    setBoard(makeInitialBoard(quiz));
    setTeams(makeInitialTeams());
    setActiveCell(null);
  }

  const activePoint = activeCell
    ? quiz.points.find((p) => p.id === activeCell.pointId)
    : null;
  const activeCategory = activeCell
    ? quiz.categories.find((c) => c.id === activeCell.catId)
    : null;
  const activeCellData = activeCell
    ? quiz.cells[`${activeCell.catId}-${activeCell.pointId}`] ?? {
        question: "",
        answer: "",
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onDone}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
            aria-label="Tilbake til quizliste"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <h2 className="font-heading text-3xl font-semibold text-ink">
            {quiz.name}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {teams.map((t) => (
            <span
              key={t.id}
              className="rounded-xl2 border-2 border-ink/10 bg-surface px-5 py-2 font-heading text-xl font-semibold text-ink shadow-clay"
            >
              {t.name}: {t.score}
            </span>
          ))}
          <button
            type="button"
            onClick={resetBoard}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            <RotateCcw size={20} aria-hidden="true" />
            Nullstill brett
          </button>
        </div>
      </div>

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${quiz.categories.length}, minmax(0, 1fr))`,
        }}
      >
        {quiz.categories.map((cat) => (
          <div
            key={cat.id}
            className="min-h-touch rounded-xl2 border-2 border-primary/30 bg-primary/10 px-3 py-2 text-center font-heading text-lg font-semibold text-primary"
          >
            {cat.name}
          </div>
        ))}

        {quiz.points.map((point) =>
          quiz.categories.map((cat) => {
            const key = `${cat.id}-${point.id}`;
            const used = board[key].used;
            return (
              <button
                key={key}
                type="button"
                disabled={used}
                onClick={() => openCell(cat.id, point.id)}
                className={`min-h-[100px] cursor-pointer rounded-xl2 border-2 font-heading text-3xl font-bold shadow-clay transition-all ${
                  used
                    ? "cursor-not-allowed border-ink/5 bg-ink/5 text-ink/20"
                    : "border-secondary/30 bg-secondary/10 text-secondary hover:-translate-y-1 hover:bg-secondary/20"
                }`}
              >
                {used ? "" : point.value}
              </button>
            );
          })
        )}
      </div>

      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6">
          <div className="w-full max-w-2xl rounded-xl2 bg-surface p-8 shadow-clay">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="font-heading text-2xl font-semibold text-ink">
                {activeCategory.name} — {activePoint.value} poeng
              </h3>
              <button
                type="button"
                onClick={closeCell}
                aria-label="Lukk"
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-ink/10"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            <p className="mb-4 min-h-[80px] rounded-xl2 border-2 border-ink/10 bg-canvas p-4 font-body text-lg text-ink">
              {activeCellData.question || "Ingen spørsmål skrevet inn."}
            </p>

            <button
              type="button"
              onClick={() => setAnswerVisible((v) => !v)}
              className="mb-6 flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-5 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              {answerVisible ? (
                <EyeOff size={20} aria-hidden="true" />
              ) : (
                <Eye size={20} aria-hidden="true" />
              )}
              {answerVisible ? "Skjul svar" : "Vis svar"}
            </button>
            {answerVisible && (
              <p className="mb-6 rounded-xl2 border-2 border-accent-lime/40 bg-accent-lime/10 p-4 font-body text-lg text-ink">
                {activeCellData.answer || "Ingen fasit skrevet inn."}
              </p>
            )}

            <div className="flex flex-wrap gap-4">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2"
                >
                  <span className="font-heading font-semibold text-ink">
                    {t.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustScore(t.id, activePoint.value)}
                    aria-label={`Gi poeng til ${t.name}`}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent-lime/20 text-ink transition-colors hover:bg-accent-lime/40"
                  >
                    <Plus size={20} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustScore(t.id, -activePoint.value)}
                    aria-label={`Trekk poeng fra ${t.name}`}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent-coral/20 text-ink transition-colors hover:bg-accent-coral/40"
                  >
                    <Minus size={20} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizPlayer;
```

**Step 2: Commit**

Not yet wired up (no router); defer verification to Task 9.

```bash
git add src/modules/quiz/QuizPlayer.jsx
git commit -m "feat: add quiz player view"
```

---

### Task 9: Quiz-arena router — wire it all up, retire `Jeopardy.jsx`

**Files:**
- Create: `src/modules/quiz/QuizArena.jsx`
- Delete: `src/modules/Jeopardy.jsx`
- Modify: `src/App.jsx`
- Modify: `src/modules/Dashboard.jsx`

**Step 1: Create the router**

```jsx
import { useState } from "react";
import QuizList from "./QuizList";
import QuizEditor from "./QuizEditor";
import QuizPlayer from "./QuizPlayer";

function QuizArena() {
  const [view, setView] = useState({ mode: "list" });

  if (view.mode === "edit") {
    return (
      <QuizEditor
        quizId={view.quizId}
        onDone={() => setView({ mode: "list" })}
      />
    );
  }

  if (view.mode === "play") {
    return (
      <QuizPlayer
        quizId={view.quizId}
        onDone={() => setView({ mode: "list" })}
      />
    );
  }

  return (
    <QuizList
      onEdit={(quizId) => setView({ mode: "edit", quizId })}
      onPlay={(quizId) => setView({ mode: "play", quizId })}
    />
  );
}

export default QuizArena;
```

**Step 2: Delete the old module**

```bash
git rm src/modules/Jeopardy.jsx
```

**Step 3: Update `src/App.jsx`**

Replace:

```js
import Jeopardy from "./modules/Jeopardy";
```

with:

```js
import QuizArena from "./modules/quiz/QuizArena";
```

Replace the `jeopardy: Jeopardy,` entry in `MODULE_COMPONENTS` with `quizarena: QuizArena,`.

**Step 4: Update `src/modules/Dashboard.jsx`**

Change the `id: "jeopardy"` entry in `MODULES` to `id: "quizarena"` (title/description/icon/accent stay the same, or update the description to `"Lag og spill quiz — kategorier og poeng."` to reflect the new create/play split).

**Step 5: Update `src/components/AppShell.jsx` if it references the module id**

Grep first:

```bash
grep -rn "jeopardy" src/
```

If any reference remains outside the files already changed, update it to `quizarena`.

**Step 6: Verify manually**

Run `npm run dev`. From the dashboard, open Quiz-arena:
1. Confirm the empty list state shows "Ingen quizer laget ennå."
2. Click "Ny quiz" — confirm it creates a quiz and drops you into the editor with 2 default categories and 3 default point levels.
3. Rename the quiz, rename a category, add a category, add a point level, remove a point level, type a question and answer into a cell.
4. Click the back arrow — confirm you land on the list and the quiz shows the updated name/counts.
5. Click "Spill" — confirm the board renders with your categories/points, clicking a cell shows your question, "Vis svar" reveals your answer, awarding points updates the team score, and "Nullstill brett" resets used-cells/scores without touching your saved questions.
6. Go back to the list, click "Rediger" again, confirm your questions/answers are still there (persisted).
7. Click "Slett" on the quiz and confirm it's removed from the list.
8. Restart the dev server (or reload) and confirm the module still renders in each state without errors.

**Step 7: Commit**

```bash
git add src/modules/quiz/QuizArena.jsx src/App.jsx src/modules/Dashboard.jsx
git commit -m "feat: split Quiz-arena into create and play views"
```

---

### Task 10: Final full-app pass

**Step 1: Build check**

Run: `npm run build`
Expected: builds successfully with no errors (this also catches any leftover unused imports/typos across the modules touched above).

**Step 2: Full manual regression pass**

Run `npm run dev` and click through all six dashboard modules once each (Elevtrekker, Quiz-arena, Nedtelling, Klasseliste, Terningkast, Nærmest tusen) confirming no console errors and each module's core interaction works as verified in its own task above.

**Step 3: Update the changelog**

Add an `### Added` entry under `## [Unreleased]` in `CHANGELOG.md` describing the four changes (Terningkast module, Nærmest tusen module, Elevtrekker draw-history sidebar, Quiz-arena create/play split with persisted quizzes).

**Step 4: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update changelog for new modules and quiz-arena split"
```
