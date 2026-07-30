# Changelog

All notable changes to SkoolBox are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Scaffolded the SkoolBox desktop app (Tauri 2.0 + React 19 + Vite 7), with Rust in `src-tauri/` and the frontend in `src/`.
- Tailwind v4 design system (indigo/lime/peach/coral palette, Fredoka/Nunito fonts) matching the classroom-whiteboard brief.
- Zustand store persisted via `tauri-plugin-store`, shared across all modules (class lists, active class, settings).
- Five baseline modules: Dashboard, Elevtrekker (spin wheel), Quiz-arena (Jeopardy-style board), Nedtelling (timer), Klasseliste (class list admin).
- Synthesized Web Audio API sound effects and `canvas-confetti` micro-interactions, both respecting `prefers-reduced-motion`.
- NSIS and MSI installer targets configured in `tauri.conf.json` (1280x800 window, 1024x768 minimum).
- `npm run start` script to launch the desktop app in dev mode (`npm run dev` remains Vite-only, as required by `beforeDevCommand`).
- Persisted `quizzes` slice in the Zustand store (create/update/delete quizzes), backing the quiz editor and player views.
- "Nærmest tusen" module: draw 9 digits and reveal the 3x3 digit arrangement whose sum lands closest to 1000, wired into the dashboard and app routing.
- "Terningkast" dice roller module, wired into the dashboard and app routing.
- Elevtrekker now shows a draw-history sidebar listing every student, marking drawn ones with a numbered badge and strikethrough in draw order.
- Split Quiz-arena into a list, editor, and player view: browse saved quizzes, name categories/point levels and fill in question/answer text per cell, then run a saved quiz as a Jeopardy-style board with per-question answer reveal and team scoring — all wired into a single router, replacing the old single-file Jeopardy module.

### Changed
- Documented dev vs start scripts and build commands in README.
