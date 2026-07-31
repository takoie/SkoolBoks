# Changelog

All notable changes to SkoolBox are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed
- Stians game: Fixed React setState-during-render warning in writing-timer expiry handling.
- Stians game: Winner announcement in ended phase now uses live region for screen reader consistency with other phases.
- Stians game: Fixed reviewing-phase focus to prevent accidental approval on stray Enter key presses, and improved turn change announcements.
- Stians game: Improved reviewing-phase accessibility with turn announcements, focus management, non-color status indicators, and group context labels.
- Stians game: Fixed writing-phase timer to guard against invalid start/pause actions when time is already at zero, and added live region for letter display.
- Stians game: Round config number inputs now commit on blur, and manual letter overrides reject non-letter characters. Minor accessibility improvements.
- Stians game: Fixed numeric setters to correctly clamp zero values, deduplicate category lists, and prevent deadlock in empty reviews.
- Timer display now correctly clamps custom duration field values to match the applied timer duration.
- Stians game: Category bank deletions now stay in sync with active game categories, and category toggles display as pressed.

### Changed
- Documented dev vs start scripts and build commands in README.

### Added
- Stians game: Added the reviewing-phase turn order with per-group approval controls.
- Stians game: Added the writing-phase countdown timer, with per-group "shout to stop" buttons and a manual stop control.
- Stians game: Added a live scoreboard and idle-phase controls for drawing letters and starting rounds.
- Stians game module is now navigable from the dashboard, with a Setup phase for adding groups and picking categories from the shared bank.
- Persisted store state for the Stians game (groups, categories, letter draws, scoring config, review progress) and a shared category bank, not yet wired into the UI.
- Core Stians game logic (letter drawing, review turn order, round scoring, and winner calculation), not yet wired into the UI.
- Countdown timer now has a seconds input alongside minutes, so custom durations aren't limited to whole minutes.
- Implementation plan for Timer seconds input and Stians game module.
- Design document for Timer seconds input and Stians game module.
- Implementation plan for new modules (dice roller, Nærmest tusen, Elevtrekker history) and Quiz-arena split.
- Git worktrees are now excluded from version control.
- Design document for dice roller, Nærmest tusen, Elevtrekker history, and Quiz-arena create/play split.
- Implementation plan for dark mode, custom titlebar, and window size.
- Design document for dark mode, custom titlebar, and window size changes.
- Scaffolded the SkoolBox desktop app (Tauri 2.0 + React 19 + Vite 7), with Rust in `src-tauri/` and the frontend in `src/`.
- Tailwind v4 design system (indigo/lime/peach/coral palette, Fredoka/Nunito fonts) matching the classroom-whiteboard brief.
- Zustand store persisted via `tauri-plugin-store`, shared across all modules (class lists, active class, settings).
- Five baseline modules: Dashboard, Elevtrekker (spin wheel), Quiz-arena (Jeopardy-style board), Nedtelling (timer), Klasseliste (class list admin).
- Synthesized Web Audio API sound effects and `canvas-confetti` micro-interactions, both respecting `prefers-reduced-motion`.
- NSIS and MSI installer targets configured in `tauri.conf.json` (1280x800 window, 1024x768 minimum).
- `npm run start` script to launch the desktop app in dev mode (`npm run dev` remains Vite-only, as required by `beforeDevCommand`).
