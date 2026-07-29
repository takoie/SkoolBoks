# SkoolBox Baseline Implementation Plan

> **For Claude:** This plan is executed directly, in-session, by the same agent that wrote it (full design context already held — no subagent handoff needed). Follow tasks in order; verify each before moving on; commit after each task.

**Goal:** Scaffold and build a working SkoolBox baseline: Tauri 2.0 + React/Vite + Tailwind desktop app with Dashboard, SpinWheel, Jeopardy, Timer and ClassList modules, a Zustand store persisted via `tauri-plugin-store`, and a `tauri build` that produces both NSIS and MSI installers.

**Architecture:** React (Vite, JSX) frontend in `src/`, one module per file under `src/modules/`, shared Zustand store in `src/store/`. Rust backend in `src-tauri/` is minimal — Tauri core + `tauri-plugin-store`, no custom commands needed for baseline. Design tokens (colors/fonts) live in `tailwind.config.js` + `src/index.css`, matching `docs/plans/2026-07-29-skoolbox-baseline-design.md`.

**Tech Stack:** Tauri 2.0, React 18, Vite 5, Tailwind CSS 3, Zustand, `@tauri-apps/plugin-store`, `lucide-react`, `canvas-confetti`, `@fontsource/fredoka`, `@fontsource/nunito`.

---

## Pre-flight: clear stray scaffolding

The project root currently has a throwaway `cargo init` skeleton (`Cargo.toml`, `src/main.rs` printing "Hello, world!", `.gitignore` with just `/target`) left over from verifying the Rust install. Real Tauri projects put Rust in `src-tauri/` and the frontend in `src/`, so this conflicts with the target layout.

**Step 1:** Remove the stray files.

```bash
rm -f Cargo.toml src/main.rs
rmdir src 2>/dev/null || true
```

**Step 2:** Verify clean state.

Run: `ls -la`
Expected: only `.git`, `.claude`, `docs` remain.

---

### Task 1: Scaffold Tauri + React + Vite project

**Files:**
- Create: whole project via CLI, then inspect `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`

**Step 1:** Scaffold using the official Tauri create tool (non-interactive flags), template `react` with JS (not TS, per spec's `.jsx` requirement).

```bash
npm create tauri-app@latest . -- --yes --template react --manager npm
```

If the interactive prompt still appears (CLI versions vary), answer: project name `skoolbox`, identifier `com.skoolbox.app`, frontend template `React`, flavor `JavaScript`.

**Step 2:** Install dependencies.

```bash
npm install
```

**Step 3:** Verify the unmodified scaffold runs.

Run: `npm run tauri dev -- --help` (sanity check the CLI wires up; do not leave a dev window open)
Expected: prints Tauri CLI help without error.

**Step 4:** Commit.

```bash
git add -A
git commit -m "Scaffold Tauri + React + Vite project"
```

---

### Task 2: Install frontend dependencies

**Files:** `package.json`

**Step 1:** Install runtime deps.

```bash
npm install zustand lucide-react canvas-confetti @tauri-apps/plugin-store @fontsource/fredoka @fontsource/nunito
```

**Step 2:** Install Tailwind + PostCSS (dev deps) and init config.

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 3:** Add the Rust-side store plugin crate.

```bash
cd src-tauri
cargo add tauri-plugin-store
cd ..
```

**Step 4:** Commit.

```bash
git add -A
git commit -m "Add frontend/backend dependencies (zustand, tauri-plugin-store, tailwind, fonts, confetti)"
```

---

### Task 3: Configure Tailwind with design tokens

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css` (or `src/App.css` — use whichever the scaffold created; consolidate into one global stylesheet)

**Step 1:** Replace `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#4338CA", hover: "#3730A3", active: "#312E81" },
        secondary: "#3B82F6",
        accent: { lime: "#84CC16", peach: "#FDBA74", coral: "#FB7185" },
        surface: "#FFFFFF",
        canvas: "#F5F3FF",
        "canvas-dark": "#1E1B4B",
        ink: "#1E1B4B",
        destructive: "#DC2626",
      },
      fontFamily: {
        heading: ["Fredoka", "sans-serif"],
        body: ["Nunito", "sans-serif"],
      },
      borderRadius: { xl2: "20px" },
      boxShadow: {
        clay: "0 2px 0 rgba(30,27,75,0.15), 0 8px 20px -6px rgba(67,56,202,0.25)",
      },
      spacing: { touch: "64px" },
    },
  },
  plugins: [],
};
```

**Step 2:** Replace the global stylesheet (`src/App.css` content merged into `src/index.css`, then delete `App.css` import from `App.jsx` if the scaffold generates one):

```css
@import "@fontsource/fredoka/400.css";
@import "@fontsource/fredoka/500.css";
@import "@fontsource/fredoka/600.css";
@import "@fontsource/fredoka/700.css";
@import "@fontsource/nunito/400.css";
@import "@fontsource/nunito/600.css";
@import "@fontsource/nunito/700.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body, #root { height: 100%; }
  body {
    @apply bg-canvas text-ink font-body antialiased;
  }
  h1, h2, h3, h4 { @apply font-heading; }
  :focus-visible {
    outline: 3px solid #3B82F6;
    outline-offset: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

**Step 3:** Verify Vite dev server picks up Tailwind (no build errors).

Run: `npm run build`
Expected: build succeeds, no PostCSS/Tailwind errors.

**Step 4:** Commit.

```bash
git add -A
git commit -m "Configure Tailwind design tokens and self-hosted Fredoka/Nunito fonts"
```

---

### Task 4: Zustand store with tauri-plugin-store persistence

**Files:**
- Create: `src/store/useAppStore.js`
- Create: `src/store/tauriStorage.js`
- Modify: `src-tauri/src/lib.rs` (register the store plugin)
- Modify: `src-tauri/tauri.conf.json` (no change needed for store plugin; permissions handled via capabilities file)
- Modify: `src-tauri/capabilities/default.json` (add `store:default` permission)

**Step 1:** Register the plugin in Rust. In `src-tauri/src/lib.rs`, add `.plugin(tauri_plugin_store::Builder::new().build())` to the builder chain (alongside whatever the scaffold already generated, e.g. `tauri_plugin_opener`).

**Step 2:** Add the store permission. In `src-tauri/capabilities/default.json`, add `"store:default"` to the `"permissions"` array.

**Step 3:** Create `src/store/tauriStorage.js` — a storage adapter Zustand's `persist` middleware can call, backed by a single JSON file (`skoolbox-data.json`) via the store plugin:

```js
import { load } from "@tauri-apps/plugin-store";

let storePromise = null;
function getStore() {
  if (!storePromise) storePromise = load("skoolbox-data.json", { autoSave: true });
  return storePromise;
}

export const tauriStorage = {
  getItem: async (name) => {
    const store = await getStore();
    const value = await store.get(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    const store = await getStore();
    await store.set(name, value);
  },
  removeItem: async (name) => {
    const store = await getStore();
    await store.delete(name);
  },
};
```

**Step 4:** Create `src/store/useAppStore.js`:

```js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "./tauriStorage";

const DEFAULT_CLASS_ID = "default";

export const useAppStore = create(
  persist(
    (set, get) => ({
      activeModule: "dashboard",
      setActiveModule: (id) => set({ activeModule: id }),

      classes: {
        [DEFAULT_CLASS_ID]: { name: "Min klasse", students: [] },
      },
      activeClassId: DEFAULT_CLASS_ID,
      drawnStudents: {}, // { [classId]: string[] }

      setActiveClassId: (id) => set({ activeClassId: id }),

      createClass: (name) => {
        const id = crypto.randomUUID();
        set((s) => ({
          classes: { ...s.classes, [id]: { name, students: [] } },
          activeClassId: id,
        }));
        return id;
      },

      renameClass: (id, name) =>
        set((s) => ({
          classes: { ...s.classes, [id]: { ...s.classes[id], name } },
        })),

      deleteClass: (id) =>
        set((s) => {
          const classes = { ...s.classes };
          delete classes[id];
          const activeClassId =
            s.activeClassId === id ? Object.keys(classes)[0] ?? null : s.activeClassId;
          return { classes, activeClassId };
        }),

      setStudents: (classId, students) =>
        set((s) => ({
          classes: { ...s.classes, [classId]: { ...s.classes[classId], students } },
        })),

      resetDrawn: (classId) =>
        set((s) => ({ drawnStudents: { ...s.drawnStudents, [classId]: [] } })),

      markDrawn: (classId, student) =>
        set((s) => ({
          drawnStudents: {
            ...s.drawnStudents,
            [classId]: [...(s.drawnStudents[classId] ?? []), student],
          },
        })),

      settings: { soundEnabled: true },
      setSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
    }),
    {
      name: "skoolbox-store",
      storage: createJSONStorage(() => tauriStorage),
      partialize: (s) => ({
        classes: s.classes,
        activeClassId: s.activeClassId,
        drawnStudents: s.drawnStudents,
        settings: s.settings,
      }),
    }
  )
);
```

**Step 5:** Verify the Rust side compiles.

Run: `cd src-tauri && cargo check && cd ..`
Expected: compiles with no errors (warnings OK).

**Step 6:** Commit.

```bash
git add -A
git commit -m "Add Zustand store persisted through tauri-plugin-store"
```

---

### Task 5: Sound and confetti utility hooks

**Files:**
- Create: `src/lib/sound.js`
- Create: `src/lib/confetti.js`

**Step 1:** `src/lib/sound.js` — small Web Audio API tone player, no external assets:

```js
let ctx = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, startTime, duration, gainValue = 0.15) {
  const audioCtx = getCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

export const sounds = {
  tick: () => {
    const t = getCtx().currentTime;
    tone(880, t, 0.05, 0.08);
  },
  ding: () => {
    const t = getCtx().currentTime;
    tone(1046.5, t, 0.35);
  },
  tada: () => {
    const t = getCtx().currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      tone(freq, t + i * 0.09, 0.4)
    );
  },
};

export function playSound(name, enabled) {
  if (!enabled) return;
  try {
    sounds[name]?.();
  } catch {
    // Audio unavailable (e.g. no user gesture yet) — fail silently.
  }
}
```

**Step 2:** `src/lib/confetti.js` — thin wrapper respecting `prefers-reduced-motion`:

```js
import confetti from "canvas-confetti";

export function fireConfetti(options = {}) {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) return;
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#4338CA", "#84CC16", "#FDBA74", "#FB7185"],
    ...options,
  });
}
```

**Step 3:** Verify build still compiles.

Run: `npm run build`
Expected: succeeds.

**Step 4:** Commit.

```bash
git add -A
git commit -m "Add synthesized sound effects and confetti utility"
```

---

### Task 6: Shared layout and navigation shell

**Files:**
- Create: `src/components/AppShell.jsx` (top-level layout: sidebar/header + module viewport)
- Create: `src/components/ModuleCard.jsx` (reusable dashboard tile)
- Modify: `src/App.jsx` (renders `AppShell`, switches on `activeModule` from the store)

**Step 1:** `AppShell.jsx` renders a slim top bar (app title + active class name + back-to-dashboard button when not on dashboard) and a full-height content area. Uses `lucide-react` icons (`Home`), large touch targets (`h-touch` / `min-h-[64px]`), and Tailwind tokens from Task 3.

**Step 2:** `ModuleCard.jsx` is a large rounded button (icon + title + short description) used on the Dashboard, `min-h-[180px]`, `shadow-clay`, hover/focus states, `cursor-pointer`.

**Step 3:** `App.jsx` reads `activeModule` from `useAppStore` and renders the matching module component inside `AppShell` (`dashboard` → `Dashboard`, `spinwheel` → `SpinWheel`, etc.) via a simple lookup object — no router.

**Step 4:** Verify dev server renders without console errors.

Run: `npm run tauri dev` (start, confirm window opens and shows the shell, then stop the process)
Expected: window opens at 1280×800 (once Task 8 sets that), no red error overlay.

**Step 5:** Commit.

```bash
git add -A
git commit -m "Add app shell layout and module navigation"
```

---

### Task 7: Modules — Dashboard, ClassList, SpinWheel, Timer, Jeopardy

**Files:**
- Create: `src/modules/Dashboard.jsx`
- Create: `src/modules/ClassList.jsx`
- Create: `src/modules/SpinWheel.jsx`
- Create: `src/modules/Timer.jsx`
- Create: `src/modules/Jeopardy.jsx`

**Step 1 — Dashboard.jsx:** Grid of `ModuleCard`s (SpinWheel, Jeopardy, Timer, ClassList), each `onClick` calls `setActiveModule(id)`. Shows active class name and student count at the top; if the active class has 0 students, show a prompt card linking to ClassList.

**Step 2 — ClassList.jsx:** Class switcher (dropdown of `classes`, "+ Ny klasse" button), a `<textarea>` for pasting one name per line, "Lagre" button that calls `setStudents(activeClassId, parsedNames)`, and a live list below with per-student remove (X) buttons and a rename-class input. Empty state message when no students yet.

**Step 3 — SpinWheel.jsx:** Reads `students` for the active class and `drawnStudents[activeClassId]`. "Trekk elev" button (disabled + loading state while spinning per touch-target-size/loading-buttons guidance) runs a short randomized highlight animation (cycle through names at decreasing interval, `prefers-reduced-motion` skips straight to the result), lands on one random not-yet-drawn student, calls `markDrawn`, plays `sounds.tada` via `playSound`, fires `fireConfetti()`. Toggle "Fjern etter trekning" (default on) — when all students are drawn, show "Alle har blitt trukket!" with a "Nullstill" button calling `resetDrawn`.

**Step 4 — Timer.jsx:** Minute/second input (or preset buttons: 1/3/5/10 min), large countdown display (tabular numerals — `font-variant-numeric: tabular-nums`), Start/Pause/Reset controls (≥64px touch targets), plays `sounds.tick` on the final 3 seconds and `sounds.ding` at zero, visual pulse on the last 10 seconds respecting reduced motion.

**Step 5 — Jeopardy.jsx:** Local state: categories (default 4) × point rows (100/200/300/400/500) plus two team scores. Clicking an unrevealed cell opens a simple modal-style panel with a question/answer placeholder (editable text) and two buttons "Riktig" / "Feil" per team that adjust scores and mark the cell as used (dim + unclickable afterward). "Nullstill brett" button resets used-state and scores.

**Step 6:** Verify build.

Run: `npm run build`
Expected: succeeds, no unused-import lint errors.

**Step 7:** Commit.

```bash
git add -A
git commit -m "Implement Dashboard, ClassList, SpinWheel, Timer and Jeopardy modules"
```

---

### Task 8: tauri.conf.json — window size and bundler targets

**Files:**
- Modify: `src-tauri/tauri.conf.json`

**Step 1:** Set app metadata and window:

```json
{
  "productName": "SkoolBox",
  "identifier": "com.skoolbox.app",
  "app": {
    "windows": [
      {
        "title": "SkoolBox",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 768,
        "resizable": true,
        "fullscreen": false
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

Merge these keys into whatever the scaffold already generated (don't blindly overwrite `build`/`plugins` sections created by `npm create tauri-app`).

**Step 2:** Confirm icons exist (the scaffold generates placeholder icons under `src-tauri/icons/`); leave as-is for baseline.

**Step 3:** Verify config is valid JSON and Tauri accepts it.

Run: `cd src-tauri && cargo check && cd ..`
Expected: no errors.

**Step 4:** Commit.

```bash
git add -A
git commit -m "Configure window size and NSIS+MSI bundler targets"
```

---

### Task 9: Full verification pass

**Step 1:** Frontend build.

Run: `npm run build`
Expected: exits 0.

**Step 2:** Rust check.

Run: `cd src-tauri && cargo check && cd ..`
Expected: exits 0.

**Step 3:** Full installer build (this actually invokes NSIS + MSI/WiX — takes a few minutes).

Run: `npm run tauri build`
Expected: exits 0; `src-tauri/target/release/bundle/nsis/*-setup.exe` and `src-tauri/target/release/bundle/msi/*.msi` both exist. If MSI fails because WiX isn't on PATH, report that specifically rather than treating it as a blocking failure (NSIS success is the baseline bar; MSI needs the user's WiX install to be visible to cargo).

**Step 4:** Manual smoke test: run the built exe (or `npm run tauri dev`) and click through all 5 modules once — Dashboard → ClassList (add a couple of names) → SpinWheel (draw one) → Timer (start a short countdown) → Jeopardy (reveal one cell). Confirm no console errors.

**Step 5:** Commit any final fixes discovered during smoke test.
