function combinations(items, k) {
  const results = [];
  function helper(start, combo) {
    if (combo.length === k) {
      results.push(combo);
      return;
    }
    for (let i = start; i < items.length; i++) {
      helper(i + 1, [...combo, items[i]]);
    }
  }
  helper(0, []);
  return results;
}

export function findClosestArrangement(digits) {
  if (digits.length !== 9) {
    throw new Error("findClosestArrangement requires exactly 9 digits");
  }

  const indices = digits.map((_, i) => i);
  let best = null;

  for (const hIdx of combinations(indices, 3)) {
    const remaining = indices.filter((i) => !hIdx.includes(i));
    for (const tIdx of combinations(remaining, 3)) {
      const uIdx = remaining.filter((i) => !tIdx.includes(i));
      const hSum = hIdx.reduce((a, i) => a + digits[i], 0);
      const tSum = tIdx.reduce((a, i) => a + digits[i], 0);
      const uSum = uIdx.reduce((a, i) => a + digits[i], 0);
      const total = hSum * 100 + tSum * 10 + uSum;
      const diff = Math.abs(total - 1000);
      if (!best || diff < best.diff) {
        best = {
          diff,
          total,
          hundreds: hIdx.map((i) => digits[i]),
          tens: tIdx.map((i) => digits[i]),
          units: uIdx.map((i) => digits[i]),
        };
      }
    }
  }

  const rows = [0, 1, 2].map((r) => [
    best.hundreds[r],
    best.tens[r],
    best.units[r],
  ]);

  return { rows, total: best.total, difference: best.total - 1000 };
}
