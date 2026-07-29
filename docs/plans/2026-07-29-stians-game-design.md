# Stians game & Timer seconds — Design

## Goal
1. Add a seconds input to the existing **Timer** (Nedtelling) module.
2. Add a new module, **Stians game** — a live classroom word-category game (Norwegian "alfabet-spillet" / Scattergories style) played in rounds: draw a letter, groups write category answers on paper within a time limit, then the class reviews answers together and the teacher awards points.

## 1. Timer module change
`src/modules/Timer.jsx`: add a second custom input, seconds (0–59), next to the existing minutes input. `duration`/`remaining` become `minutes * 60 + seconds`. Presets (1/3/5/10 min) unchanged. No store changes needed — this stays local `useState`, matching the existing pattern.

## 2. Stians game — data model
State must survive navigating away and back (teacher may switch modules mid-game), so it lives in the persisted Zustand store (`useAppStore`), not local component state like Jeopardy.

```js
// useAppStore additions
categoryBank: string[], // reusable named categories, e.g. ["Bilmerker", "Dyr", "Yrker"]

stiansGame: {
  groups: [{ id, name }],          // free-text team names, not tied to ClassList
  categories: string[],            // active set for this session (from bank or ad hoc)
  usedLetters: string[],           // letters already drawn this session (incl. Æ Ø Å)
  currentLetter: string | null,
  phase: "setup" | "idle" | "writing" | "reviewing",
  pointsPerRound: number,          // 1 normal, 2 dobbel, 3 trippel, or custom
  bonusEnabled: boolean,
  bonusPoints: number,
  leadGroupId: string | null,      // group that shouted / starts this round's review order
  review: {                        // in-progress, current round only
    categoryIndex: number,
    groupOrder: string[],          // group ids, starting from leadGroupId, wrapped
    marks: { [groupId]: { [category]: boolean } }, // approved/not, filled as teacher clicks
  } | null,
  scores: { [groupId]: { [category]: number } },   // cumulative, feeds the scoreboard grid
  timerSeconds: number,            // configurable countdown length for the writing phase
},
```

Store actions (mirroring existing action style in `useAppStore.js`): `addGroup`, `renameGroup`, `removeGroup`, `setGameCategories`, `addCategoryToBank`, `removeCategoryFromBank`, `drawLetter`, `rerollLetter`, `setManualLetter`, `setPointsPerRound`, `setBonusEnabled`, `setBonusPoints`, `startWriting`, `groupShouted(groupId)`, `stopWriting()`, `startReview()`, `markApproval(groupId, approved)` (auto-advances turn/category), `commitRound()` (folds `review.marks` × `pointsPerRound` + bonus into `scores`, clears `review`, returns to `idle`), `resetGameScores()`, `resetGameFull()`.

`categoryBank` and `stiansGame` are added to the persisted `partialize` list alongside `classes`/`settings`.

## 3. Game flow (state machine)

**Setup** (once per game): add/rename/remove groups; check categories in from `categoryBank` into `categories` (or type a new one, which also saves it to the bank). "Start spill" moves to `idle`.

**Idle**: "Trekk bokstav" draws a random unused letter (Norwegian alphabet incl. æøå, tracked via `usedLetters`; wraps once exhausted). "Trekk på nytt" is available until writing starts — redraws without consuming the skipped letter (it goes back in the pool), so a hard letter (Q, X, C…) doesn't cost a full round. Teacher can also type a manual letter. Teacher also sets `pointsPerRound` and optional bonus here before starting.

**Writing**: fullscreen-style view with the big letter + active categories (mirrors the physical handout in image 1). A built-in countdown (seconds, reusing Timer's interval logic) runs alongside a "[Gruppenavn] ropte!" button per group and a plain "Stopp" button — whichever fires first ends writing (`stopWriting`). A group button also sets `leadGroupId`; the plain stop / timer expiry leaves it `null` (no bonus-eligible group unless the teacher assigns one manually in the bonus control).

**Reviewing** (Phase 3): one category at a time (starting with `categories[0]`); groups cycle in turn order starting from `leadGroupId` (or the first group if none shouted), wrapping around. The current group is visually highlighted. Teacher clicks **Godkjent / Ikke godkjent** — purely their live call (covers both wrong answers and duplicates, no typing). Auto-advances group → next category. After the last group of the last category, `commitRound()` runs automatically: approved marks × `pointsPerRound` added to `scores[group][category]`, bonus (if enabled) added once to `leadGroupId`. Returns to `idle` for the next letter.

**End game (Phase 4)**: "Avslutt spill" locks the round, highlights the winner (highest total, confetti via existing `fireConfetti`), offers "Nytt spill med samme lag/kategorier" (`resetGameScores`) or "Helt nytt spill" (`resetGameFull`, back to Setup).

## 4. Scoreboard screen
Always-visible grid during idle/writing/reviewing, mirroring the reference layout: groups as rows, categories as columns, per-cell cumulative score, highlighted TOTAL column (row sum). This is the primary "on the projector" view; review controls overlay/append to it rather than replacing it, so the teacher can operate the round while the class still sees the score grid.

## 5. Category bank
Flat, persisted list of category name strings (`categoryBank`), managed from the Setup screen: add new / delete existing, checkboxes to pull individual categories into the current game's `categories`.

## Visual design
New module card on Dashboard: icon `Puzzle` or `MessageSquareText` (lucide-react), accent `secondary` (blue, currently unused by other cards) to keep it visually distinct from Jeopardy (peach) and SpinWheel (coral). Same claymorphism styling (rounded-xl2, shadow-clay, font-heading/body) as existing modules.

## Out of scope
- Typed-answer entry / automatic duplicate text-matching (explicitly rejected — approvals are a live, verbal, teacher-judged call).
- Linking groups to the saved ClassList/student roster.
- Named category *sets* (only individual categories in the bank, per requirements).
- Multi-game history / stats across sessions beyond the current game's cumulative scoreboard.
