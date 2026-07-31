import { useMemo, useState } from "react";
import { ArrowLeft, RotateCcw, Undo2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { playSound } from "../../lib/sound";
import { fireConfetti } from "../../lib/confetti";
import { pickWinnerIndex, computeSpinRotation, sectorColor } from "../../lib/wheelSpin";
import SectorEditor from "./SectorEditor";

const WHEEL_SIZE = 360;
const RADIUS = WHEEL_SIZE / 2;

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

function WheelSpinner({ wheelId, onBack }) {
  const wheel = useAppStore((s) => s.wheels[wheelId]);
  const removedIds = useAppStore((s) => s.removedSectors[wheelId] ?? []);
  const setWheelSectors = useAppStore((s) => s.setWheelSectors);
  const setWheelRemoveAfterSpin = useAppStore((s) => s.setWheelRemoveAfterSpin);
  const markSectorRemoved = useAppStore((s) => s.markSectorRemoved);
  const undoLastSectorRemoval = useAppStore((s) => s.undoLastSectorRemoval);
  const resetRemovedSectors = useAppStore((s) => s.resetRemovedSectors);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);

  const activeSectors = useMemo(
    () => wheel.sectors.filter((s) => !removedIds.includes(s.id)),
    [wheel.sectors, removedIds]
  );

  function spin() {
    if (spinning || activeSectors.length < 2) return;
    setSpinning(true);
    setWinner(null);
    const winnerIndex = pickWinnerIndex(activeSectors.length);
    const nextRotation = computeSpinRotation(rotation, winnerIndex, activeSectors.length);
    setRotation(nextRotation);
    playSound("tick", soundEnabled);
    window.setTimeout(() => {
      const picked = activeSectors[winnerIndex];
      setWinner(picked);
      setSpinning(false);
      if (wheel.removeAfterSpin) markSectorRemoved(wheelId, picked.id);
      playSound("tada", soundEnabled);
      fireConfetti();
    }, 4000);
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 lg:flex-row lg:items-start">
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
        </div>

        <div className="relative mb-8" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
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
            width={WHEEL_SIZE}
            height={WHEEL_SIZE}
            viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.16, 0.99)" : "none",
            }}
          >
            {activeSectors.map((sector, i) => (
              <path key={sector.id} d={sectorPath(i, activeSectors.length)} fill={sectorColor(i)} stroke="var(--color-surface)" strokeWidth={2} />
            ))}
          </svg>
        </div>

        <div className="mb-6 flex min-h-[64px] items-center justify-center">
          <span className="font-heading text-2xl font-bold text-primary">
            {winner ? winner.label : spinning ? "Snurrer…" : "Klar for å spinne?"}
          </span>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
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

      <aside className="w-full shrink-0 rounded-xl2 border-2 border-ink/10 bg-surface p-5 text-left shadow-clay lg:w-[26rem]">
        <h3 className="mb-4 font-heading text-xl font-semibold text-ink">Sektorer</h3>
        <SectorEditor sectors={wheel.sectors} onChange={(sectors) => setWheelSectors(wheelId, sectors)} />
      </aside>
    </div>
  );
}

export default WheelSpinner;
