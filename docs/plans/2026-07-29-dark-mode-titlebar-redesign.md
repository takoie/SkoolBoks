# Dark Mode, Custom Titlebar & Window Size Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make SkoolBox dark-mode-by-default with a toggle, replace the native OS titlebar with a cohesive branded one (with a FontAwesome box logo), and grow the default launch window to 1800x1050.

**Architecture:** Dark mode is implemented entirely via CSS custom-property overrides under a `.dark` class (Tailwind v4 `@theme` tokens are just CSS variables — overriding them under `.dark` on `<html>` cascades to every existing utility class with zero component edits for color). A new `TitleBar.jsx` replaces the native titlebar (`decorations: false`) and hosts the logo, the theme toggle, and window controls via `@tauri-apps/api/window`.

**Tech Stack:** React 19, Tailwind CSS v4, Zustand (+ `tauri-plugin-store` persistence), Tauri 2, `@fortawesome/react-fontawesome`.

**Note on verification:** This project has no automated test runner (no vitest/jest in `package.json`). Verification for these visual/UI changes is manual: launch the app (`npm run start`) and confirm the described behavior in the actual window, per task.

---

### Task 1: Grow the default window size

**Files:**
- Modify: `src-tauri/tauri.conf.json`

**Step 1: Edit the window dimensions**

In `src-tauri/tauri.conf.json`, change:
```json
        "width": 1280,
        "height": 800,
```
to:
```json
        "width": 1800,
        "height": 1050,
```
Leave `minWidth`/`minHeight` (1024/768) unchanged.

**Step 2: Verify**

Run: `npm run start`
Expected: the SkoolBox window opens noticeably larger, filling more of a 1920x1080 screen, not the old smaller 1280x800 size.

**Step 3: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "feat: launch SkoolBox at 1800x1050 by default"
```

---

### Task 2: Add FontAwesome dependencies

**Files:**
- Modify: `package.json` (via npm install)

**Step 1: Install packages**

Run:
```bash
npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core
```

**Step 2: Verify**

Run: `node -e "require('@fortawesome/free-solid-svg-icons').faBox && console.log('ok')"`
Expected: prints `ok`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add FontAwesome for the logo icon"
```

---

### Task 3: Dark mode design tokens

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

**Step 1: Add dark-mode token overrides**

In `src/index.css`, after the existing `@theme { ... }` block (which stays untouched — it remains the light-mode/default values), add:

```css
.dark {
  --color-surface: #2a265c;
  --color-canvas: #1e1b4b;
  --color-ink: #f5f3ff;

  --color-primary: #818cf8;
  --color-primary-hover: #a5b4fc;
  --color-primary-active: #c7d2fe;

  --shadow-clay: 0 2px 0 rgba(0, 0, 0, 0.5), 0 8px 20px -6px rgba(0, 0, 0, 0.55);
}
```

Note: `--color-canvas-dark` already existed and is now folded into the plain `--color-canvas` override above (it can stay defined in `@theme` too, unused, for backward compat — no need to remove it).

**Step 2: Default the app to dark mode with no flash-of-light-mode**

In `index.html`, change:
```html
<html lang="no">
```
to:
```html
<html lang="no" class="dark">
```
This is the boot-time default; Task 4/5 make it reactive to the user's stored preference.

**Step 3: Verify**

Run: `npm run start`
Expected: the whole app (backgrounds, cards, text) renders in the dark palette immediately on launch, since `<html>` now carries `class="dark"` and every `bg-canvas`/`bg-surface`/`text-ink`/`border-ink/10` utility picks up the overridden variables.

**Step 4: Commit**

```bash
git add src/index.css index.html
git commit -m "feat: add dark mode color tokens, default html to dark"
```

---

### Task 4: Persist theme preference in the store

**Files:**
- Modify: `src/store/useAppStore.js:61`

**Step 1: Add `theme` to settings**

Change:
```js
      settings: { soundEnabled: true },
```
to:
```js
      settings: { soundEnabled: true, theme: "dark" },
```

`setSettings` already exists and merges partial updates, so `setSettings({ theme: "light" })` / `setSettings({ theme: "dark" })` needs no new store action — it's reused as-is. This field is already covered by the existing `partialize` (`settings: s.settings`), so it persists via `tauri-plugin-store` automatically.

**Step 2: Verify**

Run: `npm run start`, open dev tools if needed, or just trust the existing persistence test pattern already used by `soundEnabled` (no new mechanism introduced).
Expected: no runtime errors; app still launches.

**Step 3: Commit**

```bash
git add src/store/useAppStore.js
git commit -m "feat: add theme field to persisted settings, default dark"
```

---

### Task 5: Sync the `dark` class on `<html>` with store state

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add an effect that toggles the class**

In `src/App.jsx`, add a `useEffect` that keeps `document.documentElement`'s `dark` class in sync with `settings.theme` (needed because the store rehydrates asynchronously from `tauri-plugin-store`, and the user can toggle at runtime):

```jsx
import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";
import AppShell from "./components/AppShell";
import TitleBar from "./components/TitleBar";
import Dashboard from "./modules/Dashboard";
import SpinWheel from "./modules/SpinWheel";
import Jeopardy from "./modules/Jeopardy";
import Timer from "./modules/Timer";
import ClassList from "./modules/ClassList";

const MODULE_COMPONENTS = {
  dashboard: Dashboard,
  spinwheel: SpinWheel,
  jeopardy: Jeopardy,
  timer: Timer,
  classlist: ClassList,
};

function App() {
  const activeModule = useAppStore((s) => s.activeModule);
  const theme = useAppStore((s) => s.settings.theme);
  const ActiveComponent = MODULE_COMPONENTS[activeModule] ?? Dashboard;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme !== "light");
  }, [theme]);

  return (
    <>
      <TitleBar />
      <AppShell>
        <ActiveComponent />
      </AppShell>
    </>
  );
}

export default App;
```

(`TitleBar` is created in Task 6 — this task can be committed once Task 6's file exists; do Task 6 first if working strictly sequentially, or stub-import is fine since both land in the same working session before the app is run.)

**Step 2: Verify**

Covered by Task 6/7's manual verification (toggling the button flips the whole app's palette).

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: sync html dark class with theme setting"
```

---

### Task 6: Build the custom TitleBar component

**Files:**
- Create: `src/components/TitleBar.jsx`

**Step 1: Write the component**

```jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox } from "@fortawesome/free-solid-svg-icons";
import { Minus, Square, X, Sun, Moon } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppStore } from "../store/useAppStore";

const appWindow = getCurrentWindow();

function TitleBar() {
  const theme = useAppStore((s) => s.settings.theme);
  const setSettings = useAppStore((s) => s.setSettings);
  const isDark = theme !== "light";

  return (
    <div className="flex h-10 items-center justify-between bg-primary-active pl-3 pr-0 text-white select-none">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15">
          <FontAwesomeIcon icon={faBox} className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="font-heading text-sm font-semibold tracking-wide">
          SkoolBox
        </span>
      </div>

      <div className="h-full flex-1" data-tauri-drag-region onDoubleClick={() => appWindow.toggleMaximize()} />

      <div className="flex h-full items-center">
        <button
          type="button"
          onClick={() => setSettings({ theme: isDark ? "light" : "dark" })}
          className="flex h-10 w-12 cursor-pointer items-center justify-center transition-colors hover:bg-white/10"
          aria-label={isDark ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
        >
          {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => appWindow.minimize()}
          className="flex h-10 w-12 cursor-pointer items-center justify-center transition-colors hover:bg-white/10"
          aria-label="Minimer"
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => appWindow.toggleMaximize()}
          className="flex h-10 w-12 cursor-pointer items-center justify-center transition-colors hover:bg-white/10"
          aria-label="Maksimer/gjenopprett"
        >
          <Square size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => appWindow.close()}
          className="flex h-10 w-12 cursor-pointer items-center justify-center transition-colors hover:bg-destructive"
          aria-label="Lukk"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default TitleBar;
```

Note the drag region is its own empty flex-spacer `div`, deliberately not wrapping the logo or the buttons — putting `data-tauri-drag-region` on a container that also holds `<button>`s makes those buttons eat the drag instead of (or as well as) their click, which is a common frameless-window bug.

**Step 2: Verify**

Covered together with Task 7 (needs `decorations: false` to see the *native* titlebar actually gone).

**Step 3: Commit**

```bash
git add src/components/TitleBar.jsx
git commit -m "feat: add custom TitleBar with logo, theme toggle, window controls"
```

---

### Task 7: Remove the native titlebar and mount the custom one

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src/App.jsx` (already updated in Task 5 to render `<TitleBar />`)

**Step 1: Disable native decorations**

In `src-tauri/tauri.conf.json`, add `"decorations": false` to the window config:
```json
      {
        "title": "SkoolBox",
        "width": 1800,
        "height": 1050,
        "minWidth": 1024,
        "minHeight": 768,
        "resizable": true,
        "fullscreen": false,
        "decorations": false
      }
```

**Step 2: Verify end-to-end**

Run: `npm run start` and confirm, in the actual window:
- No native Windows titlebar/border — the top bar is the branded purple `TitleBar` with the box logo and "SkoolBox" wordmark.
- Dragging the empty space between the logo and the buttons moves the window.
- Double-clicking that empty space maximizes/restores the window.
- The sun/moon button toggles the entire app between dark and light instantly.
- Minimize, maximize/restore, and close buttons all work.
- The window is still resizable by dragging its edges/corners (no OS titlebar border does not remove the resize grip on Windows).
- Window opens at the new 1800x1050 size (Task 1).

**Step 3: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "feat: replace native titlebar with custom branded TitleBar"
```

---

### Task 8: Remove the now-duplicate heading from AppShell

**Files:**
- Modify: `src/components/AppShell.jsx:27-29`

**Step 1: Remove the redundant "SkoolBox" heading**

The brand now lives in `TitleBar`. Remove:
```jsx
          <h1 className="font-heading text-2xl font-semibold text-primary">
            SkoolBox
          </h1>
```
from `AppShell.jsx`'s header, leaving the back button and the rest of the header (`activeClass` badge, sound toggle) intact. If the back button was the only other element in that flex container, keep the container even when empty of the heading — no structural change needed beyond deleting those three lines.

**Step 2: Verify**

Run: `npm run start`
Expected: "SkoolBox" appears exactly once (in the TitleBar), not duplicated in the module header below it. Dashboard and other modules still render normally.

**Step 3: Commit**

```bash
git add src/components/AppShell.jsx
git commit -m "refactor: drop duplicate SkoolBox heading now that TitleBar shows it"
```

---

### Task 9: Update the changelog

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add entries under `[Unreleased]`**

Add to the `### Added` section:
```markdown
- Dark mode (default theme) with a toggle in the titlebar, implemented via CSS custom-property overrides.
- Custom branded titlebar (FontAwesome box logo, theme toggle, window controls), replacing the native OS titlebar.
```
Add to the `### Changed` section:
```markdown
- Default launch window size increased from 1280x800 to 1800x1050.
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog entries for dark mode and custom titlebar"
```

---

### Task 10: Full manual pass

**Step 1:** Run `npm run start` one more time after all tasks land, and walk through:
1. App launches dark by default, at 1800x1050, with the custom titlebar (no native OS bar).
2. Toggle theme button switches the whole UI to light and back to dark.
3. Navigate Dashboard → each module (Elevtrekker, Quiz-arena, Nedtelling, Klasseliste) and back — confirm readable contrast in both themes (cards, text, borders).
4. Titlebar drag, double-click-maximize, minimize, maximize, close all work.
5. Restart the app — confirm the last chosen theme persisted (via `tauri-plugin-store`).

**Step 2:** Fix any contrast issues found by adjusting the `.dark` token values in `src/index.css` (Task 3) — do not scatter one-off overrides in component files.
