# Changelog

All notable changes to SkoolBox are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Added the underlying data storage for a new "Hjul" (wheel) picker module, letting the app remember wheel names, options, and spin-removal settings (UI for it lands in a later update).
- Added the core wheel-spin logic (picking a winner, spin rotation, and slice colors) for the upcoming "Hjul" (wheel) picker module.
- Added a sector editor for the upcoming "Hjul" (wheel) picker module, letting users add, remove, and bulk-import wheel options from pasted text.
- Added a list view for the upcoming "Hjul" (wheel) picker module, letting users create, open, and delete wheels.
- Added the interactive spinner screen for the upcoming "Hjul" (wheel) picker module, with an animated SVG wheel, spin/undo/reset controls, and an embedded sector editor.
- Added the view switcher that ties together the wheel list and spinner screens for the upcoming "Hjul" (wheel) picker module.
- Stians game: Review phase now supports 50% credit and minus-point marks in addition to godkjent/ikke godkjent, and any group can be marked at any time instead of a fixed turn order — useful when several groups gave the same wrong answer.
- Stians game: Scoreboard highlights the category column currently under review and previews pending points live as "forrige+endring" (e.g. "0+1") before the round is committed.

### Changed
- Stians game: The manual letter input is now masked (shown as dots) so the letter stays hidden until "Bruk" reveals it in the main display.
- Updated changelog to document recent Stians game feature branch merge.
- Merged Stians game feature branch with completed game mechanics, UI polish, and accessibility improvements.
- Updated CHANGELOG.md with merged feature documentation.

### Fixed
- Stians game: Fixed round letter persistence, added mid-round game exit, wired up team name editing with input validation.
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
- Quiz-arena editor and player now show a friendly "quiz not found" message with a way back instead of a blank page, and the player plays a sound when a question is opened or a team's score changes.

### Added
- Added `.gitignore` to exclude unnecessary files from version control and included the site hero image.
- Added a custom title bar with logo, theme toggle, and window controls.
- Added dark mode color tokens, with the app now defaulting to dark mode.
- Theme preference is now persisted in settings and kept in sync with the app's dark/light appearance at runtime.
- Added FontAwesome icon library for use in the app's logo.
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
- Persisted `quizzes` slice in the Zustand store (create/update/delete quizzes), backing the quiz editor and player views.
- "Nærmest tusen" module: draw 9 digits and reveal the 3x3 digit arrangement whose sum lands closest to 1000, wired into the dashboard and app routing.
- "Terningkast" dice roller module, wired into the dashboard and app routing.
- Elevtrekker now shows a draw-history sidebar listing every student, marking drawn ones with a numbered badge and strikethrough in draw order.
- Split Quiz-arena into a list, editor, and player view: browse saved quizzes, name categories/point levels and fill in question/answer text per cell, then run a saved quiz as a Jeopardy-style board with per-question answer reveal and team scoring — all wired into a single router, replacing the old single-file Jeopardy module.
