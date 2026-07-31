const SECTOR_HUE_STEP = 47; // coprime-ish step so adjacent sectors don't repeat hues for small counts

export function sectorColor(index) {
  const hue = (index * SECTOR_HUE_STEP) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export function pickWinnerIndex(sectorCount) {
  if (sectorCount <= 0) return -1;
  return Math.floor(Math.random() * sectorCount);
}

// Returns the absolute rotation (in degrees) the wheel should animate to so
// that sector `winnerIndex` (of `sectorCount`, each an equal slice starting
// at 0deg = 12 o'clock, going clockwise) ends up under the fixed pointer at
// the top. `currentRotation` is the wheel's current absolute rotation, and
// `extraSpins` full turns are added on top so the animation always spins
// forward regardless of the current angle.
export function computeSpinRotation(currentRotation, winnerIndex, sectorCount, extraSpins = 6) {
  const sliceDeg = 360 / sectorCount;
  const sliceCenter = winnerIndex * sliceDeg + sliceDeg / 2;
  // The pointer is fixed at 0deg (top); rotating the wheel by `r` moves the
  // point that was at angle `a` to `a + r`. We want sliceCenter + r ≡ 0 (mod 360).
  const targetMod = ((-sliceCenter % 360) + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta <= 0) delta += 360;
  return currentRotation + delta + extraSpins * 360;
}
