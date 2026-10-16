import { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../store/useAppStore";
import { playSound } from "../../lib/sound";

export default function StiansWriting() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const currentLetter = useAppStore((s) => s.stiansGame.currentLetter);
  const categories = useAppStore((s) => s.stiansGame.categories);
  const groups = useAppStore((s) => s.stiansGame.groups);
  const timerSeconds = useAppStore((s) => s.stiansGame.timerSeconds);
  const roundMode = useAppStore((s) => s.stiansGame.roundMode);
  const stopStiansWriting = useAppStore((s) => s.stopStiansWriting);

  const isTimed = roundMode === "timed";

  const [remaining, setRemaining] = useState(timerSeconds);
  const [running, setRunning] = useState(isTimed);
  const intervalRef = useRef(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    setRemaining(timerSeconds);
    setRunning(isTimed);
    stoppedRef.current = false;
  }, [timerSeconds, isTimed]);

  useEffect(() => {
    if (!isTimed || !running) return undefined;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) return 0;
        if (prev <= 4) playSound("tick", soundEnabled);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isTimed, running, soundEnabled]);

  useEffect(() => {
    if (!isTimed || remaining > 0 || stoppedRef.current) return;
    setRunning(false);
    playSound("ding", soundEnabled);
    stoppedRef.current = true;
    stopStiansWriting(null);
  }, [isTimed, remaining, soundEnabled, stopStiansWriting]);

  function handleShout(groupId) {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    stopStiansWriting(groupId);
  }

  function handleManualStop() {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    stopStiansWriting(null);
  }

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="mx-auto max-w-4xl text-center">
      <div
        role="status"
        aria-live="polite"
        className="mb-6 flex min-h-[160px] w-full items-center justify-center rounded-xl2 border-2 border-ink/10 bg-surface shadow-clay"
      >
        <span className="font-heading text-7xl font-bold text-primary">
          {currentLetter}
        </span>
      </div>

      <p className="mb-2 font-body text-lg text-ink/70">
        Kategorier: {categories.join(", ")}
      </p>

      {isTimed && (
        <>
          <div
            className={`mb-6 font-heading text-5xl font-bold ${
              remaining > 0 && remaining <= 10
                ? "text-accent-coral-ink"
                : "text-ink"
            }`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {mm}:{ss}
          </div>

          <div className="mb-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              disabled={remaining === 0}
              className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
            >
              {running ? "Pause" : "Fortsett"}
            </button>
          </div>
        </>
      )}

      <p className="mb-3 font-heading text-lg font-semibold text-ink">
        Gruppa som er ferdig roper "Stians game!":
      </p>
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => handleShout(g.id)}
            className="min-h-touch cursor-pointer rounded-xl2 border-2 border-accent-coral/40 bg-accent-coral/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-accent-coral/20"
          >
            {g.name} ropte!
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleManualStop}
        className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
      >
        Stopp (uten lag)
      </button>
    </div>
  );
}
