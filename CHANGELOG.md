# Changelog

All notable changes to SkoolBox are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Elevtrekker now shows a draw-history sidebar listing every student, marking drawn ones with a numbered badge and strikethrough in draw order.
- Added a quiz list view for browsing saved quizzes.
- Added a quiz editor view for naming categories/point levels and filling in question/answer text per cell.
- Added a quiz player view for running a saved quiz as a Jeopardy-style board, with per-question answer reveal and team scoring.

### Fixed
- "Nærmest tusen": `drawNext` now reads/writes a ref-mirrored draw list instead of the `draws` closure, so two clicks racing ahead of a re-render can no longer drop a digit or double-fire the tick/tada sound.
- "Nærmest tusen": resetting the game now clears the draw list immediately, preventing a stale digit from sneaking in if you draw right after a reset.
- Quiz player no longer crashes if it's ever mounted with a quiz id that doesn't exist; it now renders nothing instead of throwing.

### Changed
- Documented dev vs start scripts and build commands in README.

### Added
- Scaffolded the SkoolBox desktop app (Tauri 2.0 + React 19 + Vite 7), with Rust in `src-tauri/` and the frontend in `src/`.
- Tailwind v4 design system (indigo/lime/peach/coral palette, Fredoka/Nunito fonts) matching the classroom-whiteboard brief.
- Zustand store persisted via `tauri-plugin-store`, shared across all modules (class lists, active class, settings).
- Five baseline modules: Dashboard, Elevtrekker (spin wheel), Quiz-arena (Jeopardy-style board), Nedtelling (timer), Klasseliste (class list admin).
- Synthesized Web Audio API sound effects and `canvas-confetti` micro-interactions, both respecting `prefers-reduced-motion`.
- NSIS and MSI installer targets configured in `tauri.conf.json` (1280x800 window, 1024x768 minimum).
- `npm run start` script to launch the desktop app in dev mode (`npm run dev` remains Vite-only, as required by `beforeDevCommand`).
- Persisted `quizzes` slice in the Zustand store (create/update/delete quizzes) to back upcoming quiz editor and player views.
- `findClosestArrangement` math helper for the "Nærmest tusen" game, finding the 3x3 digit arrangement whose sum lands closest to 1000.
- "Nærmest tusen" module: draw 9 digits and reveal the closest-to-1000 arrangement, wired into the dashboard and app routing.
- "Terningkast" dice roller module, wired into the dashboard and app routing.
