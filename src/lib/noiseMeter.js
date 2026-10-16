export const ROUND_SECONDS = 6;

export const COUNTDOWN_STEPS = [
  { label: "Gjør dere klare...", durationMs: 1500 },
  { label: "3", durationMs: 700 },
  { label: "2", durationMs: 700 },
  { label: "1", durationMs: 700 },
  { label: "BRÅK!", durationMs: 600 },
];

// Browser mics have no calibrated reference level, but we map relative loudness (dBFS)
// to realistic classroom dBA values (~30 dBA to ~105 dBA).
const MIN_DBFS = -55;

export function levelFromTimeDomainData(dataArray) {
  let sumSquares = 0;
  for (let i = 0; i < dataArray.length; i += 1) {
    const centered = (dataArray[i] - 128) / 128;
    sumSquares += centered * centered;
  }
  const rms = Math.sqrt(sumSquares / dataArray.length);
  if (rms <= 0) return { score: 0, db: 30, dbFS: MIN_DBFS, label: "Stille" };

  const dbFS = 20 * Math.log10(rms);
  const clampedDbFS = Math.max(MIN_DBFS, Math.min(0, dbFS));

  // Percentage (0 - 100)
  const score = Math.round(((clampedDbFS - MIN_DBFS) / -MIN_DBFS) * 100);

  // Map to estimated classroom dB SPL / dBA (30 dB = silence, 105 dB = max scream)
  const db = Math.round(30 + ((clampedDbFS - MIN_DBFS) / -MIN_DBFS) * 75);

  let label = "Stille 🤫";
  if (db >= 90) label = "Ekstremt bråk! 📢🚀";
  else if (db >= 80) label = "Jubel og rop! 🎉";
  else if (db >= 70) label = "Høy støy! 😃";
  else if (db >= 55) label = "Tale og prating 🗣️";
  else if (db >= 40) label = "Svak susing 💬";

  return { score, db, dbFS: clampedDbFS, label };
}

// Ranks teams by average score descending; teams without a recorded score sort last.
// Ties share the same rank (standard competition ranking).
export function rankTeams(teams, scores) {
  const getAvgDb = (id) => {
    const scoreVal = scores[id];
    if (scoreVal === undefined || scoreVal === null) return -1;
    return typeof scoreVal === "number" ? scoreVal : (scoreVal.avgDb ?? -1);
  };

  const sorted = [...teams].sort((a, b) => getAvgDb(b.id) - getAvgDb(a.id));
  let rank = 0;
  let prevScore = null;
  return sorted.map((team, i) => {
    const scoreData = scores[team.id];
    let avgDb = 0;
    let peakDb = 0;

    if (typeof scoreData === "number") {
      avgDb = scoreData;
      peakDb = scoreData;
    } else if (scoreData && typeof scoreData === "object") {
      avgDb = scoreData.avgDb ?? 0;
      peakDb = scoreData.peakDb ?? 0;
    }

    if (prevScore === null || avgDb !== prevScore) {
      rank = i + 1;
      prevScore = avgDb;
    }
    return { ...team, avgDb, peakDb, rank, score: avgDb };
  });
}

