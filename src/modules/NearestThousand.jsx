import { useState } from "react";
import { Hash, RotateCcw } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playSound } from "../lib/sound";
import { findClosestArrangement } from "../lib/nearestThousand";

const TOTAL_ROUNDS = 9;

function NearestThousand() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const [draws, setDraws] = useState([]);

  const done = draws.length === TOTAL_ROUNDS;
  const fasit = done ? findClosestArrangement(draws) : null;

  function drawNext() {
    if (done) return;
    const digit = Math.floor(Math.random() * 10);
    const next = [...draws, digit];
    setDraws(next);
    playSound(next.length === TOTAL_ROUNDS ? "tada" : "tick", soundEnabled);
  }

  function reset() {
    setDraws([]);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
      <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
        Nærmest tusen
      </h2>
      <p className="mb-8 text-lg text-ink/70">
        Kast {draws.length} av {TOTAL_ROUNDS} — bygg et 3×3-rutenett med tre
        tresifrede tall som kommer nærmest 1000.
      </p>

      <div className="mb-8 flex min-h-[120px] w-full flex-wrap items-center justify-center gap-3 rounded-xl2 border-2 border-ink/10 bg-surface px-8 py-8 shadow-clay">
        {draws.length === 0 ? (
          <span className="font-heading text-2xl text-ink/50">
            Klar for første kast?
          </span>
        ) : (
          draws.map((d, i) => (
            <span
              key={i}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 font-heading text-2xl font-bold text-primary"
            >
              {d}
            </span>
          ))
        )}
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={drawNext}
          disabled={done}
          className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Hash size={24} aria-hidden="true" />
          {done ? "Alle kast trukket" : "Neste kast"}
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

      {fasit && (
        <div className="w-full rounded-xl2 border-2 border-accent-lime/40 bg-accent-lime/10 p-6">
          <h3 className="mb-4 font-heading text-2xl font-semibold text-ink">
            Fasit — nærmeste mulige sum
          </h3>
          <div className="mx-auto mb-4 grid w-fit grid-cols-3 gap-2">
            {fasit.rows.map((row, r) =>
              row.map((digit, c) => (
                <span
                  key={`${r}-${c}`}
                  className="flex h-14 w-14 items-center justify-center rounded-xl2 border-2 border-accent-lime/50 bg-surface font-heading text-2xl font-bold text-ink"
                >
                  {digit}
                </span>
              ))
            )}
          </div>
          <p className="font-heading text-xl font-semibold text-ink">
            Sum: {fasit.total} ({fasit.difference >= 0 ? "+" : ""}
            {fasit.difference} fra 1000)
          </p>
        </div>
      )}
    </div>
  );
}

export default NearestThousand;
