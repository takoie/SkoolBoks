export const NORWEGIAN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ".split("");

export function pickLetter(usedLetters) {
  const pool = NORWEGIAN_ALPHABET.filter((l) => !usedLetters.includes(l));
  const candidates = pool.length > 0 ? pool : NORWEGIAN_ALPHABET;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function pickRerollLetter(usedLetters, excludeLetter) {
  const pool = NORWEGIAN_ALPHABET.filter(
    (l) => !usedLetters.includes(l) && l !== excludeLetter
  );
  const candidates =
    pool.length > 0
      ? pool
      : NORWEGIAN_ALPHABET.filter((l) => l !== excludeLetter);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// The group whose turn it is to state their answer for the category
// currently being reviewed: the first group in turn order with no mark yet.
export function getCurrentReviewGroupId(stiansGame) {
  const { review, categories } = stiansGame;
  if (!review) return null;
  const category = categories[review.categoryIndex];
  return (
    review.groupOrder.find(
      (groupId) => review.marks[groupId]?.[category] === undefined
    ) ?? null
  );
}

// Folds the finished review's marks into cumulative scores, applying
// pointsPerRound per approved category and the bonus (if enabled) to the
// lead group. Returns a new stiansGame object with phase reset to "idle".
export function commitRound(stiansGame) {
  const scores = {};
  stiansGame.groups.forEach((group) => {
    const prev = stiansGame.scores[group.id] ?? { byCategory: {}, bonus: 0 };
    const byCategory = { ...prev.byCategory };
    stiansGame.categories.forEach((category) => {
      const approved =
        stiansGame.review.marks[group.id]?.[category] === true;
      const current = byCategory[category] ?? 0;
      byCategory[category] = approved
        ? current + stiansGame.pointsPerRound
        : current;
    });
    let bonus = prev.bonus;
    if (stiansGame.bonusEnabled && stiansGame.leadGroupId === group.id) {
      bonus += stiansGame.bonusPoints;
    }
    scores[group.id] = { byCategory, bonus };
  });
  return {
    ...stiansGame,
    scores,
    review: null,
    leadGroupId: null,
    // Force a fresh draw next round — otherwise "Start skriving" stays
    // enabled on the previous round's letter with no signal it's stale.
    currentLetter: null,
    phase: "idle",
  };
}

export function getGroupTotal(scores, groupId) {
  const entry = scores[groupId];
  if (!entry) return 0;
  const categoryTotal = Object.values(entry.byCategory).reduce(
    (sum, n) => sum + n,
    0
  );
  return categoryTotal + entry.bonus;
}

export function getWinner(groups, scores) {
  if (groups.length === 0) return null;
  return groups.reduce((best, group) => {
    const total = getGroupTotal(scores, group.id);
    const bestTotal = best ? getGroupTotal(scores, best.id) : -Infinity;
    return total > bestTotal ? group : best;
  }, null);
}
