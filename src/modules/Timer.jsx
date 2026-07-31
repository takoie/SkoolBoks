import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playSound } from "../lib/sound";

const PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function Timer() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const [duration, setDuration] = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customSeconds, setCustomSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          playSound("ding", soundEnabled);
          return 0;
        }
        if (prev <= 4) playSound("tick", soundEnabled);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, soundEnabled]);

  function selectPreset(seconds) {
    setRunning(false);
    setDuration(seconds);
    setRemaining(seconds);
    setCustomMinutes(Math.floor(seconds / 60));
    setCustomSeconds(seconds % 60);
  }

  function applyCustomDuration(minutes, seconds) {
    const clampedMinutes = Math.max(0, Math.min(60, Number(minutes) || 0));
    const clampedSeconds = Math.max(0, Math.min(59, Number(seconds) || 0));
    const total = clampedMinutes * 60 + clampedSeconds;
    setRunning(false);
    setDuration(total);
    setRemaining(total);
    return { clampedMinutes, clampedSeconds };
  }

  function handleCustomMinutes(e) {
    const { clampedMinutes } = applyCustomDuration(e.target.value, customSeconds);
    setCustomMinutes(clampedMinutes);
  }

  function handleCustomSeconds(e) {
    const { clampedSeconds } = applyCustomDuration(customMinutes, e.target.value);
    setCustomSeconds(clampedSeconds);
  }

  function reset() {
    setRunning(false);
    setRemaining(duration);
  }

  const isLastTenSeconds = remaining > 0 && remaining <= 10;

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
      <h2 className="mb-8 font-heading text-3xl font-semibold text-ink">
        Nedtelling
      </h2>

      <div
        className={`mb-8 flex min-h-[220px] w-full items-center justify-center rounded-xl2 border-2 bg-surface shadow-clay transition-colors duration-300 ${
          isLastTenSeconds
            ? "border-accent-coral animate-urgent"
            : "border-ink/10"
        }`}
      >
        <span
          key={remaining}
          className={`font-heading text-8xl font-bold text-primary ${
            isLastTenSeconds ? "animate-pop-in" : ""
          }`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatTime(remaining)}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        {PRESETS.map((p) => (
          <button
            key={p.seconds}
            type="button"
            onClick={() => selectPreset(p.seconds)}
            className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 bg-surface px-5 py-2 font-heading font-semibold text-ink transition-colors hover:bg-primary/10"
          >
            {p.label}
          </button>
        ))}
        <label className="flex items-center gap-2 font-body text-lg text-ink">
          Egendefinert:
          <input
            type="number"
            min={0}
            max={60}
            value={customMinutes}
            onChange={handleCustomMinutes}
            className="min-h-touch w-20 rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2 text-center font-body text-lg text-ink"
          />
          min
          <input
            type="number"
            min={0}
            max={59}
            value={customSeconds}
            onChange={handleCustomSeconds}
            className="min-h-touch w-20 rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2 text-center font-body text-lg text-ink"
          />
          sek
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          disabled={remaining === 0}
          className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          {running ? (
            <Pause size={24} aria-hidden="true" />
          ) : (
            <Play size={24} aria-hidden="true" />
          )}
          {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <RotateCcw size={22} aria-hidden="true" />
          Nullstill
        </button>
      </div>
    </div>
  );
}

export default Timer;
