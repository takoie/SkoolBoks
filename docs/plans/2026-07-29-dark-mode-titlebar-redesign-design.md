# Design: Dark mode default, custom titlebar, brand icon, larger default window

Date: 2026-07-29

## Goals

- Dark mode, set as the default theme, with a toggle placed at the top of the app.
- A cohesive look: replace the native OS titlebar (currently a stark light/black bar clashing with the app) with a custom titlebar in the app's own palette.
- A FontAwesome icon (a box) used in the SkoolBox logo/wordmark.
- Default window size at launch changed from 1280x800 to 1800x1050.

## 1. Dark mode

- Tailwind v4 currently defines only a light palette in `src/index.css` (`--color-canvas`, `--color-surface`, `--color-ink`, accent colors). Dark mode needs to be togglable by the user, not just OS-driven, so add:
  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```
- Add dark-mode tokens:
  - Dark background reuses the existing (currently unused) `--color-canvas-dark: #1e1b4b`.
  - Dark-mode text reuses the existing light-mode background `--color-canvas: #f5f3ff` (a natural inversion).
  - Add a dark surface (card) tone and dark border tone (e.g. white/10 instead of ink/10).
  - Keep the primary/lime/peach/coral accents as-is; verify contrast against the dark background during implementation and adjust only if needed.
- `settings.theme` is added to the Zustand store (`src/store/useAppStore.js`), persisted via the existing `tauri-plugin-store` persistence, defaulting to `"dark"`.
- A `dark` class is applied to `<html>` reactively based on `settings.theme`.

## 2. Custom titlebar

- Native OS titlebar removed via `"decorations": false` in `src-tauri/tauri.conf.json`.
- New `src/components/TitleBar.jsx`: a slim bar marked `data-tauri-drag-region` for window dragging, styled with the app palette (not OS default), containing:
  - Left: the SkoolBox logo (icon + wordmark).
  - Right: a light/dark toggle button, then minimize / maximize-restore / close buttons wired to `getCurrentWindow()` from `@tauri-apps/api/window`.
- Since the brand now lives in the titlebar, remove the duplicate "SkoolBox" heading currently in `AppShell.jsx`'s header, keeping the back button, active class/student count, and sound toggle there.
- `resizable: true` is kept in `tauri.conf.json`; removing decorations only removes the caption/titlebar, not the resize border, so window resizing continues to work without extra drag-region plumbing.

## 3. Logo icon

- Add FontAwesome packages: `@fortawesome/react-fontawesome`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/fontawesome-svg-core`.
- Use the solid `faBox` icon (closed box) in a rounded accent tile next to the "SkoolBox" wordmark in the titlebar.

## 4. Window size

- `src-tauri/tauri.conf.json`: `width`/`height` changed from 1280/800 to 1800/1050. `minWidth`/`minHeight` (1024/768) unchanged.

## Out of scope

- No changes to module content (Dashboard, SpinWheel, Jeopardy, Timer, ClassList) beyond dark-mode-compatible styling that falls out of the token changes.
- No macOS/Linux-specific titlebar treatment beyond what Tauri's cross-platform APIs provide by default.
