import { useRef, useState } from "react";
import { Dices, RotateCcw } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playSound } from "../lib/sound";
import { fireConfetti } from "../lib/confetti";

const SPIN_STEPS = 18;
const SPIN_BASE_DELAY = 70;

function SpinWheel() {
  const activeClassId = useAppStore((s) => s.activeClassId);
  const students = useAppStore(
    (s) => s.classes[s.activeClassId]?.students ?? []
  );
  const drawnStudents = useAppStore(
    (s) => s.drawnStudents[s.activeClassId] ?? []
  );
  const markDrawn = useAppStore((s) => s.markDrawn);
  const resetDrawn = useAppStore((s) => s.resetDrawn);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  const [removeAfterDraw, setRemoveAfterDraw] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [displayName, setDisplayName] = useState(null);
  const [winner, setWinner] = useState(null);
  const timeoutRef = useRef(null);

  const pool = removeAfterDraw
    ? students.filter((s) => !drawnStudents.includes(s))
    : students;
  const allDrawn = removeAfterDraw && students.length > 0 && pool.length === 0;

  function draw() {
    if (spinning || pool.length === 0) return;
    setSpinning(true);
    setWinner(null);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const finalPick = pool[Math.floor(Math.random() * pool.length)];

    if (prefersReduced) {
      setDisplayName(finalPick);
      finishDraw(finalPick);
      return;
    }

    let step = 0;
    const runStep = () => {
      const candidate = students[Math.floor(Math.random() * students.length)];
      setDisplayName(candidate);
      playSound("tick", soundEnabled);
      step += 1;
      if (step < SPIN_STEPS) {
        timeoutRef.current = setTimeout(runStep, SPIN_BASE_DELAY + step * 12);
      } else {
        setDisplayName(finalPick);
        finishDraw(finalPick);
      }
    };
    runStep();
  }

  function finishDraw(name) {
    setSpinning(false);
    setWinner(name);
    if (removeAfterDraw) markDrawn(activeClassId, name);
    playSound("tada", soundEnabled);
    fireConfetti();
  }

  function handleReset() {
    resetDrawn(activeClassId);
    setWinner(null);
    setDisplayName(null);
  }

  if (students.length === 0) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-4 font-heading text-3xl font-semibold text-ink">
          Elevtrekker
        </h2>
        <p className="text-lg text-ink/70">
          Denne klassen har ingen elever ennå. Gå til Klasseliste for å legge
          til elever.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col items-center text-center">
        <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
          Elevtrekker
        </h2>
        <p className="mb-8 text-lg text-ink/70">
          {pool.length} av {students.length} elever igjen å trekke
        </p>

        <div className="mb-8 flex min-h-[160px] w-full items-center justify-center rounded-xl2 border-2 border-ink/10 bg-surface px-8 py-10 shadow-clay">
          <span className="font-heading text-4xl font-bold text-primary">
            {allDrawn
              ? "Alle har blitt trukket! 🎉"
              : (displayName ?? winner ?? "Klar for å trekke?")}
          </span>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={draw}
            disabled={spinning || allDrawn || pool.length === 0}
            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Dices size={26} aria-hidden="true" />
            {spinning ? "Trekker…" : "Trekk elev"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            <RotateCcw size={22} aria-hidden="true" />
            Nullstill
          </button>
        </div>

        <label className="flex cursor-pointer items-center gap-3 font-body text-lg text-ink">
          <input
            type="checkbox"
            checked={removeAfterDraw}
            onChange={(e) => setRemoveAfterDraw(e.target.checked)}
            className="h-6 w-6 cursor-pointer accent-primary"
          />
          Fjern elev etter trekning (alle trekkes etter tur)
        </label>
      </div>

      <aside className="w-full shrink-0 rounded-xl2 border-2 border-ink/10 bg-surface p-5 text-left shadow-clay lg:w-72">
        <h3 className="mb-4 font-heading text-xl font-semibold text-ink">
          Trekkhistorikk
        </h3>
        <ul className="flex flex-col gap-2">
          {students.map((name) => {
            const order = drawnStudents.indexOf(name);
            const isDrawn = order !== -1;
            return (
              <li
                key={name}
                className={`flex items-center gap-3 rounded-xl2 px-3 py-2 font-body text-base ${
                  isDrawn
                    ? "bg-accent-lime/10 text-ink/60 line-through"
                    : "text-ink"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold ${
                    isDrawn
                      ? "bg-accent-lime/40 text-ink"
                      : "bg-ink/5 text-ink/40"
                  }`}
                >
                  {isDrawn ? order + 1 : ""}
                </span>
                {name}
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}

export default SpinWheel;
