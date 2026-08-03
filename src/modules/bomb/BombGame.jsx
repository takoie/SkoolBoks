import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAppStore } from "../../store/useAppStore";
import { playSound } from "../../lib/sound";
import BombSvg from "../../components/bomb/BombSvg";
import Explosion from "../../components/bomb/Explosion";

const MIN_TICK_MS = 120;
const MAX_TICK_MS = 700;

function randomDuration(minSeconds, maxSeconds) {
  const min = Math.min(minSeconds, maxSeconds);
  const max = Math.max(minSeconds, maxSeconds);
  return (min + Math.random() * (max - min)) * 1000;
}

function pickWord(wordBank) {
  if (wordBank.length === 0) return null;
  return wordBank[Math.floor(Math.random() * wordBank.length)];
}

function pickHolder(participants, lastId) {
  const pool =
    participants.length > 1
      ? participants.filter((p) => p.id !== lastId)
      : participants;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function BombGame() {
  const bomb = useAppStore((s) => s.bomb);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  const [phase, setPhase] = useState("idle"); // idle | running | exploded
  const [word, setWord] = useState(null);
  const [progress, setProgress] = useState(0);
  const [holder, setHolder] = useState(null);

  const startRef = useRef(0);
  const durationRef = useRef(0);
  const rafRef = useRef(null);
  const tickTimeoutRef = useRef(null);
  const lastHolderRef = useRef(null);

  function stopTimers() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickTimeoutRef.current) clearTimeout(tickTimeoutRef.current);
  }

  function scheduleTick() {
    const elapsed = Date.now() - startRef.current;
    const p = Math.min(elapsed / durationRef.current, 1);
    if (p >= 1) return;
    playSound("bombTick", soundEnabled);
    const interval = MAX_TICK_MS - (MAX_TICK_MS - MIN_TICK_MS) * p;
    tickTimeoutRef.current = setTimeout(scheduleTick, interval);
  }

  function startRound() {
    const w = pickWord(bomb.wordBank);
    if (!w) return;
    setWord(w);
    if (bomb.mode === "names") {
      const h = pickHolder(bomb.participants, lastHolderRef.current);
      lastHolderRef.current = h?.id ?? null;
      setHolder(h);
    }
    setProgress(0);
    setPhase("running");
    startRef.current = Date.now();
    durationRef.current = randomDuration(bomb.minSeconds, bomb.maxSeconds);
    scheduleTick();

    function frame() {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / durationRef.current, 1);
      setProgress(p);
      if (p >= 1) {
        stopTimers();
        setPhase("exploded");
        playSound("explosion", soundEnabled);
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  function passBomb() {
    if (phase !== "running") return;
    const w = pickWord(bomb.wordBank);
    if (w) setWord(w);
    if (bomb.mode === "names") {
      const h = pickHolder(bomb.participants, lastHolderRef.current);
      lastHolderRef.current = h?.id ?? null;
      setHolder(h);
    }
  }

  useEffect(() => {
    if (phase !== "running") return;
    function handleKeyDown(e) {
      if (e.code === "Space") {
        e.preventDefault();
        passBomb();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bomb.participants, bomb.wordBank]);

  useEffect(() => stopTimers, []);

  const canStart =
    bomb.wordBank.length > 0 &&
    (bomb.mode === "anonymous" || bomb.participants.length > 0);

  return (
    <div className="flex w-full flex-col items-center gap-8 text-center">
      {phase === "idle" && (
        <>
          {!canStart && (
            <p className="font-body text-lg text-ink/60">
              {bomb.wordBank.length === 0
                ? "Legg til ord i ordbanken i innstillingene før du starter."
                : "Legg til deltakere i innstillingene før du starter."}
            </p>
          )}
          <button
            type="button"
            onClick={startRound}
            disabled={!canStart}
            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-4 font-heading text-2xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start runde
          </button>
        </>
      )}

      {phase !== "idle" && (
        <>
          <p className="font-heading text-3xl font-bold text-primary sm:text-4xl">
            {word}
          </p>

          <div
            className="relative"
            style={{ width: "clamp(200px, 26vw, 320px)", aspectRatio: "1 / 1" }}
          >

            <AnimatePresence mode="wait">
              {phase === "running" ? (
                <BombSvg key="bomb" progress={progress} />
              ) : (
                <Explosion key="explosion" />
              )}
            </AnimatePresence>
          </div>

          {bomb.mode === "names" ? (
            <p className="font-heading text-4xl font-bold text-ink sm:text-5xl">
              {phase === "exploded" ? `Bang! ${holder?.name ?? ""} tapte!` : holder?.name}
            </p>
          ) : (
            <p className="font-heading text-4xl font-bold text-ink sm:text-5xl">
              {phase === "exploded" ? "Bang!" : "Send videre!"}
            </p>
          )}

          {phase === "running" && (
            <button
              type="button"
              onClick={passBomb}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-4 font-heading text-2xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
            >
              Send bomben videre (mellomrom)
            </button>
          )}

          {phase === "exploded" && (
            <button
              type="button"
              onClick={startRound}
              disabled={!canStart}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 border-ink/10 px-8 py-4 font-heading text-xl font-semibold text-ink transition-all duration-150 hover:bg-ink/5 active:scale-[0.97]"
            >
              Ny runde
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default BombGame;
