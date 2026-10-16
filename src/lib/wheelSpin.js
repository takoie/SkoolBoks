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

/**
 * Serializes a wheel object into an exportable string.
 * Supports "token" (default, compact Base64 with SKOOLBOKS_WHEEL: prefix),
 * "json" (formatted JSON), and "text" (plain line-separated sector list).
 */
export function exportWheelToString(wheel, format = "token") {
  if (!wheel) return "";
  const sectors = (wheel.sectors || [])
    .map((s) => (typeof s === "string" ? s : s.label))
    .filter((l) => typeof l === "string" && l.trim().length > 0);

  if (format === "text") {
    return sectors.join("\n");
  }

  const data = {
    type: "skoolboks_wheel",
    v: 1,
    name: wheel.name || "Hjul",
    sectors,
    removeAfterSpin: Boolean(wheel.removeAfterSpin),
  };

  const jsonStr = JSON.stringify(data);

  if (format === "json") {
    return JSON.stringify(data, null, 2);
  }

  // Token format (default): Base64 encoded UTF-8 string with SKOOLBOKS_WHEEL: prefix
  try {
    const utf8Bytes = encodeURIComponent(jsonStr);
    const base64 = btoa(utf8Bytes);
    return `SKOOLBOKS_WHEEL:${base64}`;
  } catch (e) {
    return jsonStr;
  }
}

/**
 * Parses an exported string (Token, JSON, or multiline text) into a wheel structure.
 * Returns { name, sectors, removeAfterSpin } or null if invalid.
 */
export function parseWheelString(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Check for SKOOLBOKS_WHEEL: or legacy SKOOLBOX_WHEEL: prefix
  if (trimmed.startsWith("SKOOLBOKS_WHEEL:") || trimmed.startsWith("SKOOLBOX_WHEEL:")) {
    const prefix = trimmed.startsWith("SKOOLBOKS_WHEEL:") ? "SKOOLBOKS_WHEEL:" : "SKOOLBOX_WHEEL:";
    const content = trimmed.slice(prefix.length).trim();
    // Try Base64 decoding first
    try {
      const jsonStr = decodeURIComponent(atob(content));
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.sectors)) {
        const sectors = parsed.sectors
          .map((s) => (typeof s === "string" ? s : s?.label))
          .filter((l) => typeof l === "string" && l.trim().length > 0);
        return {
          name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : "Importert hjul",
          sectors,
          removeAfterSpin: Boolean(parsed.removeAfterSpin),
        };
      }
    } catch (e) {
      // Fall through to try raw JSON
    }

    try {
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.sectors)) {
        const sectors = parsed.sectors
          .map((s) => (typeof s === "string" ? s : s?.label))
          .filter((l) => typeof l === "string" && l.trim().length > 0);
        return {
          name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : "Importert hjul",
          sectors,
          removeAfterSpin: Boolean(parsed.removeAfterSpin),
        };
      }
    } catch (e) {
      // Fall through
    }
  }

  // 2. Try raw JSON
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        let sectors = [];
        if (Array.isArray(parsed.sectors)) {
          sectors = parsed.sectors
            .map((s) => (typeof s === "string" ? s : s?.label))
            .filter((l) => typeof l === "string" && l.trim().length > 0);
        }
        if (sectors.length > 0) {
          return {
            name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : "Importert hjul",
            sectors,
            removeAfterSpin: Boolean(parsed.removeAfterSpin),
          };
        }
      }
    } catch (e) {
      // Fall through to text list
    }
  }

  // 3. Fallback to line-separated text
  const lines = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > 0) {
    return {
      name: "Importert hjul",
      sectors: lines,
      removeAfterSpin: false,
    };
  }

  return null;
}

