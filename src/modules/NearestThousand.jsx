import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Hash, Info, Play, RotateCcw, Square, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { playSound } from "../lib/sound";
import { findClosestArrangement } from "../lib/nearestThousand";
import Die3D from "../components/Die3D";

const TOTAL_ROUNDS = 9;
// Short pause after landing before the button unlocks, so a double-tap on
// "Neste kast" can't skip a digit.
const UNLOCK_DELAY = 300;
// Time between throws in the automatic round.
const AUTO_INTERVAL = 3000;

function NearestThousand() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const [draws, setDraws] = useState([]);
  // Mirrors `draws` synchronously so drawNext always sees the true latest
  // value even if a second click fires before React re-renders.
  const drawsRef = useRef(draws);
  drawsRef.current = draws;

  const [rolling, setRolling] = useState(false);
  const [request, setRequest] = useState(null);
  const [showFasit, setShowFasit] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [auto, setAuto] = useState(false);
  // Bumped on reset so a throw that is still in the air is ignored when it
  // lands, and used as the die's throw key.
  const rollTokenRef = useRef(0);
  const pendingRef = useRef(null);

  const done = draws.length === TOTAL_ROUNDS;
  const fasit = done ? findClosestArrangement(draws) : null;
  const fasitVisible = showFasit && fasit;

  function drawNext() {
    if (pendingRef.current || drawsRef.current.length >= TOTAL_ROUNDS) return;
    const key = ++rollTokenRef.current;
    const digit = Math.floor(Math.random() * 10);
    pendingRef.current = { key, digit };
    setRolling(true);
    setRequest({ key, digit });
  }

  function handleImpact() {
    playSound("tick", soundEnabled);
  }

  function handleLand() {
    const pending = pendingRef.current;
    if (!pending || pending.key !== rollTokenRef.current) return;
    pendingRef.current = null;

    const next = [...drawsRef.current, pending.digit];
    drawsRef.current = next;
    setDraws(next);
    if (next.length === TOTAL_ROUNDS) setAuto(false);
    playSound(next.length === TOTAL_ROUNDS ? "tada" : "ding", soundEnabled);
    setTimeout(() => {
      if (rollTokenRef.current === pending.key) setRolling(false);
    }, UNLOCK_DELAY);
  }

  // Automatic round: throw now, then every AUTO_INTERVAL until all digits are
  // drawn. The ref keeps the interval calling the latest drawNext.
  const drawNextRef = useRef(drawNext);
  drawNextRef.current = drawNext;
  useEffect(() => {
    if (!auto) return undefined;
    drawNextRef.current();
    const id = setInterval(() => drawNextRef.current(), AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [auto]);

  function reset() {
    setAuto(false);
    rollTokenRef.current += 1;
    pendingRef.current = null;
    drawsRef.current = [];
    setDraws([]);
    setRolling(false);
    setRequest(null);
    setShowFasit(false);
  }

  const slots = Array.from({ length: TOTAL_ROUNDS }, (_, i) =>
    fasitVisible ? fasit.rows.flat()[i] : draws[i]
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-3xl font-semibold text-ink">
            Nærmest tusen
          </h2>
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-all duration-150 hover:bg-ink/10 active:scale-90"
            aria-label="Hvordan spillet fungerer"
          >
            <Info size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="font-heading text-xl font-semibold text-ink/70">
          Kast {draws.length} av {TOTAL_ROUNDS}
        </p>
      </div>

      {showInfo &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
            onClick={() => setShowInfo(false)}
          >
            <div
              className="relative w-full max-w-md rounded-xl2 bg-surface p-8 text-left shadow-clay animate-modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10"
                aria-label="Lukk"
              >
                <X size={18} aria-hidden="true" />
              </button>

              <h3 className="mb-4 font-heading text-xl font-semibold text-ink">
                Slik spilles Nærmest tusen
              </h3>
              <p className="font-body text-base text-ink/80">
                Lag et 3×3 rutenett. Når tallet vises så må det plasseres
                raskt før neste tall kommer. Når alle sifrene er skrevet inn
                i rutenettet så adderes tallene nedover. De som er nærmest
                1000 (over og under) vinner!
              </p>
            </div>
          </div>,
          document.body
        )}

      {/* Both columns have a fixed footprint (slots are always rendered, the
          fasit swaps into the same grid), so nothing shifts as digits arrive. */}
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-full"
            style={{ "--die": "clamp(7rem, 24vh, 16rem)" }}
          >
            <Die3D
              request={request}
              onImpact={handleImpact}
              onLand={handleLand}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={drawNext}
              disabled={done || rolling || auto}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
            >
              <Hash size={24} aria-hidden="true" />
              {done ? "Alle kast trukket" : rolling ? "Kaster…" : "Neste kast"}
            </button>
            <button
              type="button"
              onClick={() => setAuto((v) => !v)}
              disabled={done}
              aria-pressed={auto}
              className={`flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 px-6 py-3 font-heading text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                auto
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-primary/40 text-primary hover:bg-primary/10"
              }`}
            >
              {auto ? (
                <Square size={20} aria-hidden="true" />
              ) : (
                <Play size={20} aria-hidden="true" />
              )}
              {auto ? "Stopp automatisk" : "Automatisk runde"}
            </button>
          </div>

          {/* Reserved height so the bar appearing doesn't move anything. */}
          <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-ink/10">
            {auto && (
              <div
                key={request?.key}
                className="auto-progress h-full rounded-full bg-primary"
                style={{ animationDuration: `${AUTO_INTERVAL}ms` }}
              />
            )}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-col gap-4">
          <div
            className={`rounded-xl2 border p-4 shadow-clay transition-colors ${
              fasitVisible
                ? "border-accent-lime/50 bg-accent-lime/10"
                : "border-border-subtle bg-surface"
            }`}
          >
            <h3 className="mb-3 font-heading text-lg font-semibold text-ink">
              {fasitVisible ? "Fasit – nærmeste mulige sum" : "Trukne tall"}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {slots.map((digit, i) => (
                <span
                  key={`${fasitVisible ? "f" : "d"}-${i}-${digit ?? "empty"}`}
                  className={`relative flex aspect-[5/4] items-center justify-center rounded-xl2 border-2 font-heading text-[clamp(2rem,6vh,3.5rem)] font-extrabold leading-none ${
                    digit === undefined
                      ? "border-dashed border-ink/15 text-transparent"
                      : fasitVisible
                        ? "border-accent-lime/50 bg-surface text-ink animate-pop-in"
                        : i === draws.length - 1
                          ? "border-accent-gold bg-accent-gold/25 text-ink animate-pop-in"
                          : "border-primary/25 bg-primary/10 text-primary"
                  }`}
                >
                  <span className="absolute left-2 top-1 font-body text-xs font-semibold text-ink/35">
                    {digit === undefined ? i + 1 : ""}
                  </span>
                  {digit}
                </span>
              ))}
            </div>
            <p className="mt-3 min-h-[2.75rem] font-heading text-lg font-semibold text-ink/80">
              {fasitVisible
                ? `Sum: ${fasit.total} (${fasit.difference >= 0 ? "+" : ""}${fasit.difference} fra 1000)`
                : done
                  ? "Alle tallene er trukket."
                  : "Tallene dukker opp her i rekkefølgen de kastes."}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowFasit((v) => !v)}
              disabled={!done}
              className="flex min-h-touch min-w-0 flex-1 cursor-pointer items-center justify-center gap-3 rounded-xl2 border-2 border-accent-lime/60 bg-accent-lime/20 px-6 py-3 font-heading text-xl font-semibold text-ink transition-colors hover:bg-accent-lime/35 disabled:cursor-not-allowed disabled:border-ink/10 disabled:bg-transparent disabled:text-ink/40"
            >
              {fasitVisible ? (
                <EyeOff size={24} aria-hidden="true" />
              ) : (
                <Eye size={24} aria-hidden="true" />
              )}
              {fasitVisible ? "Skjul fasit" : "Vis fasit"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 border-ink/10 px-5 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              <RotateCcw size={22} aria-hidden="true" />
              Nullstill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NearestThousand;
