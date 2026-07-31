import { useRef, useState } from "react";
import { Eye, Hash, RotateCcw } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playSound } from "../lib/sound";
import { findClosestArrangement } from "../lib/nearestThousand";

const TOTAL_ROUNDS = 9;
const ROLL_STEPS = 12;
const ROLL_BASE_DELAY = 70;
// How long the landed digit stays big on screen before it slides into the
// results bar below - gives students at the back of the room time to read it.
const SETTLE_DELAY = 600;

function NearestThousand() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const [draws, setDraws] = useState([]);
  // Mirrors `draws` synchronously so drawNext always sees the true latest
  // value even if a second click fires before React re-renders (avoids a
  // stale-closure race that could drop a digit or double-fire a sound).
  const drawsRef = useRef(draws);
  drawsRef.current = draws;

  const [rolling, setRolling] = useState(false);
  const [rollDigit, setRollDigit] = useState(null);
  const [showFasit, setShowFasit] = useState(false);
  // Bumped on reset so any in-flight roll timeouts recognize they're stale
  // and stop touching state after the user resets mid-animation.
  const rollTokenRef = useRef(0);

  const done = draws.length === TOTAL_ROUNDS;
  const fasit = done ? findClosestArrangement(draws) : null;

  function drawNext() {
    if (rolling || drawsRef.current.length >= TOTAL_ROUNDS) return;
    const token = ++rollTokenRef.current;
    setRolling(true);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const final = Math.floor(Math.random() * 10);

    const commit = () => {
      if (rollTokenRef.current !== token) return;
      setRollDigit(final);
      const next = [...drawsRef.current, final];
      playSound(next.length === TOTAL_ROUNDS ? "tada" : "ding", soundEnabled);
      setTimeout(() => {
        if (rollTokenRef.current !== token) return;
        drawsRef.current = next;
        setDraws(next);
        setRolling(false);
        setRollDigit(null);
      }, SETTLE_DELAY);
    };

    if (prefersReduced) {
      commit();
      return;
    }

    let step = 0;
    const runStep = () => {
      if (rollTokenRef.current !== token) return;
      setRollDigit(Math.floor(Math.random() * 10));
      playSound("tick", soundEnabled);
      step += 1;
      if (step < ROLL_STEPS) {
        setTimeout(runStep, ROLL_BASE_DELAY + step * 8);
      } else {
        commit();
      }
    };
    runStep();
  }

  function reset() {
    rollTokenRef.current += 1;
    drawsRef.current = [];
    setDraws([]);
    setRolling(false);
    setRollDigit(null);
    setShowFasit(false);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
      <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
        Nærmest tusen
      </h2>
      <p className="mb-8 text-lg text-ink/70">
        Kast {draws.length} av {TOTAL_ROUNDS} — bygg et 3×3-rutenett med tre
        tresifrede tall som kommer nærmest 1000.
      </p>

      <div className="mb-8 flex h-64 w-64 items-center justify-center rounded-[2.5rem] border-4 border-primary/30 bg-surface shadow-clay sm:h-72 sm:w-72">
        {rollDigit !== null ? (
          <span
            key={rollDigit}
            className="inline-block animate-pop-in font-heading text-[9rem] leading-none font-black text-primary"
          >
            {rollDigit}
          </span>
        ) : (
          done && (
            <span className="px-6 font-heading text-2xl text-ink/40">
              Alle kast trukket
            </span>
          )
        )}
      </div>

      <div className="grid w-full grid-cols-1 items-start gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center">
          <div className="mb-8 flex min-h-[120px] w-full flex-wrap items-center justify-center gap-3 rounded-xl2 border-2 border-ink/10 bg-surface px-8 py-8 shadow-clay">
            {draws.length === 0 ? (
              <span className="font-heading text-2xl text-ink/50">
                Klar for første kast?
              </span>
            ) : (
              draws.map((d, i) => (
                <span
                  key={i}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 font-heading text-2xl font-bold text-primary animate-pop-in"
                >
                  {d}
                </span>
              ))
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={drawNext}
              disabled={done || rolling}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
            >
              <Hash size={24} aria-hidden="true" />
              {done ? "Alle kast trukket" : rolling ? "Kaster…" : "Neste kast"}
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

        <div className="flex flex-col items-center">
          {!done && (
            <div className="flex min-h-[120px] w-full items-center justify-center rounded-xl2 border-2 border-dashed border-ink/15 bg-surface/50 px-8 py-8">
              <span className="font-heading text-lg text-ink/40">
                Fasiten vises når alle {TOTAL_ROUNDS} kast er trukket
              </span>
            </div>
          )}

          {done && !showFasit && (
            <button
              type="button"
              onClick={() => setShowFasit(true)}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-accent-lime/80 px-8 py-3 font-heading text-xl font-semibold text-accent-ink transition-colors hover:bg-accent-lime"
            >
              <Eye size={24} aria-hidden="true" />
              Vis fasit
            </button>
          )}

          {fasit && showFasit && (
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
      </div>
    </div>
  );
}

export default NearestThousand;
