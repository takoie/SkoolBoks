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
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
