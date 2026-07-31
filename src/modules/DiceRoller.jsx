import { useState } from "react";
import { Dice5, Minus, Plus } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playSound } from "../lib/sound";

const SIDE_OPTIONS = [4, 6, 8, 10, 12, 20];
const ROLL_STEPS = 10;
const ROLL_BASE_DELAY = 60;

function rollOne(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function DiceRoller() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const [numDice, setNumDice] = useState(2);
  const [sides, setSides] = useState(6);
  const [values, setValues] = useState(null);
  const [rolling, setRolling] = useState(false);

  function roll() {
    if (rolling) return;
    setRolling(true);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const final = Array.from({ length: numDice }, () => rollOne(sides));

    if (prefersReduced) {
      setValues(final);
      setRolling(false);
      playSound("tada", soundEnabled);
      return;
    }

    let step = 0;
    const runStep = () => {
      setValues(Array.from({ length: numDice }, () => rollOne(sides)));
      playSound("tick", soundEnabled);
      step += 1;
      if (step < ROLL_STEPS) {
        setTimeout(runStep, ROLL_BASE_DELAY + step * 8);
      } else {
        setValues(final);
        setRolling(false);
        playSound("tada", soundEnabled);
      }
    };
    runStep();
  }

  const sum = values?.reduce((a, b) => a + b, 0) ?? null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
      <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
        Terningkast
      </h2>
      <p className="mb-8 text-lg text-ink/70">
        Velg antall terninger og type, og kast.
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-6">
        <div className="flex items-center gap-3">
          <span className="font-heading font-semibold text-ink">Antall</span>
          <button
            type="button"
            onClick={() => setNumDice((n) => Math.max(1, n - 1))}
            aria-label="Færre terninger"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-colors hover:bg-ink/5"
          >
            <Minus size={20} aria-hidden="true" />
          </button>
          <span className="w-8 font-heading text-2xl font-bold text-primary">
            {numDice}
          </span>
          <button
            type="button"
            onClick={() => setNumDice((n) => Math.min(6, n + 1))}
            aria-label="Flere terninger"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-colors hover:bg-ink/5"
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SIDE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSides(s)}
              className={`min-h-touch cursor-pointer rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
                sides === s
                  ? "border-primary bg-primary text-white"
                  : "border-ink/10 text-ink hover:bg-ink/5"
              }`}
            >
              d{s}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 flex min-h-[160px] w-full flex-wrap items-center justify-center gap-4 rounded-xl2 border-2 border-ink/10 bg-surface px-8 py-10 shadow-clay">
        {values ? (
          values.map((v, i) => (
            <span
              key={i}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 font-heading text-3xl font-bold text-primary"
            >
              {v}
            </span>
          ))
        ) : (
          <span className="font-heading text-2xl text-ink/50">
            Klar for å kaste?
          </span>
        )}
      </div>

      {sum !== null && numDice > 1 && (
        <p className="mb-6 font-heading text-xl font-semibold text-ink">
          Sum: {sum}
        </p>
      )}

      <button
        type="button"
        onClick={roll}
        disabled={rolling}
        className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Dice5 size={26} aria-hidden="true" />
        {rolling ? "Kaster…" : "Kast"}
      </button>
    </div>
  );
}

export default DiceRoller;
