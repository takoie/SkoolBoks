const SECTOR_HUE_STEP = 47; // coprime-ish step so adjacent sectors don't repeat hues for small counts

export function sectorColor(index) {
  const hue = (index * SECTOR_HUE_STEP) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export function pickWinnerIndex(sectorCount) {
  if (sectorCount <= 0) return -1;
  return Math.floor(Math.random() * sectorCount);
}

// How far off-center (as a fraction of the half-slice) the landing point is
// allowed to drift. Kept below 1 so the wheel never lands close enough to a
// sector boundary to look ambiguous under the pointer.
const LANDING_MARGIN_RATIO = 0.7;

// A random offset (in degrees) from a sector's center, used so the wheel
// doesn't land dead-center on every spin — like a real casino wheel, the
// winning sector's ball position varies each time.
export function randomLandingOffset(sectorCount) {
  const sliceDeg = 360 / sectorCount;
  const maxOffset = (sliceDeg / 2) * LANDING_MARGIN_RATIO;
  return (Math.random() * 2 - 1) * maxOffset;
}

// Returns the absolute rotation (in degrees) the wheel should animate to so
// that sector `winnerIndex` (of `sectorCount`, each an equal slice starting
// at 0deg = 12 o'clock, going clockwise) ends up under the fixed pointer at
// the top. `currentRotation` is the wheel's current absolute rotation, and
// `extraSpins` full turns are added on top so the animation always spins
// forward regardless of the current angle. `landingOffsetDeg` shifts the
// landing point away from the exact sector center (see randomLandingOffset).
export function computeSpinRotation(
  currentRotation,
  winnerIndex,
  sectorCount,
  extraSpins = 6,
  landingOffsetDeg = 0
) {
  const sliceDeg = 360 / sectorCount;
  const sliceCenter = winnerIndex * sliceDeg + sliceDeg / 2 + landingOffsetDeg;
  // The pointer is fixed at 0deg (top); rotating the wheel by `r` moves the
  // point that was at angle `a` to `a + r`. We want sliceCenter + r ≡ 0 (mod 360).
  const targetMod = ((-sliceCenter % 360) + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta <= 0) delta += 360;
  return currentRotation + delta + extraSpins * 360;
}
