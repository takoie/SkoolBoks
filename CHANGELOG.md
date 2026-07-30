# Changelog

All notable changes to SkoolBox are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Replaced the native OS title bar with the app's custom branded title bar.
- Removed the duplicate "SkoolBox" heading from the app shell now that the title bar shows the logo and name.
- Documented dev vs start scripts and build commands in README.
- Increased the default window size to 1800x1050 for more workspace on launch.

### Fixed
- Fixed the app layout to use shared h-screen so the title bar and app shell don't overflow the window together.
- Rebalanced dark mode's primary color so button text and standalone primary-colored text both meet accessible contrast levels.
- Fixed the custom title bar's window controls and drag-to-move/resize not working due to missing app permissions.
- Restored the ability to resize the window by dragging its edges/corners, which was lost when the native title bar was removed.
- Fixed title bar buttons occasionally being obscured by the window's resize-drag regions.
- Raised the titlebar button cluster above window resize-handle overlays using z-index.

### Added
- Added a custom title bar with logo, theme toggle, and window controls.
- Added dark mode color tokens, with the app now defaulting to dark mode.
- Theme preference is now persisted in settings and kept in sync with the app's dark/light appearance at runtime.
- Added FontAwesome icon library for use in the app's logo.
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
