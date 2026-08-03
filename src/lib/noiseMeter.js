export const ROUND_SECONDS = 5;

export const COUNTDOWN_STEPS = [
  { label: "Gjør dere klare...", durationMs: 1500 },
  { label: "3", durationMs: 700 },
  { label: "2", durationMs: 700 },
  { label: "1", durationMs: 700 },
  { label: "BRÅK!", durationMs: 600 },
];

// Browser mics have no calibrated reference level, so this is a relative
// loudness score (0-100), not a real dB SPL measurement. -55dB (near-silence
// on a typical laptop mic) maps to 0, 0dB (full-scale clipping) maps to 100.
const MIN_DB = -55;

export function levelFromTimeDomainData(dataArray) {
  let sumSquares = 0;
  for (let i = 0; i < dataArray.length; i += 1) {
    const centered = (dataArray[i] - 128) / 128;
    sumSquares += centered * centered;
  }
  const rms = Math.sqrt(sumSquares / dataArray.length);
  if (rms <= 0) return 0;
  const db = 20 * Math.log10(rms);
  const clamped = Math.max(MIN_DB, Math.min(0, db));
  return Math.round(((clamped - MIN_DB) / -MIN_DB) * 100);
}

// Ranks teams by score descending; teams without a recorded score sort last.
// Ties share the same rank (standard competition ranking).
export function rankTeams(teams, scores) {
  const sorted = [...teams].sort((a, b) => (scores[b.id] ?? -1) - (scores[a.id] ?? -1));
  let rank = 0;
  let prevScore = null;
  return sorted.map((team, i) => {
    const score = scores[team.id] ?? 0;
    if (prevScore === null || score !== prevScore) {
      rank = i + 1;
      prevScore = score;
    }
    return { ...team, score, rank };
  });
}
