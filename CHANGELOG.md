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
