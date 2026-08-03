import { useEffect, useRef, useState } from "react";
import { Sigma, Trophy, RotateCcw, Settings, Flame } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { playSound } from "../../lib/sound";
import {
  TIMER_OPTIONS,
  TABLE_PRESETS,
  CUSTOM_TABLE_OPTIONS,
  generateQuestion,
  milestoneMessage,
} from "../../lib/gangemester";

const TICK_MS = 50;

function activeTables(gangemester) {
  if (gangemester.mode === "small") return TABLE_PRESETS.small.tables;
  if (gangemester.mode === "large") return TABLE_PRESETS.large.tables;
  return gangemester.customTables;
}

function GangemesterArena() {
  const gangemester = useAppStore((s) => s.gangemester);
  const setGangemesterSettings = useAppStore((s) => s.setGangemesterSettings);
  const setGangemesterHighScore = useAppStore((s) => s.setGangemesterHighScore);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  const [phase, setPhase] = useState("config"); // config | playing | gameover
  const [question, setQuestion] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gangemester.timerSeconds);
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [milestone, setMilestone] = useState(null);
  const [newHighScore, setNewHighScore] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      endRound();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => Math.max(0, t - TICK_MS / 1000)), TICK_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
  }, [phase, question]);

  useEffect(() => {
    if (!milestone) return;
    const id = setTimeout(() => setMilestone(null), 1800);
    return () => clearTimeout(id);
  }, [milestone]);

  function startGame() {
    const tables = activeTables(gangemester);
    if (tables.length === 0) return;
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setNewHighScore(false);
    setFeedback(null);
    setMilestone(null);
    setQuestion(generateQuestion(tables));
    setTimeLeft(gangemester.timerSeconds);
    setInputValue("");
    setPhase("playing");
  }

  function endRound() {
    setPhase("gameover");
    setFeedback(null);
    if (score > gangemester.highScore) {
      setNewHighScore(true);
      setGangemesterHighScore(score);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!question || inputValue.trim() === "") return;
    const guess = Number(inputValue);

    if (guess === question.answer) {
      playSound("tick", soundEnabled);
      const nextScore = score + 1;
      const nextStreak = streak + 1;
      setScore(nextScore);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setFeedback("correct");
      setTimeout(() => setFeedback(null), 250);

      const msg = milestoneMessage(nextStreak);
      if (msg) {
        setMilestone(msg);
        playSound("tada", soundEnabled);
      }

      const tables = activeTables(gangemester);
      setQuestion(generateQuestion(tables, question));
      setTimeLeft(gangemester.timerSeconds);
      setInputValue("");
    } else {
      playSound("ding", soundEnabled);
      setFeedback("wrong");
      endRound();
    }
  }

  const pct = question ? Math.max(0, (timeLeft / gangemester.timerSeconds) * 100) : 0;
  const urgent = phase === "playing" && timeLeft <= Math.min(2, gangemester.timerSeconds * 0.3);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold text-ink">
          <Sigma size={26} aria-hidden="true" className="text-primary" />
          Gangemester
        </h2>
        {phase === "playing" && (
          <button
            type="button"
            onClick={() => setPhase("gameover")}
            className="font-body text-sm text-ink/50 underline decoration-dotted hover:text-ink"
          >
            Avslutt runden
          </button>
        )}
      </div>

      {phase === "config" && (
        <ConfigScreen
          gangemester={gangemester}
          setGangemesterSettings={setGangemesterSettings}
          onStart={startGame}
        />
      )}

      {phase === "playing" && question && (
        <div
          className={`flex w-full flex-col items-center gap-6 rounded-xl2 border-2 border-ink/10 bg-surface p-8 shadow-clay transition-colors duration-200 ${
            feedback === "correct" ? "bg-accent-lime/20" : ""
          }`}
        >
          <div className="flex w-full items-center justify-between font-body text-base text-ink/70">
            <span>Poeng: <strong className="text-ink">{score}</strong></span>
            <span
              key={streak}
              className={`flex items-center gap-1 font-heading font-semibold ${
                streak > 0 ? "text-accent-gold-ink animate-pop-in" : "text-ink/40"
              }`}
            >
              <Flame size={18} aria-hidden="true" />
              {streak}
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className={`h-full rounded-full transition-[width] duration-100 ease-linear ${
                urgent ? "animate-urgent bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="font-heading text-5xl font-bold text-ink">
            {question.a} × {question.b} = ?
          </p>

          <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoComplete="off"
              aria-label="Skriv inn svaret"
              className="min-h-touch w-full rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-3 text-center font-heading text-3xl font-semibold text-ink"
            />
            <button
              type="submit"
              className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
            >
              Svar
            </button>
          </form>

          {milestone && (
            <div
              role="status"
              aria-live="polite"
              className="animate-pop-in rounded-xl2 bg-accent-gold px-5 py-2 font-heading text-lg font-semibold text-accent-gold-ink shadow-clay"
            >
              {milestone}
            </div>
          )}
        </div>
      )}

      {phase === "gameover" && (
        <div className="flex w-full flex-col items-center gap-5 rounded-xl2 border-2 border-ink/10 bg-surface p-8 text-center shadow-clay animate-modal-in">
          <p className="font-heading text-2xl font-bold text-ink">Runden er over!</p>
          <p className="font-heading text-5xl font-bold text-primary">{score}</p>
          <p className="font-body text-base text-ink/70">
            riktige svar · beste streak {bestStreak}
          </p>
          {newHighScore && (
            <p className="flex items-center gap-2 font-heading text-base font-semibold text-accent-gold-ink">
              <Trophy size={20} aria-hidden="true" />
              Ny rekord!
            </p>
          )}
          {!newHighScore && gangemester.highScore > 0 && (
            <p className="font-body text-sm text-ink/50">Rekord: {gangemester.highScore}</p>
          )}
          <div className="mt-2 flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={startGame}
              className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
            >
              <RotateCcw size={20} aria-hidden="true" />
              Spill igjen
            </button>
            <button
              type="button"
              onClick={() => setPhase("config")}
              className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              <Settings size={20} aria-hidden="true" />
              Endre innstillinger
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigScreen({ gangemester, setGangemesterSettings, onStart }) {
  const tables = activeTables(gangemester);
  const canStart = tables.length > 0;

  function toggleCustomTable(n) {
    const has = gangemester.customTables.includes(n);
    const next = has
      ? gangemester.customTables.filter((t) => t !== n)
      : [...gangemester.customTables, n].sort((a, b) => a - b);
    setGangemesterSettings({ customTables: next });
  }

  return (
    <div className="flex w-full flex-col gap-6 rounded-xl2 border-2 border-ink/10 bg-surface p-6 shadow-clay">
      <div>
        <p className="mb-2 font-heading text-base font-semibold text-ink">Hva vil du øve på?</p>
        <div className="flex flex-col gap-2">
          {[
            { id: "small", label: TABLE_PRESETS.small.label },
            { id: "large", label: TABLE_PRESETS.large.label },
            { id: "custom", label: "Egendefinerte tabeller" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setGangemesterSettings({ mode: opt.id })}
              className={`flex min-h-touch cursor-pointer items-center rounded-xl2 border-2 px-4 py-2 text-left font-heading font-semibold transition-colors ${
                gangemester.mode === opt.id
                  ? "border-primary bg-primary text-white"
                  : "border-ink/10 bg-surface text-ink hover:bg-primary/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {gangemester.mode === "custom" && (
        <div>
          <p className="mb-2 font-body text-sm text-ink/70">Velg tabeller (f.eks. 7-gangen)</p>
          <div className="flex flex-wrap gap-2">
            {CUSTOM_TABLE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => toggleCustomTable(n)}
                className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl2 border-2 font-heading font-semibold transition-colors ${
                  gangemester.customTables.includes(n)
                    ? "border-secondary bg-secondary text-white"
                    : "border-ink/10 bg-surface text-ink hover:bg-secondary/10"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 font-heading text-base font-semibold text-ink">Tid per spørsmål</p>
        <div className="flex gap-2">
          {TIMER_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setGangemesterSettings({ timerSeconds: s })}
              className={`flex min-h-touch cursor-pointer items-center justify-center rounded-xl2 border-2 px-5 py-2 font-heading font-semibold transition-colors ${
                gangemester.timerSeconds === s
                  ? "border-primary bg-primary text-white"
                  : "border-ink/10 bg-surface text-ink hover:bg-primary/10"
              }`}
            >
              {s} sek
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary px-8 py-4 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start spillet
      </button>
      {!canStart && (
        <p className="text-center font-body text-sm text-destructive">
          Velg minst én tabell for å starte.
        </p>
      )}
    </div>
  );
}

export default GangemesterArena;
