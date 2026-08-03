export const WORD_TYPES = [
  { type: "adjektiv", label: "Adjektiv" },
  { type: "substantiv", label: "Substantiv" },
  { type: "verb", label: "Verb" },
  { type: "adverb", label: "Adverb" },
];

// Chip/highlight colors per word type, shared by the editor's marker chips
// and the reveal view's answer highlights so the same type always reads the
// same color everywhere.
export const TYPE_COLORS = {
  adjektiv: { bg: "bg-accent-coral/20", text: "text-accent-coral-ink", border: "border-accent-coral" },
  substantiv: { bg: "bg-accent-peach/20", text: "text-accent-peach-ink", border: "border-accent-peach" },
  verb: { bg: "bg-accent-lime/20", text: "text-accent-lime-ink", border: "border-accent-lime" },
  adverb: { bg: "bg-secondary/20", text: "text-secondary", border: "border-secondary" },
};

const LABEL_BY_TYPE = Object.fromEntries(WORD_TYPES.map((w) => [w.type, w.label]));
const TYPE_BY_LABEL = Object.fromEntries(WORD_TYPES.map((w) => [w.label, w.type]));

// Markers are stored as plain, human-readable text — e.g. "[Adjektiv 1]" —
// so the raw story text is legible on its own, without needing the color
// overlay to make sense of it.
const MARKER_RE = /\[(Adjektiv|Substantiv|Verb|Adverb) (\d+)\]/g;

// Returns slots in document order: [{ index, type, raw, start, end }].
// `index` is the 1-based, per-type number shown in the marker text (so the
// first and second adjectives are index 1 and 2, independent of any other
// word type's numbering).
export function parseSlots(text) {
  const slots = [];
  MARKER_RE.lastIndex = 0;
  let match;
  while ((match = MARKER_RE.exec(text)) !== null) {
    const type = TYPE_BY_LABEL[match[1]];
    if (!type) continue;
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

// Splices a `[Type n]` marker into `text` at `cursorPos`, picking the next
// free number for that word type so repeated types don't collide.
export function insertMarker(text, cursorPos, type) {
  const existing = parseSlots(text).filter((s) => s.type === type);
  const nextNumber =
    existing.length === 0 ? 1 : Math.max(...existing.map((s) => s.index)) + 1;
  const marker = `[${LABEL_BY_TYPE[type]} ${nextNumber}]`;
  const before = text.slice(0, cursorPos);
  const after = text.slice(cursorPos);
  return {
    text: before + marker + after,
    cursorPos: cursorPos + marker.length,
  };
}

// Splits `text` into segments for the editor's highlight overlay. Marker
// segments keep their exact raw text (just wrapped for coloring), so the
// overlay is always character-identical to the real textarea contents and
// the caret never drifts out of sync.
export function splitMarkerSegments(text) {
  const segments = [];
  let lastEnd = 0;
  for (const slot of parseSlots(text)) {
    if (slot.start > lastEnd) {
      segments.push({ text: text.slice(lastEnd, slot.start), type: null });
    }
    segments.push({ text: slot.raw, type: slot.type });
    lastEnd = slot.end;
  }
  if (lastEnd < text.length) {
    segments.push({ text: text.slice(lastEnd), type: null });
  }
  return segments;
}

// Answers are keyed by each slot's exact raw marker text (e.g.
// "[Adjektiv 1]"), which is unique per marker — unlike the per-type `index`,
// which repeats across word types (Adjektiv 1 and Substantiv 1 both have
// index 1) and would otherwise collide.
export function renderWithAnswers(text, answers) {
  return text.replace(MARKER_RE, (raw) => {
    const answer = answers[raw];
    return answer && answer.trim() ? answer.trim() : raw;
  });
}

// Like renderWithAnswers, but returns [{ text, isAnswer, type }] segments so
// the reveal view can highlight only the inserted words, colored by type.
export function renderSegments(text, answers) {
  const segments = [];
  let lastEnd = 0;
  for (const slot of parseSlots(text)) {
    if (slot.start > lastEnd) {
      segments.push({ text: text.slice(lastEnd, slot.start), isAnswer: false });
    }
    const answer = answers[slot.raw];
    segments.push({
      text: answer && answer.trim() ? answer.trim() : slot.raw,
      isAnswer: true,
      type: slot.type,
    });
    lastEnd = slot.end;
  }
  if (lastEnd < text.length) {
    segments.push({ text: text.slice(lastEnd), isAnswer: false });
  }
  return segments;
}

export function splitIntoLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
