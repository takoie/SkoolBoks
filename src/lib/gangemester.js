export const TIMER_OPTIONS = [3, 5, 10];

export const TABLE_PRESETS = {
  small: { label: "Den lille gangetabellen (1–10)", tables: range(1, 10) },
  large: { label: "Den store gangetabellen (1–20)", tables: range(1, 20) },
};

export const CUSTOM_TABLE_OPTIONS = range(1, 20);

export const STREAK_MILESTONES = [5, 10, 20];

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// Picks a random multiplication table from the selected set, then a random
// second factor 1–10 (the "gangetabell" convention — a table drill always
// multiplies by 1 through 10, even for the large/custom table selections).
export function generateQuestion(tables, previous = null) {
  const pool = tables.length > 0 ? tables : TABLE_PRESETS.small.tables;
  let a;
  let b;
  do {
    a = pool[Math.floor(Math.random() * pool.length)];
    b = 1 + Math.floor(Math.random() * 10);
  } while (previous && a === previous.a && b === previous.b && pool.length * 10 > 1);
  return { a, b, answer: a * b };
}

export function milestoneMessage(streak) {
  if (streak === 5) return "Fem på rad! 🔥";
  if (streak === 10) return "Ti på rad! Du er i gang! ⚡";
  if (streak === 20) return "Tjue på rad! Gangemester! 👑";
  return null;
}
