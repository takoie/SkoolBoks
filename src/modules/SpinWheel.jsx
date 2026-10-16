import { useEffect, useRef, useState } from "react";
import { Dices, RotateCcw, Undo2, History, UserPlus, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playSound } from "../lib/sound";
import { fireConfetti } from "../lib/confetti";

const SPIN_STEPS = 18;
const SPIN_BASE_DELAY = 70;
const DRAW_COUNT_PRESETS = [1, 2, 3, 4];
const MAX_CUSTOM_DRAW_COUNT = 99;
const EMPTY_ARRAY = [];

function pluralElev(n) {
  return n === 1 ? "elev" : "elever";
}

function formatNameList(names) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return names.join(" og ");
  return `${names.slice(0, -1).join(", ")} og ${names[names.length - 1]}`;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function SpinWheel() {
  const activeClassId = useAppStore((s) => s.activeClassId);
  const students = useAppStore(
    (s) => s.classes[s.activeClassId]?.students ?? EMPTY_ARRAY
  );
  const drawnStudents = useAppStore(
    (s) => s.drawnStudents[s.activeClassId] ?? EMPTY_ARRAY
  );
  const markDrawn = useAppStore((s) => s.markDrawn);
  const resetDrawn = useAppStore((s) => s.resetDrawn);
  const undoLastDraw = useAppStore((s) => s.undoLastDraw);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const setClassSwitchGuard = useAppStore((s) => s.setClassSwitchGuard);

  const [removeAfterDraw, setRemoveAfterDraw] = useState(true);
  const [drawCount, setDrawCount] = useState(1);
  const [customCountDraft, setCustomCountDraft] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [displayNames, setDisplayNames] = useState(null);
  const [winners, setWinners] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const timeoutRef = useRef(null);

  // Drawn students persist per class, but a bytt-klasse mid-draw still looks
  // like data loss to the teacher — warn before it happens, then clear the
  // stale winner/display once the switch is confirmed.
  useEffect(() => {
    if (drawnStudents.length > 0) {
      setClassSwitchGuard({
        moduleId: "spinwheel",
        message:
          "Elevtrekker har trukket elever fra denne klassen. Bytter du klasse nå, nullstilles visningen (trekkhistorikken beholdes per klasse). Fortsette?",
      });
    } else {
      setClassSwitchGuard(null);
    }
    return () => setClassSwitchGuard(null);
  }, [drawnStudents.length, setClassSwitchGuard]);

  useEffect(() => {
    setWinners(null);
    setDisplayNames(null);
  }, [activeClassId]);

  const pool = removeAfterDraw
    ? students.filter((s) => !drawnStudents.includes(s))
    : students;
  const allDrawn = removeAfterDraw && students.length > 0 && pool.length === 0;
  const isCustomCount = !DRAW_COUNT_PRESETS.includes(drawCount);

  function selectPreset(n) {
    setDrawCount(n);
    setCustomCountDraft("");
  }

  function commitCustomCount() {
    const n = parseInt(customCountDraft, 10);
    if (!n || n < 1) {
      setCustomCountDraft("");
      return;
    }
    setDrawCount(Math.min(n, MAX_CUSTOM_DRAW_COUNT));
  }

  function draw() {
    if (spinning || pool.length === 0) return;
    const count = Math.min(drawCount, pool.length);
    setSpinning(true);
    setWinners(null);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const finalPicks = shuffle(pool).slice(0, count);

    if (prefersReduced) {
      setDisplayNames(finalPicks);
      finishDraw(finalPicks);
      return;
    }

    let step = 0;
    const runStep = () => {
      const candidates = Array.from(
        { length: count },
        () => students[Math.floor(Math.random() * students.length)]
      );
      setDisplayNames(candidates);
      playSound("tick", soundEnabled);
      step += 1;
      if (step < SPIN_STEPS) {
        timeoutRef.current = setTimeout(runStep, SPIN_BASE_DELAY + step * 12);
      } else {
        setDisplayNames(finalPicks);
        finishDraw(finalPicks);
      }
    };
    runStep();
  }

  function finishDraw(names) {
    setSpinning(false);
    setWinners(names);
    if (removeAfterDraw) markDrawn(activeClassId, names);
    playSound("tada", soundEnabled);
    fireConfetti();
  }

  function handleReset() {
    resetDrawn(activeClassId);
    setWinners(null);
    setDisplayNames(null);
  }

  function handleUndo() {
    if (drawnStudents.length === 0) return;
    undoLastDraw(activeClassId);
    setWinners(null);
    setDisplayNames(null);
  }

  const shownNames = displayNames ?? winners;

  return (
    <div className="relative min-h-[32rem] w-full">
      {students.length === 0 && (
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
            Elevtrekker
          </h2>
          <p className="mb-6 text-lg text-ink/70">
            Denne klassen har ingen navn ennå. Legg til navn for å trekke elever.
          </p>
          <button
            type="button"
            onClick={() => useAppStore.getState().setActiveModule("classlist")}
            className="flex min-h-touch cursor-pointer items-center justify-center gap-3 rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
          >
            <UserPlus size={22} aria-hidden="true" />
            Legg til navn
          </button>
        </div>
      )}

      <div className={`mx-auto flex max-w-2xl flex-col items-center text-center ${students.length === 0 ? "hidden" : ""}`}>
        <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
          Elevtrekker
        </h2>
        <p className="mb-8 text-lg text-ink/70">
          {pool.length} av {students.length} navn igjen å trekke
        </p>

        <div className="mb-8 flex min-h-[160px] w-full items-center justify-center overflow-hidden rounded-xl2 border-2 border-ink/10 bg-surface px-8 py-10 shadow-clay">
          <span
            key={
              allDrawn ? "done" : (shownNames ? shownNames.join(",") : "idle")
            }
            className={`inline-block font-heading text-4xl font-bold text-primary ${
              winners && !spinning
                ? "animate-pop-in"
                : displayNames
                  ? "animate-fade-in"
                  : ""
            }`}
          >
            {allDrawn
              ? "Alle har blitt trukket! 🎉"
              : (shownNames ? formatNameList(shownNames) : "Klar for å trekke?")}
          </span>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <span className="font-body text-lg text-ink/70">Antall:</span>
          {DRAW_COUNT_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => selectPreset(n)}
              aria-pressed={drawCount === n}
              className={`flex min-h-touch min-w-touch cursor-pointer items-center justify-center rounded-xl2 border-2 px-4 py-2 font-heading text-lg font-semibold transition-colors ${
                drawCount === n
                  ? "border-primary bg-primary text-white"
                  : "border-ink/10 text-ink hover:bg-primary/10"
              }`}
            >
              {n}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={MAX_CUSTOM_DRAW_COUNT}
            value={
              customCountDraft || (isCustomCount ? String(drawCount) : "")
            }
            onChange={(e) => setCustomCountDraft(e.target.value)}
            onBlur={commitCustomCount}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder="Annet"
            aria-label="Annet antall elever å trekke"
            className={`min-h-touch w-20 rounded-xl2 border-2 bg-surface px-2 py-2 text-center font-body text-lg text-ink ${
              isCustomCount ? "border-primary" : "border-ink/10"
            }`}
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={draw}
            disabled={spinning || allDrawn || pool.length === 0}
            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            <Dices size={26} aria-hidden="true" />
            {spinning
              ? "Trekker…"
              : drawCount === 1
                ? "Trekk elev"
                : `Trekk ${drawCount} elever`}
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={spinning || drawnStudents.length === 0}
            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-all duration-150 hover:bg-ink/5 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            <Undo2 size={22} aria-hidden="true" />
            Angre trekk
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
            checked={removeAfterDraw}
            onChange={(e) => setRemoveAfterDraw(e.target.checked)}
            className="h-6 w-6 cursor-pointer accent-primary"
          />
          Fjern {pluralElev(drawCount)} etter trekning (alle trekkes etter tur)
        </label>
      </div>

      {!historyOpen && students.length > 0 && (
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          aria-label="Vis trekkhistorikk"
          className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 cursor-pointer items-center gap-2 rounded-l-xl2 border-2 border-r-0 border-ink/10 bg-surface px-3 py-4 font-heading text-sm font-semibold text-ink shadow-clay transition-colors hover:bg-primary/10"
        >
          <History size={20} aria-hidden="true" />
        </button>
      )}

      <aside
        className={`absolute inset-y-0 right-0 z-20 flex w-full shrink-0 flex-col border-l-2 border-ink/10 bg-surface p-5 text-left shadow-clay transition-transform duration-300 sm:w-96 ${
          students.length === 0 ? "hidden" : ""
        } ${historyOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h3 className="font-heading text-xl font-semibold text-ink">
            Trekkhistorikk
          </h3>
          <button
            type="button"
            onClick={() => setHistoryOpen(false)}
            aria-label="Skjul trekkhistorikk"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <ul className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto">
          {students.map((name) => {
            const order = drawnStudents.indexOf(name);
            const isDrawn = order !== -1;
            return (
              <li
                key={name}
                className={`flex items-center gap-3 rounded-xl2 px-3 py-2 font-body text-base transition-colors duration-300 ${
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
