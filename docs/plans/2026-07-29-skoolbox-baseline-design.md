# SkoolBox — Baseline Design

## Goal
A Tauri 2.0 + React (Vite) desktop app for classroom/interactive-whiteboard use: a collection of engagement modules (spin wheel, quiz board, timer, class list) shown on a large screen, distributed as a Windows installer (.exe/.msi).

## Architecture
- **Frontend**: `src/` — React (JSX) + Vite + Tailwind CSS + `lucide-react`. One component tree per module under `src/modules/`.
- **Backend**: `src-tauri/` — Rust, Tauri 2.0. No custom Rust commands needed beyond what `tauri-plugin-store` provides for baseline (file-backed KV storage for settings + class lists).
- **Navigation**: state-based (`activeModule` in the store), no router library — 5 screens total.
- **State management**: **Zustand** (not React Context) for the shared class-list/settings state, chosen over Context to avoid cross-module re-renders and because it composes cleanly with a persistence middleware backed by `tauri-plugin-store`. A `usePersistedStore` wraps Zustand's `persist` middleware with a custom storage adapter that reads/writes through the Tauri store plugin instead of `localStorage`.
- **Data model** (persisted):
  ```
  {
    classes: { [classId]: { name: string, students: string[] } },
    activeClassId: string | null,
    drawnStudents: string[],       // SpinWheel "already picked" tracking, per class
    jeopardyBoards: {...},         // saved board state per class/session (baseline: in-memory + optional save)
    settings: { theme, soundEnabled, ... }
  }
  ```

## Design system
Derived via the `ui-ux-pro-max` skill (`--stack react`), tuned manually for legibility at distance (whiteboard/projector use).

- **Colors**: Primary `#4338CA` (hover `#3730A3`, active `#312E81`), Secondary `#3B82F6`, Accent Lime `#84CC16`, Accent Peach `#FDBA74`, Accent Coral `#FB7185`, Background `#F5F3FF` / surface `#FFFFFF`, Dark background `#1E1B4B`, Destructive `#DC2626`. All text pairings verified ≥4.5:1.
- **Typography**: Heading = Fredoka, Body = Nunito (Google Fonts, self-hosted/bundled — no CDN dependency since app runs offline).
- **Shape/elevation**: rounded corners 16–24px, 2–3px borders, soft double-shadow ("claymorphism-lite"), kept subtle enough not to compete with content at a distance.
- **Touch targets**: buttons ≥64px tall, ≥16px gaps (above the 44px WCAG floor, sized for whiteboard/touch use).
- **Motion**: 150–300ms transitions, `canvas-confetti` for win/draw moments, `prefers-reduced-motion` disables non-essential animation (confetti, spin easing) while keeping the outcome instantly visible.
- **Sound**: Web Audio API–synthesized tones (tick, ding, tada) — no external audio assets.
- **Checklist before delivery**: contrast ≥4.5:1 body text, visible focus rings, hover states on all interactive elements, `prefers-reduced-motion` respected, responsive from 1024×768 up.

## Modules (baseline)
1. **Dashboard** — module picker, card grid.
2. **SpinWheel** — random draw from active class list; "remove after draw" toggle so everyone gets picked once before repeats.
3. **Jeopardy** — categories × 100–500 point grid, click to reveal, award points to teams/students.
4. **Timer** — countdown with alarm (synthesized sound) for work/break periods.
5. **ClassList** — paste/edit student names, switch between saved classes.

## Build & distribution
- `tauri.conf.json`: app name SkoolBox, window default 1280×800, resizable, min 1024×768 (projector-friendly).
- Bundler targets: **both NSIS (`-setup.exe`) and MSI** configured from the start. NSIS builds out of the box; MSI requires WiX Toolset installed on the build machine (user's responsibility, already confirmed).

## Out of scope for baseline
- Custom Rust filesystem commands beyond the store plugin.
- Real audio asset files (left as synthesized tones; swappable later).
- Multi-window support, auto-update, cloud sync.
