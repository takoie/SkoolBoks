# Changelog

All notable changes to SkoolBox are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Replaced the native OS title bar with the app's custom branded title bar.
- Removed the duplicate "SkoolBox" heading from the app shell now that the title bar shows the logo and name.
- Documented dev vs start scripts and build commands in README.
- Increased the default window size to 1800x1050 for more workspace on launch.

### Fixed
- Rebalanced dark mode's primary color so button text and standalone primary-colored text both meet accessible contrast levels.

### Added
- Added a custom title bar with logo, theme toggle, and window controls.
- Added dark mode color tokens, with the app now defaulting to dark mode.
- Theme preference is now persisted in settings and kept in sync with the app's dark/light appearance at runtime.
- Added FontAwesome icon library for use in the app's logo.
- Scaffolded the SkoolBox desktop app (Tauri 2.0 + React 19 + Vite 7), with Rust in `src-tauri/` and the frontend in `src/`.
- Tailwind v4 design system (indigo/lime/peach/coral palette, Fredoka/Nunito fonts) matching the classroom-whiteboard brief.
- Zustand store persisted via `tauri-plugin-store`, shared across all modules (class lists, active class, settings).
- Five baseline modules: Dashboard, Elevtrekker (spin wheel), Quiz-arena (Jeopardy-style board), Nedtelling (timer), Klasseliste (class list admin).
- Synthesized Web Audio API sound effects and `canvas-confetti` micro-interactions, both respecting `prefers-reduced-motion`.
- NSIS and MSI installer targets configured in `tauri.conf.json` (1280x800 window, 1024x768 minimum).
- `npm run start` script to launch the desktop app in dev mode (`npm run dev` remains Vite-only, as required by `beforeDevCommand`).
