# Stians game & Timer seconds — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a seconds input to the Timer module, and ship a new "Stians game" module — a live classroom word-category round game with a category bank, letter draw, writing timer, live teacher-judged review, and a persistent cumulative scoreboard.

**Architecture:** All new game state lives in the existing persisted Zustand store (`src/store/useAppStore.js`) so it survives module switches and app restarts, matching the app's existing single-store pattern. Pure game logic (letter picking, review-turn derivation, score commit) is factored into `src/lib/stiansGame.js` so the store actions stay thin, mirroring how `src/lib/sound.js` and `src/lib/confetti.js` are already split out. The module itself is one file, `src/modules/StiansGame.jsx`, rendering different views by `stiansGame.phase`, matching the single-file-per-module convention used by `Timer.jsx`/`Jeopardy.jsx`/`SpinWheel.jsx`.

**Tech Stack:** React 19 (JSX) + Vite, Zustand (persisted via `tauri-plugin-store`), Tailwind v4 utility classes (existing design tokens: `primary`, `secondary`, `accent-lime/peach/coral`, `ink`, `surface`, `canvas`, `xl2` radius, `shadow-clay`, `min-h-touch`), `lucide-react` icons, `canvas-confetti` via `src/lib/confetti.js`.

**No automated test framework exists in this project** (no vitest, no `*.test.*` files — confirmed via `package.json` and a repo-wide glob). Per user decision, this plan uses **manual verification** (`npm run dev`, exercise the feature in the browser) instead of introducing a new test framework, matching how Timer/Jeopardy/SpinWheel were built. Each task ends with a manual-verification step instead of an automated test run, plus `npm run build` as a fast syntax/type sanity check.

**Working directory:** `.worktrees/stians-game` (branch `feature/stians-game`), already created and `npm install`ed with a clean baseline `npm run build`.

---

## Task 1: Timer — add a seconds input

**Files:**
- Modify: `src/modules/Timer.jsx`

**Step 1: Add seconds state and combine with minutes**

In `src/modules/Timer.jsx`, the component currently derives `duration`/`remaining` purely from a minutes preset or the minutes custom input (`handleCustomMinutes`, lines 51-57). Add a `seconds` piece of state and a second input, and make both the preset buttons and both custom inputs agree on a single `applyDuration(totalSeconds)` helper.

Replace lines 21-57 with:

```jsx
function Timer() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const [duration, setDuration] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customSeconds, setCustomSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          playSound("ding", soundEnabled);
          return 0;
        }
        if (prev <= 4) playSound("tick", soundEnabled);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, soundEnabled]);

  function selectPreset(seconds) {
    setRunning(false);
    setDuration(seconds);
    setRemaining(seconds);
    setCustomMinutes(Math.floor(seconds / 60));
    setCustomSeconds(seconds % 60);
  }

  function applyCustomDuration(minutes, seconds) {
    const clampedMinutes = Math.max(0, Math.min(60, Number(minutes) || 0));
    const clampedSeconds = Math.max(0, Math.min(59, Number(seconds) || 0));
    const total = clampedMinutes * 60 + clampedSeconds;
    setRunning(false);
    setDuration(total);
    setRemaining(total);
  }

  function handleCustomMinutes(e) {
    setCustomMinutes(e.target.value);
    applyCustomDuration(e.target.value, customSeconds);
  }

  function handleCustomSeconds(e) {
    setCustomSeconds(e.target.value);
    applyCustomDuration(customMinutes, e.target.value);
  }
```

Then replace the "Egendefinert" `<label>` block (original lines 98-109) with two inputs:

```jsx
        <label className="flex items-center gap-2 font-body text-lg text-ink">
          Egendefinert:
          <input
            type="number"
            min={0}
            max={60}
            value={customMinutes}
            onChange={handleCustomMinutes}
            className="min-h-touch w-20 rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2 text-center font-body text-lg text-ink"
          />
          min
          <input
            type="number"
            min={0}
            max={59}
            value={customSeconds}
            onChange={handleCustomSeconds}
            className="min-h-touch w-20 rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2 text-center font-body text-lg text-ink"
          />
          sek
        </label>
```

Leave `reset()`, `isLastTenSeconds`, `formatTime`, the preset buttons, and the start/pause/reset buttons unchanged.

**Step 2: Manual verification**

Run: `npm run dev`, open the app, go to Nedtelling.
Expected:
- Typing `2` in the minutes field and `30` in the seconds field sets the display to `02:30`.
- Clicking a preset (e.g. "5 min") resets the custom fields to `5` / `0`.
- Seconds field clamps to 0-59 (typing `90` should not produce `01:90`-style overflow — clamped to 59).
- Start/Pause/Nullstill behavior unchanged from before.

**Step 3: Build check**

Run: `npm run build`
Expected: builds with no errors.

**Step 4: Commit**

```bash
git add src/modules/Timer.jsx
git commit -m "feat: add seconds input to Timer module"
```

---

## Task 2: Pure game-logic helpers (`src/lib/stiansGame.js`)

**Files:**
- Create: `src/lib/stiansGame.js`

**Step 1: Write the helpers**

```js
export const NORWEGIAN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ".split("");

export function pickLetter(usedLetters) {
  const pool = NORWEGIAN_ALPHABET.filter((l) => !usedLetters.includes(l));
  const candidates = pool.length > 0 ? pool : NORWEGIAN_ALPHABET;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function pickRerollLetter(usedLetters, excludeLetter) {
  const pool = NORWEGIAN_ALPHABET.filter(
    (l) => !usedLetters.includes(l) && l !== excludeLetter
  );
  const candidates =
    pool.length > 0
      ? pool
      : NORWEGIAN_ALPHABET.filter((l) => l !== excludeLetter);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// The group whose turn it is to state their answer for the category
// currently being reviewed: the first group in turn order with no mark yet.
export function getCurrentReviewGroupId(stiansGame) {
  const { review, categories } = stiansGame;
  if (!review) return null;
  const category = categories[review.categoryIndex];
  return (
    review.groupOrder.find(
      (groupId) => review.marks[groupId]?.[category] === undefined
    ) ?? null
  );
}

// Folds the finished review's marks into cumulative scores, applying
// pointsPerRound per approved category and the bonus (if enabled) to the
// lead group. Returns a new stiansGame object with phase reset to "idle".
export function commitRound(stiansGame) {
  const scores = {};
  stiansGame.groups.forEach((group) => {
    const prev = stiansGame.scores[group.id] ?? { byCategory: {}, bonus: 0 };
    const byCategory = { ...prev.byCategory };
    stiansGame.categories.forEach((category) => {
      const approved =
        stiansGame.review.marks[group.id]?.[category] === true;
      const current = byCategory[category] ?? 0;
      byCategory[category] = approved
        ? current + stiansGame.pointsPerRound
        : current;
    });
    let bonus = prev.bonus;
    if (stiansGame.bonusEnabled && stiansGame.leadGroupId === group.id) {
      bonus += stiansGame.bonusPoints;
    }
    scores[group.id] = { byCategory, bonus };
  });
  return {
    ...stiansGame,
    scores,
    review: null,
    leadGroupId: null,
    phase: "idle",
  };
}

export function getGroupTotal(scores, groupId) {
  const entry = scores[groupId];
  if (!entry) return 0;
  const categoryTotal = Object.values(entry.byCategory).reduce(
    (sum, n) => sum + n,
    0
  );
  return categoryTotal + entry.bonus;
}

export function getWinner(groups, scores) {
  if (groups.length === 0) return null;
  return groups.reduce((best, group) => {
    const total = getGroupTotal(scores, group.id);
    const bestTotal = best ? getGroupTotal(scores, best.id) : -Infinity;
    return total > bestTotal ? group : best;
  }, null);
}
```

**Step 2: Manual verification**

This is pure logic with no UI yet. Verify by temporarily running it in the Vite dev console, or defer verification to Task 5-7 where these functions are exercised through the UI (acceptable since the project has no unit test runner). Skip ahead if you prefer — correctness will be visually obvious once the review UI (Task 7) is wired up.

**Step 3: Build check**

Run: `npm run build`
Expected: builds with no errors (unused-export warnings are fine — nothing imports this file yet).

**Step 4: Commit**

```bash
git add src/lib/stiansGame.js
git commit -m "feat: add pure game-logic helpers for Stians game"
```

---

## Task 3: Store — `categoryBank` and `stiansGame` slice

**Files:**
- Modify: `src/store/useAppStore.js`

**Step 1: Add imports and initial-state factory**

At the top of the file, after the existing imports, add:

```js
import { commitRound } from "../lib/stiansGame";
```

Before `export const useAppStore = ...`, add:

```js
function makeInitialStiansGame() {
  return {
    groups: [],
    categories: [],
    usedLetters: [],
    currentLetter: null,
    phase: "setup", // setup | idle | writing | reviewing | ended
    pointsPerRound: 1,
    bonusEnabled: false,
    bonusPoints: 1,
    timerSeconds: 60,
    leadGroupId: null,
    review: null, // { categoryIndex, groupOrder: string[], marks: {groupId: {category: bool}} }
    scores: {}, // { groupId: { byCategory: {category: number}, bonus: number } }
  };
}
```

**Step 2: Add state + actions inside the store**

Inside the `create(persist((set) => ({ ... }` object, after the existing `settings`/`setSettings` block (end of file, before the closing `}),`), add:

```js
      categoryBank: [],
      addCategoryToBank: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed || s.categoryBank.includes(trimmed)) return {};
          return { categoryBank: [...s.categoryBank, trimmed] };
        }),
      removeCategoryFromBank: (name) =>
        set((s) => ({
          categoryBank: s.categoryBank.filter((c) => c !== name),
        })),

      stiansGame: makeInitialStiansGame(),

      addStiansGroup: (name) =>
        set((s) => ({
          stiansGame: {
            ...s.stiansGame,
            groups: [
              ...s.stiansGame.groups,
              { id: crypto.randomUUID(), name },
            ],
          },
        })),
      renameStiansGroup: (id, name) =>
        set((s) => ({
          stiansGame: {
            ...s.stiansGame,
            groups: s.stiansGame.groups.map((g) =>
              g.id === id ? { ...g, name } : g
            ),
          },
        })),
      removeStiansGroup: (id) =>
        set((s) => {
          const scores = { ...s.stiansGame.scores };
          delete scores[id];
          return {
            stiansGame: {
              ...s.stiansGame,
              groups: s.stiansGame.groups.filter((g) => g.id !== id),
              scores,
            },
          };
        }),

      setStiansCategories: (categories) =>
        set((s) => ({ stiansGame: { ...s.stiansGame, categories } })),

      startStiansGame: () =>
        set((s) => ({ stiansGame: { ...s.stiansGame, phase: "idle" } })),

      setStiansPointsPerRound: (n) =>
        set((s) => ({
          stiansGame: { ...s.stiansGame, pointsPerRound: Math.max(1, Number(n) || 1) },
        })),
      setStiansBonusEnabled: (enabled) =>
        set((s) => ({
          stiansGame: { ...s.stiansGame, bonusEnabled: enabled },
        })),
      setStiansBonusPoints: (n) =>
        set((s) => ({
          stiansGame: { ...s.stiansGame, bonusPoints: Math.max(1, Number(n) || 1) },
        })),
      setStiansTimerSeconds: (n) =>
        set((s) => ({
          stiansGame: {
            ...s.stiansGame,
            timerSeconds: Math.max(5, Math.min(600, Number(n) || 60)),
          },
        })),

      drawStiansLetter: () =>
        set((s) => {
          const allUsed =
            s.stiansGame.usedLetters.length >= NORWEGIAN_ALPHABET.length;
          const usedLetters = allUsed ? [] : s.stiansGame.usedLetters;
          const letter = pickLetter(usedLetters);
          return {
            stiansGame: {
              ...s.stiansGame,
              currentLetter: letter,
              usedLetters: [...usedLetters, letter],
            },
          };
        }),
      rerollStiansLetter: () =>
        set((s) => {
          const { usedLetters, currentLetter } = s.stiansGame;
          const usedWithoutCurrent = usedLetters.filter(
            (l) => l !== currentLetter
          );
          const letter = pickRerollLetter(usedWithoutCurrent, currentLetter);
          return {
            stiansGame: {
              ...s.stiansGame,
              currentLetter: letter,
              usedLetters: [...usedWithoutCurrent, letter],
            },
          };
        }),
      setStiansManualLetter: (letter) =>
        set((s) => {
          const upper = letter.trim().toLocaleUpperCase("no");
          if (!upper) return {};
          const usedLetters = s.stiansGame.usedLetters.includes(upper)
            ? s.stiansGame.usedLetters
            : [...s.stiansGame.usedLetters, upper];
          return {
            stiansGame: { ...s.stiansGame, currentLetter: upper, usedLetters },
          };
        }),

      startStiansWriting: () =>
        set((s) => ({
          stiansGame: { ...s.stiansGame, phase: "writing", leadGroupId: null },
        })),

      stopStiansWriting: (groupId = null) =>
        set((s) => {
          const allGroupIds = s.stiansGame.groups.map((g) => g.id);
          const order = groupId
            ? [groupId, ...allGroupIds.filter((id) => id !== groupId)]
            : allGroupIds;
          return {
            stiansGame: {
              ...s.stiansGame,
              phase: "reviewing",
              leadGroupId: groupId,
              review: { categoryIndex: 0, groupOrder: order, marks: {} },
            },
          };
        }),

      markStiansApproval: (approved) =>
        set((s) => {
          const g = s.stiansGame;
          if (!g.review) return {};
          const category = g.categories[g.review.categoryIndex];
          const currentGroupId = getCurrentReviewGroupId(g);
          if (!currentGroupId) return {};
          const marks = {
            ...g.review.marks,
            [currentGroupId]: {
              ...g.review.marks[currentGroupId],
              [category]: approved,
            },
          };
          const allMarked = g.review.groupOrder.every(
            (id) => marks[id]?.[category] !== undefined
          );
          if (!allMarked) {
            return { stiansGame: { ...g, review: { ...g.review, marks } } };
          }
          const nextCategoryIndex = g.review.categoryIndex + 1;
          if (nextCategoryIndex < g.categories.length) {
            return {
              stiansGame: {
                ...g,
                review: { ...g.review, marks, categoryIndex: nextCategoryIndex },
              },
            };
          }
          return {
            stiansGame: commitRound({ ...g, review: { ...g.review, marks } }),
          };
        }),

      endStiansGame: () =>
        set((s) => ({ stiansGame: { ...s.stiansGame, phase: "ended" } })),
      resetStiansGameScores: () =>
        set((s) => ({
          stiansGame: {
            ...s.stiansGame,
            scores: {},
            usedLetters: [],
            currentLetter: null,
            phase: "idle",
            review: null,
            leadGroupId: null,
          },
        })),
      resetStiansGameFull: () =>
        set(() => ({ stiansGame: makeInitialStiansGame() })),
```

Add the matching import at the top:

```js
import {
  NORWEGIAN_ALPHABET,
  pickLetter,
  pickRerollLetter,
  getCurrentReviewGroupId,
  commitRound,
} from "../lib/stiansGame";
```//(replace the earlier single-import line from Step 1 with this combined one)

**Step 3: Persist the new slices**

In the `partialize` function, add `categoryBank` and `stiansGame`:

```js
      partialize: (s) => ({
        classes: s.classes,
        activeClassId: s.activeClassId,
        drawnStudents: s.drawnStudents,
        settings: s.settings,
        categoryBank: s.categoryBank,
        stiansGame: s.stiansGame,
      }),
```

**Step 2: Manual verification**

Run: `npm run dev`, open the browser devtools console, and check `window.__ZUSTAND__` isn't needed — instead just verify no console errors on load (the store initializes fine) and the existing modules (Timer, Jeopardy, SpinWheel, ClassList) still work exactly as before, since this task only adds new state.

**Step 3: Build check**

Run: `npm run build`
Expected: builds with no errors.

**Step 4: Commit**

```bash
git add src/store/useAppStore.js
git commit -m "feat: add categoryBank and stiansGame state to the store"
```

---

## Task 4: Module scaffold + Setup phase (groups & category bank)

**Files:**
- Create: `src/modules/StiansGame.jsx`
- Modify: `src/App.jsx`
- Modify: `src/modules/Dashboard.jsx`

**Step 1: Register the module (so it's navigable while you build it)**

In `src/App.jsx`, add the import and registry entry:

```jsx
import StiansGame from "./modules/StiansGame";
```

```jsx
const MODULE_COMPONENTS = {
  dashboard: Dashboard,
  spinwheel: SpinWheel,
  jeopardy: Jeopardy,
  timer: Timer,
  classlist: ClassList,
  stiansgame: StiansGame,
};
```

In `src/modules/Dashboard.jsx`, add an icon import and a card entry. Use `Puzzle` from `lucide-react` and accent `"secondary"` (currently unused by any card, keeps it visually distinct from Jeopardy/peach and SpinWheel/coral):

```jsx
import { Dices, Trophy, Timer as TimerIcon, Users, Puzzle } from "lucide-react";
```

```jsx
  {
    id: "stiansgame",
    icon: Puzzle,
    title: "Stians game",
    description: "Bokstav, kategorier og poeng — lagspill i runder.",
    accent: "secondary",
  },
```

`ModuleCard.jsx`'s `accentClasses` map (`src/components/ModuleCard.jsx:2-7`) doesn't have a `"secondary"` entry yet — add one:

```jsx
  const accentClasses = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    lime: "bg-accent-lime text-ink",
    peach: "bg-accent-peach text-ink",
    coral: "bg-accent-coral text-white",
  };
```

**Step 2: Write the module scaffold with the Setup phase**

Create `src/modules/StiansGame.jsx`:

```jsx
import { useState } from "react";
import { Plus, Trash2, Check, Play } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

function SetupPhase() {
  const groups = useAppStore((s) => s.stiansGame.groups);
  const categories = useAppStore((s) => s.stiansGame.categories);
  const categoryBank = useAppStore((s) => s.categoryBank);
  const addStiansGroup = useAppStore((s) => s.addStiansGroup);
  const removeStiansGroup = useAppStore((s) => s.removeStiansGroup);
  const addCategoryToBank = useAppStore((s) => s.addCategoryToBank);
  const removeCategoryFromBank = useAppStore((s) => s.removeCategoryFromBank);
  const setStiansCategories = useAppStore((s) => s.setStiansCategories);
  const startStiansGame = useAppStore((s) => s.startStiansGame);

  const [groupDraft, setGroupDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");

  function handleAddGroup() {
    const name = groupDraft.trim();
    if (!name) return;
    addStiansGroup(name);
    setGroupDraft("");
  }

  function handleAddCategory() {
    const name = categoryDraft.trim();
    if (!name) return;
    addCategoryToBank(name);
    if (!categories.includes(name)) {
      setStiansCategories([...categories, name]);
    }
    setCategoryDraft("");
  }

  function toggleCategory(name) {
    setStiansCategories(
      categories.includes(name)
        ? categories.filter((c) => c !== name)
        : [...categories, name]
    );
  }

  const canStart = groups.length >= 2 && categories.length >= 1;

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
        Stians game — oppsett
      </h2>
      <p className="mb-8 text-lg text-ink/70">
        Sett opp lag og velg kategorier før dere starter.
      </p>

      <section className="mb-8">
        <h3 className="mb-3 font-heading text-xl font-semibold text-ink">
          Lag ({groups.length})
        </h3>
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            type="text"
            value={groupDraft}
            onChange={(e) => setGroupDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
            placeholder="Lagnavn"
            className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink"
          />
          <button
            type="button"
            onClick={handleAddGroup}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={20} aria-hidden="true" />
            Legg til lag
          </button>
        </div>
        <ul className="flex flex-wrap gap-3">
          {groups.map((g) => (
            <li
              key={g.id}
              className="flex items-center gap-2 rounded-full border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink shadow-clay"
            >
              {g.name}
              <button
                type="button"
                onClick={() => removeStiansGroup(g.id)}
                aria-label={`Fjern ${g.name}`}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 font-heading text-xl font-semibold text-ink">
          Kategoribank
        </h3>
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            type="text"
            value={categoryDraft}
            onChange={(e) => setCategoryDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="Ny kategori (f.eks. Bilmerker)"
            className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={20} aria-hidden="true" />
            Legg til i banken
          </button>
        </div>
        <p className="mb-2 text-base text-ink/60">
          Huk av kategoriene som skal brukes i dagens spill ({categories.length} valgt):
        </p>
        <ul className="flex flex-wrap gap-3">
          {categoryBank.map((name) => {
            const active = categories.includes(name);
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => toggleCategory(name)}
                  className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-body text-lg transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-ink/10 bg-surface text-ink hover:bg-ink/5"
                  }`}
                >
                  {active && <Check size={18} aria-hidden="true" />}
                  {name}
                </button>
              </li>
            );
          })}
          {categoryBank.length === 0 && (
            <li className="text-base text-ink/60">
              Kategoribanken er tom — legg til en kategori over.
            </li>
          )}
        </ul>
        {categoryBank.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer font-body text-base text-ink/60">
              Slett kategorier fra banken
            </summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {categoryBank.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => removeCategoryFromBank(name)}
                    className="flex cursor-pointer items-center gap-1 rounded-full border-2 border-destructive/30 px-3 py-1 font-body text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <button
        type="button"
        onClick={startStiansGame}
        disabled={!canStart}
        className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Play size={24} aria-hidden="true" />
        Start spill
      </button>
      {!canStart && (
        <p className="mt-2 text-base text-ink/60">
          Trenger minst 2 lag og 1 kategori for å starte.
        </p>
      )}
    </div>
  );
}

function StiansGame() {
  const phase = useAppStore((s) => s.stiansGame.phase);

  if (phase === "setup") return <SetupPhase />;

  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-lg text-ink/70">
        Fase "{phase}" bygges i neste steg.
      </p>
    </div>
  );
}

export default StiansGame;
```

**Step 3: Manual verification**

Run: `npm run dev`. From Dashboard, open "Stians game".
Expected:
- Card appears on the dashboard with a blue (secondary) icon background.
- Can add/remove groups (need ≥2 to enable Start).
- Can type a new category — it's added to the bank AND auto-selected for today's game.
- Can toggle bank categories on/off for today's game.
- Can delete a category from the bank via the "Slett kategorier" details.
- "Start spill" is disabled until ≥2 groups and ≥1 category, then navigates past setup (shows the placeholder "Fase idle bygges..." text).
- Reload the app (or navigate away to Dashboard and back) — groups/categories/bank persist (confirms the store wiring from Task 3).

**Step 4: Build check**

Run: `npm run build`
Expected: builds with no errors.

**Step 5: Commit**

```bash
git add src/modules/StiansGame.jsx src/App.jsx src/modules/Dashboard.jsx src/components/ModuleCard.jsx
git commit -m "feat: scaffold Stians game module with setup phase"
```

---

## Task 5: Scoreboard component + Idle phase

**Files:**
- Modify: `src/modules/StiansGame.jsx`

**Step 1: Add the Scoreboard component**

Add near the top of the file (after imports), and import the new lib helpers:

```jsx
import { getGroupTotal } from "../lib/stiansGame";
```

```jsx
function ScoreBoard({ groups, categories, scores }) {
  return (
    <div className="mb-8 overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-xl2 border-2 border-ink/10 shadow-clay">
        <thead>
          <tr className="bg-primary/10">
            <th className="border-2 border-ink/10 px-4 py-3 text-left font-heading text-lg text-ink">
              Gruppe
            </th>
            {categories.map((cat) => (
              <th
                key={cat}
                className="border-2 border-ink/10 px-4 py-3 text-left font-heading text-base text-ink"
              >
                {cat}
              </th>
            ))}
            <th className="border-2 border-ink/10 bg-accent-lime/30 px-4 py-3 text-left font-heading text-lg text-ink">
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const entry = scores[g.id] ?? { byCategory: {}, bonus: 0 };
            return (
              <tr key={g.id} className="bg-surface">
                <td className="border-2 border-ink/10 px-4 py-3 font-heading font-semibold text-ink">
                  {g.name}
                </td>
                {categories.map((cat) => (
                  <td
                    key={cat}
                    className="border-2 border-ink/10 px-4 py-3 font-body text-lg text-ink"
                  >
                    {entry.byCategory[cat] ?? 0}
                  </td>
                ))}
                <td className="border-2 border-ink/10 bg-accent-lime/10 px-4 py-3 font-heading text-lg font-bold text-ink">
                  {getGroupTotal(scores, g.id)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Add the Idle phase**

Add an `IdlePhase` component:

```jsx
function IdlePhase() {
  const usedLetters = useAppStore((s) => s.stiansGame.usedLetters);
  const currentLetter = useAppStore((s) => s.stiansGame.currentLetter);
  const pointsPerRound = useAppStore((s) => s.stiansGame.pointsPerRound);
  const bonusEnabled = useAppStore((s) => s.stiansGame.bonusEnabled);
  const bonusPoints = useAppStore((s) => s.stiansGame.bonusPoints);
  const timerSeconds = useAppStore((s) => s.stiansGame.timerSeconds);

  const drawStiansLetter = useAppStore((s) => s.drawStiansLetter);
  const rerollStiansLetter = useAppStore((s) => s.rerollStiansLetter);
  const setStiansManualLetter = useAppStore((s) => s.setStiansManualLetter);
  const setStiansPointsPerRound = useAppStore((s) => s.setStiansPointsPerRound);
  const setStiansBonusEnabled = useAppStore((s) => s.setStiansBonusEnabled);
  const setStiansBonusPoints = useAppStore((s) => s.setStiansBonusPoints);
  const setStiansTimerSeconds = useAppStore((s) => s.setStiansTimerSeconds);
  const startStiansWriting = useAppStore((s) => s.startStiansWriting);
  const endStiansGame = useAppStore((s) => s.endStiansGame);

  const [manualDraft, setManualDraft] = useState("");

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mb-8 flex min-h-[180px] w-full items-center justify-center rounded-xl2 border-2 border-ink/10 bg-surface shadow-clay">
        <span className="font-heading text-8xl font-bold text-primary">
          {currentLetter ?? "?"}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={drawStiansLetter}
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Trekk bokstav
        </button>
        <button
          type="button"
          onClick={rerollStiansLetter}
          disabled={!currentLetter}
          className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trekk på nytt
        </button>
        <label className="flex items-center gap-2 font-body text-lg text-ink">
          Egen bokstav:
          <input
            type="text"
            maxLength={1}
            value={manualDraft}
            onChange={(e) => setManualDraft(e.target.value)}
            className="min-h-touch w-14 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-body text-lg uppercase text-ink"
          />
          <button
            type="button"
            onClick={() => {
              setStiansManualLetter(manualDraft);
              setManualDraft("");
            }}
            disabled={!manualDraft.trim()}
            className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Bruk
          </button>
        </label>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-6 rounded-xl2 border-2 border-ink/10 bg-surface p-4 shadow-clay">
        <label className="flex items-center gap-2 font-body text-lg text-ink">
          Poeng/runde:
          <input
            type="number"
            min={1}
            value={pointsPerRound}
            onChange={(e) => setStiansPointsPerRound(e.target.value)}
            className="min-h-touch w-16 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-body text-lg text-ink"
          />
        </label>
        <label className="flex items-center gap-2 font-body text-lg text-ink">
          Sekunder:
          <input
            type="number"
            min={5}
            max={600}
            value={timerSeconds}
            onChange={(e) => setStiansTimerSeconds(e.target.value)}
            className="min-h-touch w-20 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-body text-lg text-ink"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 font-body text-lg text-ink">
          <input
            type="checkbox"
            checked={bonusEnabled}
            onChange={(e) => setStiansBonusEnabled(e.target.checked)}
            className="h-6 w-6 cursor-pointer accent-primary"
          />
          Bonus for først ferdig
        </label>
        {bonusEnabled && (
          <label className="flex items-center gap-2 font-body text-lg text-ink">
            Bonuspoeng:
            <input
              type="number"
              min={1}
              value={bonusPoints}
              onChange={(e) => setStiansBonusPoints(e.target.value)}
              className="min-h-touch w-16 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-body text-lg text-ink"
            />
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={startStiansWriting}
          disabled={!currentLetter}
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start skriving
        </button>
        <button
          type="button"
          onClick={endStiansGame}
          className="min-h-touch cursor-pointer rounded-xl2 border-2 border-destructive/30 px-6 py-3 font-heading text-lg font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          Avslutt spill
        </button>
      </div>
      <p className="mt-3 text-base text-ink/60">
        Brukte bokstaver: {usedLetters.join(", ") || "ingen ennå"}
      </p>
    </div>
  );
}
```

**Step 3: Wire ScoreBoard + IdlePhase into the top-level component**

Replace the `StiansGame` function's body with:

```jsx
function StiansGame() {
  const phase = useAppStore((s) => s.stiansGame.phase);
  const groups = useAppStore((s) => s.stiansGame.groups);
  const categories = useAppStore((s) => s.stiansGame.categories);
  const scores = useAppStore((s) => s.stiansGame.scores);

  if (phase === "setup") return <SetupPhase />;

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="mb-6 text-center font-heading text-3xl font-semibold text-ink">
        Stians game
      </h2>
      <ScoreBoard groups={groups} categories={categories} scores={scores} />
      {phase === "idle" && <IdlePhase />}
      {(phase === "writing" || phase === "reviewing" || phase === "ended") && (
        <p className="text-center text-lg text-ink/70">
          Fase "{phase}" bygges i neste steg.
        </p>
      )}
    </div>
  );
}
```

**Step 4: Manual verification**

Run: `npm run dev`, go through Setup (add 2 groups, 2+ categories), Start spill.
Expected:
- Scoreboard renders with the groups as rows, categories as columns, all `0`, TOTAL column highlighted lime.
- "Trekk bokstav" shows a random letter (try a few times — including possibly æ/ø/å).
- "Trekk på nytt" changes the letter without ever repeating the immediately-previous one twice; the previous letter should be drawable again in a *later* draw (verify by drawing many times and confirming no letter appears twice before the alphabet cycles — 29 draws should touch each letter once).
- "Egen bokstav" lets you type e.g. `Q` and use it, overriding the current letter.
- Points/runde, sekunder, and bonus controls update as expected; bonus points input only shows when the checkbox is checked.
- "Start skriving" is disabled until a letter has been drawn.
- "Avslutt spill" moves to the placeholder "ended" text (full Ended phase comes in Task 8).

**Step 5: Build check**

Run: `npm run build`
Expected: builds with no errors.

**Step 6: Commit**

```bash
git add src/modules/StiansGame.jsx
git commit -m "feat: add scoreboard and idle-phase letter/round controls"
```

---

## Task 6: Writing phase (timer + shout/stop)

**Files:**
- Modify: `src/modules/StiansGame.jsx`

**Step 1: Add the Writing phase component**

This reuses the same countdown pattern as `Timer.jsx` (`useEffect` + `setInterval`), scoped locally since only the *remaining* count is ephemeral UI state — the configured `timerSeconds` itself is already in the store from Task 5.

Add imports:

```jsx
import { useEffect, useRef, useState } from "react";
import { playSound } from "../lib/sound";
```

(merge with the existing `import { useState } from "react";` line — replace it with the combined import above.)

Add the component:

```jsx
function WritingPhase() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const currentLetter = useAppStore((s) => s.stiansGame.currentLetter);
  const categories = useAppStore((s) => s.stiansGame.categories);
  const groups = useAppStore((s) => s.stiansGame.groups);
  const timerSeconds = useAppStore((s) => s.stiansGame.timerSeconds);
  const stopStiansWriting = useAppStore((s) => s.stopStiansWriting);

  const [remaining, setRemaining] = useState(timerSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    setRemaining(timerSeconds);
    setRunning(false);
    stoppedRef.current = false;
  }, [timerSeconds]);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          playSound("ding", soundEnabled);
          if (!stoppedRef.current) {
            stoppedRef.current = true;
            stopStiansWriting(null);
          }
          return 0;
        }
        if (prev <= 4) playSound("tick", soundEnabled);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, soundEnabled, stopStiansWriting]);

  function handleShout(groupId) {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    stopStiansWriting(groupId);
  }

  function handleManualStop() {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    stopStiansWriting(null);
  }

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mb-6 flex min-h-[160px] w-full items-center justify-center rounded-xl2 border-2 border-ink/10 bg-surface shadow-clay">
        <span className="font-heading text-7xl font-bold text-primary">
          {currentLetter}
        </span>
      </div>

      <p className="mb-2 font-body text-lg text-ink/70">
        Kategorier: {categories.join(", ")}
      </p>

      <div
        className="mb-6 font-heading text-5xl font-bold text-ink"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {mm}:{ss}
      </div>

      <div className="mb-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          {running ? "Pause" : "Start tid"}
        </button>
        <button
          type="button"
          onClick={handleManualStop}
          className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          Stopp (uten lag)
        </button>
      </div>

      <p className="mb-3 font-heading text-lg font-semibold text-ink">
        Gruppa som er ferdig roper "Stians game!":
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => handleShout(g.id)}
            className="min-h-touch cursor-pointer rounded-xl2 border-2 border-accent-coral/40 bg-accent-coral/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-accent-coral/20"
          >
            {g.name} ropte!
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Wire it in**

In the top-level `StiansGame` component, replace:

```jsx
      {(phase === "writing" || phase === "reviewing" || phase === "ended") && (
```

with:

```jsx
      {phase === "writing" && <WritingPhase />}
      {(phase === "reviewing" || phase === "ended") && (
```

**Step 3: Manual verification**

Run: `npm run dev`, get to the writing phase (draw letter → Start skriving).
Expected:
- Countdown starts at the configured `timerSeconds` (from Task 5's "Sekunder" field) and shows `MM:SS`.
- "Start tid"/"Pause" toggles the countdown.
- Clicking a group's "[navn] ropte!" button immediately moves to the reviewing placeholder, regardless of timer state.
- "Stopp (uten lag)" also moves to reviewing, with no lead group recorded (verify in Task 7 once the review UI shows lead-group highlighting).
- Letting the timer reach `00:00` on its own also moves to reviewing automatically with no lead group and plays the "ding" sound.
- Once stopped by any of the three paths, clicking another shout button does nothing (guarded by `stoppedRef`).

**Step 4: Build check**

Run: `npm run build`
Expected: builds with no errors.

**Step 5: Commit**

```bash
git add src/modules/StiansGame.jsx
git commit -m "feat: add writing-phase timer and shout/stop controls"
```

---

## Task 7: Reviewing phase (turn order + approve/reject)

**Files:**
- Modify: `src/modules/StiansGame.jsx`

**Step 1: Add the Reviewing phase component**

Add import:

```jsx
import { getCurrentReviewGroupId } from "../lib/stiansGame";
```

(combine with the existing `getGroupTotal` import from Task 5 into one `import { getGroupTotal, getCurrentReviewGroupId } from "../lib/stiansGame";` line.)

Add the component:

```jsx
function ReviewingPhase() {
  const stiansGame = useAppStore((s) => s.stiansGame);
  const markStiansApproval = useAppStore((s) => s.markStiansApproval);
  const { review, categories, groups } = stiansGame;

  if (!review) return null;
  const category = categories[review.categoryIndex];
  const currentGroupId = getCurrentReviewGroupId(stiansGame);
  const groupsById = Object.fromEntries(groups.map((g) => [g.id, g]));

  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="mb-2 font-body text-lg text-ink/70">
        Kategori {review.categoryIndex + 1} av {categories.length}
      </p>
      <h3 className="mb-6 font-heading text-4xl font-bold text-ink">
        {category}
      </h3>

      <div className="mb-8 flex flex-col items-center gap-3">
        {review.groupOrder.map((groupId) => {
          const group = groupsById[groupId];
          const mark = review.marks[groupId]?.[category];
          const isCurrent = groupId === currentGroupId;
          return (
            <div
              key={groupId}
              className={`flex w-full max-w-md items-center justify-between gap-4 rounded-xl2 border-2 px-5 py-3 shadow-clay transition-colors ${
                isCurrent
                  ? "border-primary bg-primary/10"
                  : mark === undefined
                    ? "border-ink/10 bg-surface opacity-50"
                    : "border-ink/10 bg-surface"
              }`}
            >
              <span className="font-heading text-xl font-semibold text-ink">
                {group?.name}
                {groupId === stiansGame.leadGroupId && " 📣"}
              </span>
              {mark === true && (
                <span className="font-heading font-semibold text-accent-lime">
                  Godkjent
                </span>
              )}
              {mark === false && (
                <span className="font-heading font-semibold text-destructive">
                  Ikke godkjent
                </span>
              )}
              {isCurrent && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => markStiansApproval(true)}
                    className="min-h-touch cursor-pointer rounded-xl2 bg-accent-lime/80 px-5 py-2 font-heading font-semibold text-ink transition-colors hover:bg-accent-lime"
                  >
                    Godkjent
                  </button>
                  <button
                    type="button"
                    onClick={() => markStiansApproval(false)}
                    className="min-h-touch cursor-pointer rounded-xl2 bg-destructive/80 px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-destructive"
                  >
                    Ikke godkjent
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Note: `groupId === stiansGame.leadGroupId` marks the group that shouted first (📣), consistent across every category in this round's review, per the design's "clear marking of who's up + who shouted first" requirement.

**Step 2: Wire it in**

Replace:

```jsx
      {(phase === "reviewing" || phase === "ended") && (
        <p className="text-center text-lg text-ink/70">
          Fase "{phase}" bygges i neste steg.
        </p>
      )}
```

with:

```jsx
      {phase === "reviewing" && <ReviewingPhase />}
      {phase === "ended" && (
        <p className="text-center text-lg text-ink/70">
          Fase "ended" bygges i neste steg.
        </p>
      )}
```

**Step 3: Manual verification**

Run: `npm run dev`, play through: setup with 3 groups + 2 categories → draw letter → start skriving → one group shouts.
Expected:
- Reviewing view opens on category 1, first group to click is the one who shouted (📣 shown next to their name), highlighted with the primary border.
- Clicking "Godkjent"/"Ikke godkjent" marks that group and immediately highlights the next group in turn order (wrapping, i.e. after the last group it should not go back to the lead group again for the *same* category — it moves to category 2).
- After all groups are marked for category 1, the view automatically switches to category 2, restarting turn order from the same lead group.
- After the last category's last group is marked, the view returns to the Idle phase (scoreboard should now show the awarded points — verify against `pointsPerRound` set earlier, and that a group marked "Ikke godkjent" for a category shows `0` added, not negative or unchanged incorrectly).
- If bonus was enabled, the lead group's TOTAL includes the bonus points on top of category points.
- Repeat once with the "Stopp (uten lag)" path (no shout) — verify review still works, turn order is just the groups array order, and no bonus is awarded even if `bonusEnabled` was on (since there's no lead group).

**Step 4: Build check**

Run: `npm run build`
Expected: builds with no errors.

**Step 5: Commit**

```bash
git add src/modules/StiansGame.jsx
git commit -m "feat: add reviewing-phase turn order and approval controls"
```

---

## Task 8: Ended phase (winner + confetti + reset)

**Files:**
- Modify: `src/modules/StiansGame.jsx`

**Step 1: Add the Ended phase component**

Add imports:

```jsx
import { fireConfetti } from "../lib/confetti";
import { getWinner } from "../lib/stiansGame";
```

(combine into the existing lib import: `import { getGroupTotal, getCurrentReviewGroupId, getWinner } from "../lib/stiansGame";`)

Add the component:

```jsx
function EndedPhase() {
  const groups = useAppStore((s) => s.stiansGame.groups);
  const scores = useAppStore((s) => s.stiansGame.scores);
  const resetStiansGameScores = useAppStore((s) => s.resetStiansGameScores);
  const resetStiansGameFull = useAppStore((s) => s.resetStiansGameFull);

  const winner = getWinner(groups, scores);

  useEffect(() => {
    fireConfetti();
  }, []);

  return (
    <div className="mx-auto max-w-2xl text-center">
      <h3 className="mb-4 font-heading text-4xl font-bold text-primary">
        {winner ? `${winner.name} vinner! 🎉` : "Spillet er over"}
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={resetStiansGameScores}
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Nytt spill, samme lag/kategorier
        </button>
        <button
          type="button"
          onClick={resetStiansGameFull}
          className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          Helt nytt spill
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Wire it in**

Replace:

```jsx
      {phase === "ended" && (
        <p className="text-center text-lg text-ink/70">
          Fase "ended" bygges i neste steg.
        </p>
      )}
```

with:

```jsx
      {phase === "ended" && <EndedPhase />}
```

Also, the Ended view shouldn't show the live-editing scoreboard controls below it awkwardly — that's fine as-is since `ScoreBoard` is read-only already.

**Step 3: Manual verification**

Run: `npm run dev`, play a full round or two, then click "Avslutt spill" (from the Idle phase controls added in Task 5).
Expected:
- Confetti fires once when the Ended view appears.
- The group with the highest TOTAL is announced as winner; if you contrive a tie (equal totals), the first group in the `groups` array wins ties (acceptable, matches `getWinner`'s `reduce` using strict `>`).
- "Nytt spill, samme lag/kategorier" clears scores/letters and returns to Idle with the same groups/categories intact.
- "Helt nytt spill" clears everything and returns to the Setup phase.
- With `prefers-reduced-motion` enabled in OS/browser settings, confetti should be skipped (already handled inside `fireConfetti`).

**Step 4: Build check**

Run: `npm run build`
Expected: builds with no errors.

**Step 5: Commit**

```bash
git add src/modules/StiansGame.jsx
git commit -m "feat: add ended-phase winner announcement and reset controls"
```

---

## Task 9: Full playtest, polish, changelog

**Files:**
- Modify: `src/modules/StiansGame.jsx` (only if playtest surfaces bugs)
- Modify: `CHANGELOG.md`

**Step 1: End-to-end manual playtest**

Run: `npm run dev`. Play a realistic multi-round game:
1. Setup: 3 groups ("King Nasir", "Big Jahu", "Null nuss"), 4 categories.
2. Round 1: draw letter, reroll once, start writing with a short timer (e.g. 10 sekunder) to save time, let it expire naturally (no shout).
3. Review round 1: mark a mix of godkjent/ikke godkjent across groups and categories, including at least one category where two groups are marked "ikke godkjent" to simulate a duplicate call.
4. Confirm scoreboard updates correctly (spot-check the arithmetic: each godkjent mark should add exactly `pointsPerRound`).
5. Round 2: set `pointsPerRound` to 2 ("dobbel runde"), enable bonus with `bonusPoints = 3`, draw a letter, one group shouts "ropte!" mid-writing (before timer expires).
6. Review round 2: confirm the shouting group is marked with 📣 and reviewed first in every category.
7. Confirm the shouting group's TOTAL includes the +3 bonus on top of category points.
8. Click "Avslutt spill", confirm winner + confetti, try both reset buttons and confirm the described behavior for each.
9. Switch to Dashboard, then to Timer, then back to Stians game — confirm game state (scores, groups, categories, phase) is exactly as left (validates the persisted-store architecture decision).
10. Also re-verify Task 1 (Timer seconds) still works and no other module (Jeopardy, SpinWheel, ClassList) regressed.

Fix any bugs found directly in `src/modules/StiansGame.jsx` (or `src/store/useAppStore.js`/`src/lib/stiansGame.js` if the bug is in shared logic), re-run the relevant part of the playtest, and note the fix in the commit message.

**Step 2: Update CHANGELOG.md**

Add to the `### Added` section under `[Unreleased]`:

```markdown
- "Stians game" module: category-bank-backed letter round game with live team scoring.
- Seconds input on the Timer module's custom duration field.
```

**Step 3: Build check**

Run: `npm run build`
Expected: builds with no errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: polish Stians game after full playtest, update changelog"
```

(Only if playtest fixes were needed — otherwise just commit the changelog update.)

---

## Post-implementation

Once all tasks are committed on `feature/stians-game`, use the **finishing-a-development-branch** skill to decide how to integrate (merge to `main`, open a PR, or leave for further review) — do not merge automatically.
