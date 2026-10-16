import { useState, useEffect } from "react";
import { Undo2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { NORWEGIAN_ALPHABET } from "../../lib/stiansGame";

function ClampedNumberInput({ value, onCommit, className, ...inputProps }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <input
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={className}
      {...inputProps}
    />
  );
}

export default function StiansIdle() {
  const usedLetters = useAppStore((s) => s.stiansGame.usedLetters);
  const currentLetter = useAppStore((s) => s.stiansGame.currentLetter);
  const pointsPerRound = useAppStore((s) => s.stiansGame.pointsPerRound);
  const bonusEnabled = useAppStore((s) => s.stiansGame.bonusEnabled);
  const bonusPoints = useAppStore((s) => s.stiansGame.bonusPoints);
  const timerSeconds = useAppStore((s) => s.stiansGame.timerSeconds);
  const roundMode = useAppStore((s) => s.stiansGame.roundMode);
  const canUndoMark = useAppStore((s) => !!s.stiansGameUndo);

  const drawStiansLetter = useAppStore((s) => s.drawStiansLetter);
  const setStiansManualLetter = useAppStore((s) => s.setStiansManualLetter);
  const setStiansPointsPerRound = useAppStore((s) => s.setStiansPointsPerRound);
  const setStiansBonusEnabled = useAppStore((s) => s.setStiansBonusEnabled);
  const setStiansBonusPoints = useAppStore((s) => s.setStiansBonusPoints);
  const setStiansTimerSeconds = useAppStore((s) => s.setStiansTimerSeconds);
  const setStiansRoundMode = useAppStore((s) => s.setStiansRoundMode);
  const startStiansWriting = useAppStore((s) => s.startStiansWriting);
  const undoStiansMark = useAppStore((s) => s.undoStiansMark);

  const [manualDraft, setManualDraft] = useState("");

  function handleDraw() {
    drawStiansLetter();
    startStiansWriting();
  }

  function handleManualLetter() {
    const trimmed = manualDraft.trim();
    if (!trimmed || !NORWEGIAN_ALPHABET.includes(trimmed.toLocaleUpperCase("no")))
      return;
    setStiansManualLetter(trimmed);
    setManualDraft("");
    startStiansWriting();
  }

  return (
    <div className="mx-auto max-w-5xl text-center">
      <div className="mb-8 flex flex-wrap items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleDraw}
            className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
          >
            Trekk bokstav
          </button>
          <label className="flex items-center gap-2 font-body text-lg text-ink">
            Egen bokstav:
            <input
              type="password"
              autoComplete="off"
              maxLength={1}
              value={manualDraft}
              onChange={(e) => setManualDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualLetter()}
              aria-label="Egen bokstav (skjult til du trykker Bruk)"
              className="min-h-touch w-14 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-body text-lg text-ink"
            />
            <button
              type="button"
              onClick={handleManualLetter}
              disabled={!manualDraft.trim()}
              className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Bruk
            </button>
          </label>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[180px] w-56 items-center justify-center rounded-xl2 border-2 border-ink/10 bg-surface shadow-clay"
        >
          <span
            key={currentLetter ?? "none"}
            className="inline-block animate-pop-in font-heading text-8xl font-bold text-primary"
          >
            {currentLetter ?? "?"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-xl2 border-2 border-ink/10 bg-surface p-4 shadow-clay">
          <label className="flex items-center gap-2 font-body text-lg text-ink">
            Poeng/runde:
            <ClampedNumberInput
              min={1}
              value={pointsPerRound}
              onCommit={setStiansPointsPerRound}
              className="min-h-touch w-16 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-body text-lg text-ink"
            />
          </label>
          <div className="flex items-center gap-2 font-body text-lg text-ink">
            Rundetype:
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setStiansRoundMode("timed")}
                aria-pressed={roundMode === "timed"}
                className={`min-h-touch cursor-pointer rounded-xl2 border-2 px-3 py-2 font-heading text-sm font-semibold transition-colors ${
                  roundMode === "timed"
                    ? "border-primary bg-primary text-white"
                    : "border-ink/10 text-ink hover:bg-primary/10"
                }`}
              >
                Tidsbasert
              </button>
              <button
                type="button"
                onClick={() => setStiansRoundMode("shout")}
                aria-pressed={roundMode === "shout"}
                className={`min-h-touch cursor-pointer rounded-xl2 border-2 px-3 py-2 font-heading text-sm font-semibold transition-colors ${
                  roundMode === "shout"
                    ? "border-primary bg-primary text-white"
                    : "border-ink/10 text-ink hover:bg-primary/10"
                }`}
              >
                Kun rop
              </button>
            </div>
          </div>
          {roundMode === "timed" && (
            <label className="flex items-center gap-2 font-body text-lg text-ink">
              Sekunder:
              <ClampedNumberInput
                min={5}
                max={600}
                value={timerSeconds}
                onCommit={setStiansTimerSeconds}
                className="min-h-touch w-20 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-body text-lg text-ink"
              />
            </label>
          )}
          <label className="flex cursor-pointer items-center gap-2 font-body text-lg text-ink">
            <input
              type="checkbox"
              checked={bonusEnabled}
              onChange={(e) => setStiansBonusEnabled(e.target.checked)}
              className="h-6 w-6 cursor-pointer accent-primary"
            />
            Bonus for først ferdig
          </label>
          {bonusEnabled && (
            <label className="flex items-center gap-2 font-body text-lg text-ink">
              Bonuspoeng:
              <ClampedNumberInput
                min={1}
                value={bonusPoints}
                onCommit={setStiansBonusPoints}
                className="min-h-touch w-16 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-body text-lg text-ink"
              />
            </label>
          )}
        </div>
      </div>

      {canUndoMark && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={undoStiansMark}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            <Undo2 size={18} aria-hidden="true" />
            Angre siste vurdering
          </button>
        </div>
      )}
      <p className="mt-3 text-base text-ink/60">
        Brukte bokstaver: {usedLetters.join(", ") || "ingen ennå"}
      </p>
    </div>
  );
}
