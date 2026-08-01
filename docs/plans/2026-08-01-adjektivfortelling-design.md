# Adjektivfortelling — Design

## Summary

New module: a digital "Mad Libs"-style storytelling game. The teacher writes
or pastes a story with inline word-class placeholders
(`[ADJEKTIV:n]`, `[SUBSTANTIV:n]`, `[VERB:n]`, `[ADVERB:n]`). In class, a
projector view shows one placeholder at a time (word class only, no story
text) for the class to fill in; the teacher types the agreed word and the
view advances seamlessly to the next. Once all slots are filled, a reveal
phase shows the finished story either line-by-line or full-screen, with
inserted words highlighted.

## Data model (`useAppStore.js`)

New persisted top-level slice, global (not per-class), same shape family as
`quizzes` / `wheels` / `tofaktaSessions`:

```js
adjectiveStories: {
  [id]: {
    id,
    title,
    createdAt,
    text: "En [ADJEKTIV:0] mann gikk til [SUBSTANTIV:1] butikken...",
  }
}
```

Only free text with inline markers is stored — no separate slot list.
`slots` (ordered `{ index, type }`) are always *derived* from `text` via
`parseSlots()`, so the text is the single source of truth and there's no
risk of it drifting out of sync with a stored slot array. The `:n` suffix is
an author-facing index (unique per marker) so the same word class can appear
multiple times without collision; `parseSlots` returns slots in the order
they appear in the text, independent of the numeric suffix value.

Actions (mirroring `createTofaktaSession` / `renameTofaktaSession` /
`deleteTofaktaSession`):
- `createAdjectiveStory(title)` → id, seeds `text: ""`
- `updateAdjectiveStory(id, partial)` — merge (used for title/text edits)
- `deleteAdjectiveStory(id)`

Add `adjectiveStories: {}` to the persisted `partialize` set.

## Helper library (`src/lib/adjectiveStory.js`)

Pure functions, no state:
- `WORD_TYPES = ["adjektiv", "substantiv", "verb", "adverb"]` with Norwegian
  display labels.
- `parseSlots(text)` — regex-scans for `[TYPE:n]` markers in document order,
  returns `[{ index: n, type, raw: "[ADJEKTIV:0]", start, end }]`.
- `insertMarker(text, cursorPos, type)` — computes the next free `n` for that
  marker set (`max existing index + 1`) and splices `[TYPE:n]` in at
  `cursorPos`; returns `{ text, cursorPos: newPos }` so the editor can
  restore textarea selection after insert.
- `renderWithAnswers(text, answers)` — replaces each marker with
  `answers[slot.index]` (or the raw marker if unanswered, for safety),
  returning plain text with markers substituted.
- `renderSegments(text, answers)` — like above but returns an array of
  `{ text, isAnswer }` segments so `RevealView` can highlight just the
  inserted words instead of re-parsing rendered text.
- `splitIntoLines(text)` — splits on `\n`, drops empty lines, used by
  line-by-line reveal.

## Components (`src/modules/adjektivfortelling/`)

Mirrors the Tofakta `list → editor → present` structure
(`TofaktaArena.jsx` / `SessionList.jsx` / `SessionEditor.jsx` /
`PresentationView.jsx`):

- **`AdjektivfortellingArena.jsx`** — view-state machine:
  `{ mode: "list" }` → `{ mode: "editor", storyId }` →
  `{ mode: "collect", storyId }` → `{ mode: "reveal", storyId }`.
  Collecting answers is session-only (not persisted), held in this
  component's state as `{ answers: {index: word}, currentSlotIndex }` and
  passed down; navigating back to editor or list discards it (no draft
  recovery — matches the "one live round at a time" pattern used
  elsewhere, e.g. `stiansGame`'s ephemeral review state).
- **`StoryList.jsx`** — grid/list of saved stories (create new, open, rename
  inline, delete with confirm), styled after `SessionList.jsx`.
- **`StoryEditor.jsx`** — title input + `<textarea>` (ref-based) for the
  story body, with a small button row above it: Adjektiv / Substantiv /
  Verb / Adverb. Clicking a button calls `insertMarker` at the textarea's
  current `selectionStart`, updates the story text via
  `updateAdjectiveStory`, and refocuses the textarea at the new cursor
  position. Below the textarea, a live-derived (`parseSlots`) readout:
  "8 ord å fylle inn: 3 adjektiv, 2 substantiv...". "Start innsamling"
  button (disabled if zero slots) transitions to `collect`.
- **`CollectView.jsx`** — projector view. Shows only the current slot's word
  class in large text (e.g. "ADJEKTIV"), a progress indicator ("3 av 8"),
  and a large input the teacher types into, confirmed via Enter or a
  "Neste →" button. Confirming stores the answer and advances
  `currentSlotIndex`; on the last slot, confirming transitions straight to
  `reveal`. The story text itself is never rendered in this view.
- **`RevealView.jsx`** — toggle between two sub-views (teacher-controlled,
  switchable at any time):
  - *Linje for linje*: `splitIntoLines` + `renderSegments` per line; shows
    one line at a time, large centered text, inserted words in a
    Tailwind accent color/weight; "Neste linje →" button and
    `ArrowRight`/`Space` keydown advance; wraps back to story-complete
    state after the last line.
  - *Fullskjerm*: `renderSegments(text, answers)` over the whole story at
    once, same highlight styling, in a scrollable full-height reading
    view.
  Both share the same highlight treatment so switching mid-reveal doesn't
  feel inconsistent.

## Dashboard / routing

- New module id `"adjektivfortelling"`, registered in `App.jsx`'s
  `MODULE_COMPONENTS` (component: `AdjektivfortellingArena`) and as a card
  in `Dashboard.jsx`'s `MODULES` array (icon: lucide `Feather`, title
  "Adjektivfortelling", description along the lines of "Fyll inn adjektiv,
  substantiv og verb — les historien sammen etterpå.").

## Out of scope

- No difficulty/category tagging, no import/export of stories, no
  per-class scoping (global bank only, per brainstorming decision).
- No autosave of in-progress collection if the teacher navigates away —
  restarting collection re-asks all slots from scratch.
