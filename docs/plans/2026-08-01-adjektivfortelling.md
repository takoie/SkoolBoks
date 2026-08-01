# Adjektivfortelling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an "Adjektivfortelling" module: teacher writes a story with inline word-class placeholders, class fills them in one at a time on a projector view, then the finished story is revealed line-by-line or full-screen with inserted words highlighted.

**Architecture:** New `adjectiveStories` slice in `useAppStore.js` (global bank, same shape family as `tofaktaSessions`). `src/lib/adjectiveStory.js` holds pure parsing/rendering helpers (no state). `src/modules/adjektivfortelling/` holds `AdjektivfortellingArena.jsx` (list/editor/collect/reveal state machine, mirrors `TofaktaArena.jsx`), `StoryList.jsx`, `StoryEditor.jsx`, `CollectView.jsx`, `RevealView.jsx`. Registered in `Dashboard.jsx` and `App.jsx` like every other module.

**Tech Stack:** React 19, Zustand (persist), Tailwind v4, lucide-react. No test framework in this repo — verification is manual via `npm run dev` plus `node -e` checks for the pure `adjectiveStory.js` logic.

**Design doc:** `docs/plans/2026-08-01-adjektivfortelling-design.md`

---

### Task 1: Story parsing/rendering helpers (`src/lib/adjectiveStory.js`)

**Files:**
- Create: `src/lib/adjectiveStory.js`

**Step 1: Write the module**

```js
export const WORD_TYPES = [
  { type: "adjektiv", label: "Adjektiv" },
  { type: "substantiv", label: "Substantiv" },
  { type: "verb", label: "Verb" },
  { type: "adverb", label: "Adverb" },
];

const WORD_TYPE_SET = new Set(WORD_TYPES.map((w) => w.type));

const MARKER_RE = /\[([A-ZÆØÅ]+):(\d+)\]/g;

// Returns slots in document order: [{ index, type, raw, start, end }]
export function parseSlots(text) {
  const slots = [];
  MARKER_RE.lastIndex = 0;
  let match;
  while ((match = MARKER_RE.exec(text)) !== null) {
    const type = match[1].toLowerCase();
    if (!WORD_TYPE_SET.has(type)) continue;
    slots.push({
      index: Number(match[2]),
      type,
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return slots;
}

// Splices a `[TYPE:n]` marker into `text` at `cursorPos`, picking the next
// free index for that word type so repeated types don't collide.
export function insertMarker(text, cursorPos, type) {
  const existing = parseSlots(text).filter((s) => s.type === type);
  const nextIndex =
    existing.length === 0 ? 0 : Math.max(...existing.map((s) => s.index)) + 1;
  const marker = `[${type.toUpperCase()}:${nextIndex}]`;
  const before = text.slice(0, cursorPos);
  const after = text.slice(cursorPos);
  return {
    text: before + marker + after,
    cursorPos: cursorPos + marker.length,
  };
}

// Replaces each marker with its answer (or leaves the raw marker if
// unanswered), returning plain text.
export function renderWithAnswers(text, answers) {
  return text.replace(MARKER_RE, (raw, type, indexStr) => {
    const key = Number(indexStr);
    const answer = answers[key];
    return answer && answer.trim() ? answer.trim() : raw;
  });
}

// Like renderWithAnswers, but returns [{ text, isAnswer }] segments so the
// reveal view can highlight only the inserted words.
export function renderSegments(text, answers) {
  const segments = [];
  let lastEnd = 0;
  for (const slot of parseSlots(text)) {
    if (slot.start > lastEnd) {
      segments.push({ text: text.slice(lastEnd, slot.start), isAnswer: false });
    }
    const answer = answers[slot.index];
    segments.push({
      text: answer && answer.trim() ? answer.trim() : slot.raw,
      isAnswer: true,
    });
    lastEnd = slot.end;
  }
  if (lastEnd < text.length) {
    segments.push({ text: text.slice(lastEnd), isAnswer: false });
  }
  return segments;
}

export function splitIntoLines(text) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}
```

**Step 2: Manual verification**

Run:
```bash
node -e "
const m = require('./src/lib/adjectiveStory.js');
" 2>&1 || true
```
This file uses ESM `export`, so `require` will fail — instead verify with a small ESM smoke test:

```bash
node --input-type=module -e "
import { parseSlots, insertMarker, renderWithAnswers, renderSegments, splitIntoLines } from './src/lib/adjectiveStory.js';
const text = 'En [ADJEKTIV:0] mann gikk til [SUBSTANTIV:1] butikken.\nHan [VERB:2] [ADVERB:3].';
console.log(JSON.stringify(parseSlots(text)));
console.log(insertMarker('abcdef', 3, 'verb'));
console.log(renderWithAnswers(text, {0: 'rar', 1: 'gule', 2: 'løp', 3: 'sakte'}));
console.log(JSON.stringify(renderSegments(text, {0: 'rar', 1: 'gule', 2: 'løp', 3: 'sakte'})));
console.log(splitIntoLines(text));
"
```

Expected: 4 slots in order (adjektiv, substantiv, verb, adverb) with indices 0-3; `insertMarker` splices `[VERB:0]` at position 3; `renderWithAnswers` prints "En rar mann gikk til gule butikken.\nHan løp sakte."; `renderSegments` alternates plain/answer segments; `splitIntoLines` returns the two non-empty lines.

**Step 3: Commit**

```bash
git add src/lib/adjectiveStory.js
git commit -m "feat: add adjective story parsing and rendering helpers"
```

---

### Task 2: Store — `adjectiveStories` slice

**Files:**
- Modify: `src/store/useAppStore.js`

**Step 1: Add the slice and actions**

Add near the other feature slices (after the `tofaktaSessions`-related actions, before `bomb:`):

```js
      adjectiveStories: {},

      createAdjectiveStory: (title) => {
        const id = crypto.randomUUID();
        set((s) => ({
          adjectiveStories: {
            ...s.adjectiveStories,
            [id]: {
              id,
              title: title.trim() || "Ny historie",
              createdAt: new Date().toISOString(),
              text: "",
            },
          },
        }));
        return id;
      },

      updateAdjectiveStory: (id, partial) =>
        set((s) => ({
          adjectiveStories: {
            ...s.adjectiveStories,
            [id]: { ...s.adjectiveStories[id], ...partial },
          },
        })),

      deleteAdjectiveStory: (id) =>
        set((s) => {
          const adjectiveStories = { ...s.adjectiveStories };
          delete adjectiveStories[id];
          return { adjectiveStories };
        }),
```

In `partialize`, add `adjectiveStories: s.adjectiveStories,` alongside the other keys (e.g. next to `tofaktaSessions: s.tofaktaSessions,`).

**Step 2: Verify**

Run: `npm run dev`, open the app in the browser/window that opens — confirm no console errors on load (store still constructs/persists correctly).

**Step 3: Commit**

```bash
git add src/store/useAppStore.js
git commit -m "feat: add adjectiveStories state and actions to store"
```

---

### Task 3: `StoryList.jsx`

**Files:**
- Create: `src/modules/adjektivfortelling/StoryList.jsx`

**Step 1: Write the component**

```jsx
import { Pencil, Trash2, Plus } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function StoryList({ onOpen }) {
  const stories = useAppStore((s) => s.adjectiveStories);
  const createAdjectiveStory = useAppStore((s) => s.createAdjectiveStory);
  const deleteAdjectiveStory = useAppStore((s) => s.deleteAdjectiveStory);

  const list = Object.values(stories).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  function handleNewStory() {
    const title = `Historie ${list.length + 1}`;
    const id = createAdjectiveStory(title);
    onOpen(id);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-ink">
          Adjektivfortelling
        </h2>
        <button
          type="button"
          onClick={handleNewStory}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={20} aria-hidden="true" />
          Ny historie
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-lg text-ink/60">
          Ingen historier laget ennå. Klikk «Ny historie» for å komme i gang.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((story) => (
            <li
              key={story.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay"
            >
              <p className="font-heading text-xl font-semibold text-ink">
                {story.title}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(story.id)}
                  className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-4 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <Pencil size={18} aria-hidden="true" />
                  Åpne
                </button>
                <button
                  type="button"
                  onClick={() => deleteAdjectiveStory(story.id)}
                  aria-label={`Slett ${story.title}`}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StoryList;
```

**Step 2: Commit**

```bash
git add src/modules/adjektivfortelling/StoryList.jsx
git commit -m "feat: add adjective story list view"
```

---

### Task 4: `StoryEditor.jsx`

**Files:**
- Create: `src/modules/adjektivfortelling/StoryEditor.jsx`

**Step 1: Write the component**

```jsx
import { useRef } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { WORD_TYPES, parseSlots, insertMarker } from "../../lib/adjectiveStory";

function StoryEditor({ storyId, onBack, onCollect }) {
  const story = useAppStore((s) => s.adjectiveStories[storyId]);
  const updateAdjectiveStory = useAppStore((s) => s.updateAdjectiveStory);
  const textareaRef = useRef(null);

  if (!story) return null;

  const slots = parseSlots(story.text);
  const canCollect = slots.length > 0;
  const counts = WORD_TYPES.map(({ type, label }) => ({
    label,
    count: slots.filter((s) => s.type === type).length,
  })).filter((c) => c.count > 0);

  function handleInsert(type) {
    const el = textareaRef.current;
    const cursorPos = el ? el.selectionStart : story.text.length;
    const { text, cursorPos: newPos } = insertMarker(story.text, cursorPos, type);
    updateAdjectiveStory(storyId, { text });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(newPos, newPos);
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Tilbake til historie-listen"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <input
          value={story.title}
          onChange={(e) => updateAdjectiveStory(storyId, { title: e.target.value })}
          className="min-w-0 flex-1 rounded-xl2 border-2 border-transparent bg-transparent px-2 py-1 font-heading text-2xl font-semibold text-ink outline-none transition-colors focus:border-primary/40 focus:bg-surface"
        />
        <button
          type="button"
          onClick={onCollect}
          disabled={!canCollect}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play size={20} aria-hidden="true" />
          Start innsamling
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {WORD_TYPES.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => handleInsert(type)}
            className="cursor-pointer rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-heading font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            + {label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={story.text}
        onChange={(e) => updateAdjectiveStory(storyId, { text: e.target.value })}
        rows={14}
        placeholder="Skriv eller lim inn historien her, og bruk knappene over for å sette inn ord-plassholdere der ordklassen skal mangle."
        className="w-full rounded-xl2 border-2 border-ink/10 bg-surface p-4 font-body text-lg leading-relaxed text-ink outline-none transition-colors focus:border-primary/40"
      />

      <p className="mt-3 text-base text-ink/60">
        {slots.length === 0
          ? "Ingen plassholdere satt inn ennå."
          : `${slots.length} ord å fylle inn: ${counts
              .map((c) => `${c.count} ${c.label.toLowerCase()}`)
              .join(", ")}.`}
      </p>
    </div>
  );
}

export default StoryEditor;
```

**Step 2: Commit**

```bash
git add src/modules/adjektivfortelling/StoryEditor.jsx
git commit -m "feat: add adjective story editor with placeholder insertion"
```

---

### Task 5: `CollectView.jsx`

**Files:**
- Create: `src/modules/adjektivfortelling/CollectView.jsx`

**Step 1: Write the component**

```jsx
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { parseSlots, WORD_TYPES } from "../../lib/adjectiveStory";

const LABEL_BY_TYPE = Object.fromEntries(WORD_TYPES.map((w) => [w.type, w.label]));

function CollectView({ story, onBack, onComplete }) {
  const slots = parseSlots(story.text);
  const [slotIndex, setSlotIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [value, setValue] = useState("");

  const slot = slots[slotIndex];
  const isLast = slotIndex >= slots.length - 1;

  function handleConfirm(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const nextAnswers = { ...answers, [slot.index]: trimmed };
    if (isLast) {
      onComplete(nextAnswers);
      return;
    }
    setAnswers(nextAnswers);
    setValue("");
    setSlotIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
      <button
        type="button"
        onClick={onBack}
        aria-label="Tilbake til redigering"
        className="absolute left-6 top-6 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
      >
        <ArrowLeft size={22} aria-hidden="true" />
      </button>

      <p className="font-heading text-xl font-semibold text-ink/50">
        {slotIndex + 1} av {slots.length}
      </p>

      <h2 className="font-heading text-6xl font-bold text-primary">
        {LABEL_BY_TYPE[slot.type]}
      </h2>

      <form onSubmit={handleConfirm} className="flex w-full flex-col items-center gap-4">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl2 border-4 border-ink/10 bg-surface px-6 py-5 text-center font-body text-3xl text-ink outline-none transition-colors focus:border-primary/40"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLast ? "Fullfør" : "Neste →"}
        </button>
      </form>
    </div>
  );
}

export default CollectView;
```

**Step 2: Commit**

```bash
git add src/modules/adjektivfortelling/CollectView.jsx
git commit -m "feat: add projector-style word collection view"
```

---

### Task 6: `RevealView.jsx`

**Files:**
- Create: `src/modules/adjektivfortelling/RevealView.jsx`

**Step 1: Write the component**

```jsx
import { useState } from "react";
import { ArrowLeft, ChevronRight, Rows3, Maximize } from "lucide-react";
import { splitIntoLines, renderSegments } from "../../lib/adjectiveStory";

function Segments({ segments }) {
  return segments.map((seg, i) =>
    seg.isAnswer ? (
      <span key={i} className="font-semibold text-primary">
        {seg.text}
      </span>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}

function RevealView({ story, answers, onBack }) {
  const [mode, setMode] = useState("lines");
  const [lineIndex, setLineIndex] = useState(0);

  const lines = splitIntoLines(story.text);
  const isLastLine = lineIndex >= lines.length - 1;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Tilbake til redigering"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h2 className="font-heading text-3xl font-semibold text-ink">{story.title}</h2>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setMode("lines")}
            className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
              mode === "lines"
                ? "border-primary bg-primary text-white"
                : "border-ink/10 text-ink hover:bg-ink/5"
            }`}
          >
            <Rows3 size={18} aria-hidden="true" />
            Linje for linje
          </button>
          <button
            type="button"
            onClick={() => setMode("fullscreen")}
            className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
              mode === "fullscreen"
                ? "border-primary bg-primary text-white"
                : "border-ink/10 text-ink hover:bg-ink/5"
            }`}
          >
            <Maximize size={18} aria-hidden="true" />
            Fullskjerm
          </button>
        </div>
      </div>

      {mode === "lines" ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-8 text-center">
          <p className="text-balance font-body text-4xl leading-relaxed text-ink">
            <Segments segments={renderSegments(lines[lineIndex] ?? "", answers)} />
          </p>
          <button
            type="button"
            onClick={() =>
              isLastLine ? undefined : setLineIndex((i) => i + 1)
            }
            disabled={isLastLine}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Neste linje
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto rounded-xl2 border-2 border-ink/10 bg-surface p-8">
          <p className="whitespace-pre-line font-body text-2xl leading-relaxed text-ink">
            <Segments segments={renderSegments(story.text, answers)} />
          </p>
        </div>
      )}
    </div>
  );
}

export default RevealView;
```

**Step 2: Commit**

```bash
git add src/modules/adjektivfortelling/RevealView.jsx
git commit -m "feat: add line-by-line and full-screen story reveal views"
```

---

### Task 7: `AdjektivfortellingArena.jsx` (view-state machine)

**Files:**
- Create: `src/modules/adjektivfortelling/AdjektivfortellingArena.jsx`

**Step 1: Write the component**

```jsx
import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import StoryList from "./StoryList";
import StoryEditor from "./StoryEditor";
import CollectView from "./CollectView";
import RevealView from "./RevealView";

function AdjektivfortellingArena() {
  const [view, setView] = useState({ mode: "list" });
  const stories = useAppStore((s) => s.adjectiveStories);

  if (view.mode === "editor") {
    return (
      <StoryEditor
        storyId={view.storyId}
        onBack={() => setView({ mode: "list" })}
        onCollect={() => setView({ mode: "collect", storyId: view.storyId })}
      />
    );
  }

  if (view.mode === "collect") {
    const story = stories[view.storyId];
    if (!story) return null;
    return (
      <CollectView
        story={story}
        onBack={() => setView({ mode: "editor", storyId: view.storyId })}
        onComplete={(answers) =>
          setView({ mode: "reveal", storyId: view.storyId, answers })
        }
      />
    );
  }

  if (view.mode === "reveal") {
    const story = stories[view.storyId];
    if (!story) return null;
    return (
      <RevealView
        story={story}
        answers={view.answers}
        onBack={() => setView({ mode: "editor", storyId: view.storyId })}
      />
    );
  }

  return (
    <StoryList onOpen={(storyId) => setView({ mode: "editor", storyId })} />
  );
}

export default AdjektivfortellingArena;
```

**Step 2: Commit**

```bash
git add src/modules/adjektivfortelling/AdjektivfortellingArena.jsx
git commit -m "feat: add adjective story view-state machine"
```

---

### Task 8: Register the module (Dashboard + App routing)

**Files:**
- Modify: `src/modules/Dashboard.jsx`
- Modify: `src/App.jsx`

**Step 1: Add the dashboard card**

In `src/modules/Dashboard.jsx`, add `Feather` to the `lucide-react` import list, and add a new entry to `MODULES` (after the `hangman` entry):

```js
  {
    id: "adjektivfortelling",
    icon: Feather,
    title: "Adjektivfortelling",
    description: "Fyll inn adjektiv, substantiv og verb — les historien sammen etterpå.",
    accent: "peach",
  },
```

**Step 2: Register the route**

In `src/App.jsx`, add the import:

```js
import AdjektivfortellingArena from "./modules/adjektivfortelling/AdjektivfortellingArena";
```

And add to `MODULE_COMPONENTS`:

```js
  adjektivfortelling: AdjektivfortellingArena,
```

**Step 3: Verify**

Run `npm run dev`, open the app, confirm the "Adjektivfortelling" card appears on the dashboard, clicking it opens the story list, "Ny historie" opens the editor, inserting placeholders and clicking "Start innsamling" walks through each slot in order, and completing collection shows the reveal view with both line-by-line and full-screen modes working and highlighting inserted words.

**Step 4: Commit**

```bash
git add src/modules/Dashboard.jsx src/App.jsx
git commit -m "feat: register Adjektivfortelling module in dashboard and routing"
```
