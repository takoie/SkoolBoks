import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, PanelRightClose, PanelRightOpen, RotateCcw, Undo2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { playSound } from "../../lib/sound";
import { fireConfetti } from "../../lib/confetti";
import { pickWinnerIndex, computeSpinRotation, randomLandingOffset, sectorColor } from "../../lib/wheelSpin";
import SectorEditor from "./SectorEditor";

const WHEEL_SIZE = 360;
const RADIUS = WHEEL_SIZE / 2;
const EMPTY_REMOVED_IDS = [];

function polarPoint(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [RADIUS + radius * Math.cos(rad), RADIUS + radius * Math.sin(rad)];
}

function sectorPath(index, total) {
  const sliceDeg = 360 / total;
  const start = index * sliceDeg;
  const end = start + sliceDeg;
  const [x1, y1] = polarPoint(start, RADIUS);
  const [x2, y2] = polarPoint(end, RADIUS);
  const largeArc = sliceDeg > 180 ? 1 : 0;
  return `M ${RADIUS} ${RADIUS} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

// Labels run from near the hub out toward the rim so long text fills the
// sector radially instead of sitting small and centered.
const LABEL_START_RADIUS = RADIUS * 0.2;
const LABEL_END_RADIUS = RADIUS * 0.92;
const LABEL_MAX_CHARS = 26;
const LABEL_MAX_FONT_SIZE = 20;
const LABEL_MIN_FONT_SIZE = 9;
const AVG_CHAR_WIDTH_EM = 0.58; // approximation for our bold heading font

function truncateLabel(label) {
  return label.length > LABEL_MAX_CHARS
    ? `${label.slice(0, LABEL_MAX_CHARS - 1)}…`
    : label;
}

function sectorLabelFontSize(label) {
  const availableLength = LABEL_END_RADIUS - LABEL_START_RADIUS;
  const widthAtMaxFont = label.length * AVG_CHAR_WIDTH_EM * LABEL_MAX_FONT_SIZE;
  if (widthAtMaxFont <= availableLength) return LABEL_MAX_FONT_SIZE;
  const scaled = availableLength / (label.length * AVG_CHAR_WIDTH_EM);
  return Math.max(LABEL_MIN_FONT_SIZE, Math.min(LABEL_MAX_FONT_SIZE, scaled));
}

function sectorLabelTransform(index, total) {
  const sliceDeg = 360 / total;
  const centerAngle = index * sliceDeg + sliceDeg / 2; // 0 = top, clockwise
  return `rotate(${centerAngle - 90} ${RADIUS} ${RADIUS})`;
}

// A steep early deceleration with a long, slow-crawling tail — the last
// stretch before landing drags out noticeably, which is what makes the
// finish feel suspenseful instead of just linearly slowing down.
function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

function WheelSpinner({ wheelId, onBack }) {
  const wheel = useAppStore((s) => s.wheels[wheelId]);
  const removedIds = useAppStore(
    (s) => s.removedSectors[wheelId] ?? EMPTY_REMOVED_IDS
  );
  const setWheelSectors = useAppStore((s) => s.setWheelSectors);
  const setWheelRemoveAfterSpin = useAppStore((s) => s.setWheelRemoveAfterSpin);
  const markSectorRemoved = useAppStore((s) => s.markSectorRemoved);
  const undoLastSectorRemoval = useAppStore((s) => s.undoLastSectorRemoval);
  const resetRemovedSectors = useAppStore((s) => s.resetRemovedSectors);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const rafRef = useRef(null);
  const idleStartRef = useRef(Date.now());
  const [hasSpunOnce, setHasSpunOnce] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [respinTrigger, setRespinTrigger] = useState(0);

  const activeSectors = useMemo(
    () =>
      wheel.sectors.filter(
        (s) => !removedIds.includes(s.id) && s.label.trim() !== ""
      ),
    [wheel.sectors, removedIds]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Fires after a respin request from the winner popup, once the store's
  // removal (if any) has been committed and `activeSectors` reflects it.
  useEffect(() => {
    if (respinTrigger === 0) return;
    spin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respinTrigger]);

  function spin() {
    if (spinning || activeSectors.length < 2) return;
    setSpinning(true);
    setWinner(null);
    setHasSpunOnce(true);

    const sliceDeg = 360 / activeSectors.length;
    const startRotation = hasSpunOnce
      ? rotation
      : ((Date.now() - idleStartRef.current) / 24000) * 360;
    const winnerIndex = pickWinnerIndex(activeSectors.length);
    const landingOffset = randomLandingOffset(activeSectors.length);
    const targetRotation = computeSpinRotation(
      startRotation,
      winnerIndex,
      activeSectors.length,
      6,
      landingOffset
    );
    const deltaDeg = targetRotation - startRotation;
    const duration = 5500;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    function finish() {
      const picked = activeSectors[winnerIndex];
      setRotation(targetRotation);
      setWinner(picked);
      setSpinning(false);
      if (wheel.removeAfterSpin) markSectorRemoved(wheelId, picked.id);
      setShowWinnerModal(true);
      playSound("tada", soundEnabled);
      fireConfetti();
    }

    if (prefersReduced) {
      finish();
      return;
    }

    let lastTickSlice = Math.floor(startRotation / sliceDeg);
    let start = null;

    function frame(timestamp) {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const t = Math.min(elapsed / duration, 1);
      const current = startRotation + deltaDeg * easeOutQuint(t);
      setRotation(current);

      const currentSlice = Math.floor(current / sliceDeg);
      if (currentSlice > lastTickSlice) {
        lastTickSlice = currentSlice;
        playSound("tick", soundEnabled);
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        finish();
      }
    }

    rafRef.current = requestAnimationFrame(frame);
  }

  function handleUndo() {
    if (removedIds.length === 0) return;
    undoLastSectorRemoval(wheelId);
    setWinner(null);
  }

  function handleReset() {
    resetRemovedSectors(wheelId);
    setWinner(null);
  }

  function handleRespin(shouldRemoveWinner) {
    setShowWinnerModal(false);
    if (shouldRemoveWinner && winner && !removedIds.includes(winner.id)) {
      markSectorRemoved(wheelId, winner.id);
    }
    setRespinTrigger((n) => n + 1);
  }

  return (
    <div
      className={`mx-auto flex w-full flex-col gap-8 lg:flex-row lg:items-start ${
        showEditor ? "max-w-7xl" : "max-w-[1600px]"
      }`}
    >
      <div className="flex flex-1 flex-col items-center text-center">
        <div className="mb-4 flex w-full items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Tilbake til hjul-listen"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <h2 className="font-heading text-3xl font-semibold text-ink">{wheel.name}</h2>
          <button
            type="button"
            onClick={() => setShowEditor((v) => !v)}
            aria-label={showEditor ? "Skjul sektor-listen" : "Vis sektor-listen"}
            className="ml-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
          >
            {showEditor ? (
              <PanelRightClose size={22} aria-hidden="true" />
            ) : (
              <PanelRightOpen size={22} aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center">
          {showEditor && (
            <div className="order-2 flex flex-col items-center gap-6 text-center lg:order-1 lg:items-start lg:text-left">
              <div className="flex min-h-[64px] items-center justify-center lg:justify-start">
                <span className="font-heading text-2xl font-bold text-primary">
                  {activeSectors.length < 2
                    ? "Legg til minst to sektorer med tekst for å spinne"
                    : winner
                      ? winner.label
                      : spinning
                        ? "Snurrer…"
                        : "Klar for å spinne?"}
                </span>
              </div>

              <div className="flex flex-col items-center gap-4 lg:items-start">
                <button
                  type="button"
                  onClick={spin}
                  disabled={spinning || activeSectors.length < 2}
                  className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                  {spinning ? "Spinner…" : "Spinn hjulet"}
                </button>
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={spinning || removedIds.length === 0}
                  className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-all duration-150 hover:bg-ink/5 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                  <Undo2 size={22} aria-hidden="true" />
                  Angre
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-all duration-150 hover:bg-ink/5 active:scale-[0.97]"
                >
                  <RotateCcw size={22} aria-hidden="true" />
                  Nullstill
                </button>
              </div>

              <label className="flex cursor-pointer items-center gap-3 font-body text-lg text-ink">
                <input
                  type="checkbox"
                  checked={wheel.removeAfterSpin}
                  onChange={(e) => setWheelRemoveAfterSpin(wheelId, e.target.checked)}
                  className="h-6 w-6 cursor-pointer accent-primary"
                />
                Fjern vinner etter spinn
              </label>
            </div>
          )}

          <div
            className="relative order-1 shrink-0 lg:order-2"
            style={{
              width: showEditor
                ? "clamp(300px, min(48vw, 58vh), 460px)"
                : "clamp(320px, min(66vw, 66vh), 620px)",
              aspectRatio: "1 / 1",
            }}
          >
            <div
              className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderTop: "22px solid var(--color-ink)",
              }}
              aria-hidden="true"
            />
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
              className={!hasSpunOnce && !spinning ? "animate-idle-spin" : ""}
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
            >
              {activeSectors.map((sector, i) => (
                <path key={sector.id} d={sectorPath(i, activeSectors.length)} fill={sectorColor(i)} stroke="var(--color-surface)" strokeWidth={2} />
              ))}
              {activeSectors.map((sector, i) => {
                const label = truncateLabel(sector.label);
                return (
                  <text
                    key={`${sector.id}-label`}
                    transform={sectorLabelTransform(i, activeSectors.length)}
                    x={RADIUS + LABEL_END_RADIUS}
                    y={RADIUS}
                    dy="0.35em"
                    textAnchor="end"
                    fontSize={sectorLabelFontSize(label)}
                    fill="var(--color-accent-ink)"
                    className="pointer-events-none select-none font-heading font-semibold"
                  >
                    {label}
                  </text>
                );
              })}
            </svg>
            {!showEditor && (
              <button
                type="button"
                onClick={spin}
                disabled={spinning || activeSectors.length < 2}
                aria-label="Spinn hjulet"
                className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-primary font-heading text-xl font-bold text-white shadow-clay transition-all duration-150 hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                style={{ width: "28%", height: "28%" }}
              >
                {spinning ? "Spinner…" : "Spinn"}
              </button>
            )}
          </div>
        </div>
      </div>

      {showEditor && (
        <aside className="w-full shrink-0 rounded-xl2 border-2 border-ink/10 bg-surface p-5 text-left shadow-clay lg:w-[26rem]">
          <h3 className="mb-4 font-heading text-xl font-semibold text-ink">Sektorer</h3>
          {spinning && (
            <p className="mb-3 text-sm text-ink/60">
              Sektorene kan ikke endres mens hjulet spinner.
            </p>
          )}
          <SectorEditor
            sectors={wheel.sectors}
            onChange={(sectors) => setWheelSectors(wheelId, sectors)}
            disabled={spinning}
          />
        </aside>
      )}

      {showWinnerModal &&
        winner &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
            onClick={() => setShowWinnerModal(false)}
          >
            <div
              className="w-full max-w-md rounded-xl2 bg-surface p-8 text-center shadow-clay animate-modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-8 break-words font-heading text-4xl font-bold text-primary">
                {winner.label}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handleRespin(false)}
                  className="flex min-h-touch cursor-pointer items-center justify-center gap-3 rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
                >
                  Spinn på nytt
                </button>
                <button
                  type="button"
                  onClick={() => handleRespin(true)}
                  className="flex min-h-touch cursor-pointer items-center justify-center gap-3 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-all duration-150 hover:bg-ink/5 active:scale-[0.97]"
                >
                  Fjern og spinn på nytt
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default WheelSpinner;
