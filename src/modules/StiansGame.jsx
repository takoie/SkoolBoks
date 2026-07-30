import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Check, Play } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { getGroupTotal, getCurrentReviewGroupId } from "../lib/stiansGame";
import { playSound } from "../lib/sound";

function ScoreBoard({ groups, categories, scores }) {
  return (
    <div className="mb-8 overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-xl2 border-2 border-ink/10 shadow-clay">
        <thead>
          <tr className="bg-primary/10">
            <th
              scope="col"
              className="border-2 border-ink/10 px-4 py-3 text-left font-heading text-lg text-ink"
            >
              Gruppe
            </th>
            {categories.map((cat) => (
              <th
                key={cat}
                scope="col"
                className="border-2 border-ink/10 px-4 py-3 text-left font-heading text-base text-ink"
              >
                {cat}
              </th>
            ))}
            <th
              scope="col"
              className="border-2 border-ink/10 bg-accent-lime/30 px-4 py-3 text-left font-heading text-lg text-ink"
            >
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const entry = scores[g.id] ?? { byCategory: {}, bonus: 0 };
            return (
              <tr key={g.id} className="bg-surface">
                <td className="border-2 border-ink/10 px-4 py-3 font-heading font-semibold text-ink">
                  {g.name}
                </td>
                {categories.map((cat) => (
                  <td
                    key={cat}
                    className="border-2 border-ink/10 px-4 py-3 font-body text-lg text-ink"
                  >
                    {entry.byCategory[cat] ?? 0}
                  </td>
                ))}
                <td className="border-2 border-ink/10 bg-accent-lime/10 px-4 py-3 font-heading text-lg font-bold text-ink">
                  {getGroupTotal(scores, g.id)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

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

function IdlePhase() {
  const usedLetters = useAppStore((s) => s.stiansGame.usedLetters);
  const currentLetter = useAppStore((s) => s.stiansGame.currentLetter);
  const pointsPerRound = useAppStore((s) => s.stiansGame.pointsPerRound);
  const bonusEnabled = useAppStore((s) => s.stiansGame.bonusEnabled);
  const bonusPoints = useAppStore((s) => s.stiansGame.bonusPoints);
  const timerSeconds = useAppStore((s) => s.stiansGame.timerSeconds);

  const drawStiansLetter = useAppStore((s) => s.drawStiansLetter);
  const rerollStiansLetter = useAppStore((s) => s.rerollStiansLetter);
  const setStiansManualLetter = useAppStore((s) => s.setStiansManualLetter);
  const setStiansPointsPerRound = useAppStore((s) => s.setStiansPointsPerRound);
  const setStiansBonusEnabled = useAppStore((s) => s.setStiansBonusEnabled);
  const setStiansBonusPoints = useAppStore((s) => s.setStiansBonusPoints);
  const setStiansTimerSeconds = useAppStore((s) => s.setStiansTimerSeconds);
  const startStiansWriting = useAppStore((s) => s.startStiansWriting);
  const endStiansGame = useAppStore((s) => s.endStiansGame);

  const [manualDraft, setManualDraft] = useState("");

  function handleManualLetter() {
    if (!manualDraft.trim()) return;
    setStiansManualLetter(manualDraft);
    setManualDraft("");
  }

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div
        role="status"
        aria-live="polite"
        className="mb-8 flex min-h-[180px] w-full items-center justify-center rounded-xl2 border-2 border-ink/10 bg-surface shadow-clay"
      >
        <span className="font-heading text-8xl font-bold text-primary">
          {currentLetter ?? "?"}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={drawStiansLetter}
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Trekk bokstav
        </button>
        <button
          type="button"
          onClick={rerollStiansLetter}
          disabled={!currentLetter}
          className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trekk på nytt
        </button>
        <label className="flex items-center gap-2 font-body text-lg text-ink">
          Egen bokstav:
          <input
            type="text"
            maxLength={1}
            value={manualDraft}
            onChange={(e) => setManualDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualLetter()}
            className="min-h-touch w-14 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-body text-lg uppercase text-ink"
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

      <div className="mb-8 flex flex-wrap items-center justify-center gap-6 rounded-xl2 border-2 border-ink/10 bg-surface p-4 shadow-clay">
        <label className="flex items-center gap-2 font-body text-lg text-ink">
          Poeng/runde:
          <ClampedNumberInput
            min={1}
            value={pointsPerRound}
            onCommit={setStiansPointsPerRound}
            className="min-h-touch w-16 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-body text-lg text-ink"
          />
        </label>
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

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={startStiansWriting}
          disabled={!currentLetter}
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start skriving
        </button>
        <button
          type="button"
          onClick={endStiansGame}
          className="min-h-touch cursor-pointer rounded-xl2 border-2 border-destructive/30 px-6 py-3 font-heading text-lg font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          Avslutt spill
        </button>
      </div>
      <p className="mt-3 text-base text-ink/60">
        Brukte bokstaver: {usedLetters.join(", ") || "ingen ennå"}
      </p>
    </div>
  );
}

function SetupPhase() {
  const groups = useAppStore((s) => s.stiansGame.groups);
  const categories = useAppStore((s) => s.stiansGame.categories);
  const categoryBank = useAppStore((s) => s.categoryBank);
  const addStiansGroup = useAppStore((s) => s.addStiansGroup);
  const removeStiansGroup = useAppStore((s) => s.removeStiansGroup);
  const addCategoryToBank = useAppStore((s) => s.addCategoryToBank);
  const removeCategoryFromBank = useAppStore((s) => s.removeCategoryFromBank);
  const setStiansCategories = useAppStore((s) => s.setStiansCategories);
  const startStiansGame = useAppStore((s) => s.startStiansGame);

  const [groupDraft, setGroupDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");

  function handleAddGroup() {
    const name = groupDraft.trim();
    if (!name) return;
    addStiansGroup(name);
    setGroupDraft("");
  }

  function handleAddCategory() {
    const name = categoryDraft.trim();
    if (!name) return;
    addCategoryToBank(name);
    if (!categories.includes(name)) {
      setStiansCategories([...categories, name]);
    }
    setCategoryDraft("");
  }

  function toggleCategory(name) {
    setStiansCategories(
      categories.includes(name)
        ? categories.filter((c) => c !== name)
        : [...categories, name]
    );
  }

  const canStart = groups.length >= 2 && categories.length >= 1;

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
        Stians game — oppsett
      </h2>
      <p className="mb-8 text-lg text-ink/70">
        Sett opp lag og velg kategorier før dere starter.
      </p>

      <section className="mb-8">
        <h3 className="mb-3 font-heading text-xl font-semibold text-ink">
          Lag ({groups.length})
        </h3>
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            type="text"
            value={groupDraft}
            onChange={(e) => setGroupDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
            placeholder="Lagnavn"
            className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink"
          />
          <button
            type="button"
            onClick={handleAddGroup}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={20} aria-hidden="true" />
            Legg til lag
          </button>
        </div>
        <ul className="flex flex-wrap gap-3">
          {groups.map((g) => (
            <li
              key={g.id}
              className="flex items-center gap-2 rounded-full border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink shadow-clay"
            >
              {g.name}
              <button
                type="button"
                onClick={() => removeStiansGroup(g.id)}
                aria-label={`Fjern ${g.name}`}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 font-heading text-xl font-semibold text-ink">
          Kategoribank
        </h3>
        <div className="mb-3 flex flex-wrap gap-3">
          <input
            type="text"
            value={categoryDraft}
            onChange={(e) => setCategoryDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="Ny kategori (f.eks. Bilmerker)"
            className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={20} aria-hidden="true" />
            Legg til i banken
          </button>
        </div>
        <p className="mb-2 text-base text-ink/60">
          Huk av kategoriene som skal brukes i dagens spill ({categories.length} valgt):
        </p>
        <ul className="flex flex-wrap gap-3">
          {categoryBank.map((name) => {
            const active = categories.includes(name);
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => toggleCategory(name)}
                  aria-pressed={active}
                  className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-body text-lg transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-ink/10 bg-surface text-ink hover:bg-ink/5"
                  }`}
                >
                  {active && <Check size={18} aria-hidden="true" />}
                  {name}
                </button>
              </li>
            );
          })}
          {categoryBank.length === 0 && (
            <li className="text-base text-ink/60">
              Kategoribanken er tom — legg til en kategori over.
            </li>
          )}
        </ul>
        {categoryBank.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer font-body text-base text-ink/60">
              Slett kategorier fra banken
            </summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {categoryBank.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => removeCategoryFromBank(name)}
                    className="flex cursor-pointer items-center gap-1 rounded-full border-2 border-destructive/30 px-3 py-1 font-body text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <button
        type="button"
        onClick={startStiansGame}
        disabled={!canStart}
        className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Play size={24} aria-hidden="true" />
        Start spill
      </button>
      {!canStart && (
        <p className="mt-2 text-base text-ink/60">
          Trenger minst 2 lag og 1 kategori for å starte.
        </p>
      )}
    </div>
  );
}

function WritingPhase() {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const currentLetter = useAppStore((s) => s.stiansGame.currentLetter);
  const categories = useAppStore((s) => s.stiansGame.categories);
  const groups = useAppStore((s) => s.stiansGame.groups);
  const timerSeconds = useAppStore((s) => s.stiansGame.timerSeconds);
  const stopStiansWriting = useAppStore((s) => s.stopStiansWriting);

  const [remaining, setRemaining] = useState(timerSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    setRemaining(timerSeconds);
    setRunning(false);
    stoppedRef.current = false;
  }, [timerSeconds]);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          playSound("ding", soundEnabled);
          if (!stoppedRef.current) {
            stoppedRef.current = true;
            stopStiansWriting(null);
          }
          return 0;
        }
        if (prev <= 4) playSound("tick", soundEnabled);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, soundEnabled, stopStiansWriting]);

  function handleShout(groupId) {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    stopStiansWriting(groupId);
  }

  function handleManualStop() {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    stopStiansWriting(null);
  }

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div
        role="status"
        aria-live="polite"
        className="mb-6 flex min-h-[160px] w-full items-center justify-center rounded-xl2 border-2 border-ink/10 bg-surface shadow-clay"
      >
        <span className="font-heading text-7xl font-bold text-primary">
          {currentLetter}
        </span>
      </div>

      <p className="mb-2 font-body text-lg text-ink/70">
        Kategorier: {categories.join(", ")}
      </p>

      <div
        className="mb-6 font-heading text-5xl font-bold text-ink"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {mm}:{ss}
      </div>

      <div className="mb-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          disabled={remaining === 0}
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? "Pause" : "Start tid"}
        </button>
        <button
          type="button"
          onClick={handleManualStop}
          className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          Stopp (uten lag)
        </button>
      </div>

      <p className="mb-3 font-heading text-lg font-semibold text-ink">
        Gruppa som er ferdig roper "Stians game!":
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => handleShout(g.id)}
            className="min-h-touch cursor-pointer rounded-xl2 border-2 border-accent-coral/40 bg-accent-coral/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-accent-coral/20"
          >
            {g.name} ropte!
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewingPhase() {
  const stiansGame = useAppStore((s) => s.stiansGame);
  const markStiansApproval = useAppStore((s) => s.markStiansApproval);
  const { review, categories, groups, leadGroupId } = stiansGame;
  const currentButtonRef = useRef(null);

  const category = review ? categories[review.categoryIndex] : null;
  const currentGroupId = review ? getCurrentReviewGroupId(stiansGame) : null;

  useEffect(() => {
    currentButtonRef.current?.focus();
  }, [currentGroupId, category]);

  if (!review) return null;
  const groupsById = Object.fromEntries(groups.map((g) => [g.id, g]));

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div role="status" aria-live="polite">
        <p className="mb-2 font-body text-lg text-ink/70">
          Kategori {review.categoryIndex + 1} av {categories.length}
        </p>
        <h3 className="mb-6 font-heading text-4xl font-bold text-ink">
          {category}
        </h3>
      </div>

      <div className="mb-8 flex flex-col items-center gap-3">
        {review.groupOrder.map((groupId) => {
          const group = groupsById[groupId];
          const mark = review.marks[groupId]?.[category];
          const isCurrent = groupId === currentGroupId;
          return (
            <div
              key={groupId}
              aria-current={isCurrent ? "true" : undefined}
              className={`flex w-full max-w-md items-center justify-between gap-4 rounded-xl2 border-2 px-5 py-3 shadow-clay transition-colors ${
                isCurrent
                  ? "border-primary bg-primary/10"
                  : mark === undefined
                    ? "border-ink/10 bg-surface opacity-50"
                    : "border-ink/10 bg-surface"
              }`}
            >
              <span className="font-heading text-xl font-semibold text-ink">
                {isCurrent && "▶ "}
                {group?.name}
                {groupId === leadGroupId && " 📣"}
              </span>
              {mark === true && (
                <span className="font-heading font-semibold text-accent-lime">
                  Godkjent
                </span>
              )}
              {mark === false && (
                <span className="font-heading font-semibold text-destructive">
                  Ikke godkjent
                </span>
              )}
              {isCurrent && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    ref={currentButtonRef}
                    onClick={() => markStiansApproval(true)}
                    aria-label={`Godkjent for ${group?.name}`}
                    className="min-h-touch cursor-pointer rounded-xl2 bg-accent-lime/80 px-5 py-2 font-heading font-semibold text-ink transition-colors hover:bg-accent-lime"
                  >
                    Godkjent
                  </button>
                  <button
                    type="button"
                    onClick={() => markStiansApproval(false)}
                    aria-label={`Ikke godkjent for ${group?.name}`}
                    className="min-h-touch cursor-pointer rounded-xl2 bg-destructive/80 px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-destructive"
                  >
                    Ikke godkjent
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StiansGame() {
  const phase = useAppStore((s) => s.stiansGame.phase);
  const groups = useAppStore((s) => s.stiansGame.groups);
  const categories = useAppStore((s) => s.stiansGame.categories);
  const scores = useAppStore((s) => s.stiansGame.scores);

  if (phase === "setup") return <SetupPhase />;

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="mb-6 text-center font-heading text-3xl font-semibold text-ink">
        Stians game
      </h2>
      <ScoreBoard groups={groups} categories={categories} scores={scores} />
      {phase === "idle" && <IdlePhase />}
      {phase === "writing" && <WritingPhase />}
      {phase === "reviewing" && <ReviewingPhase />}
      {phase === "ended" && (
        <p className="text-center text-lg text-ink/70">
          Fase "ended" bygges i neste steg.
        </p>
      )}
    </div>
  );
}

export default StiansGame;
