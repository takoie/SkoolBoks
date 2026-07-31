import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Check, Play, ArrowLeft } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import {
  getGroupTotal,
  getCurrentReviewGroupId,
  getWinner,
  getMarkDelta,
} from "../lib/stiansGame";
import { playSound } from "../lib/sound";
import { fireConfetti } from "../lib/confetti";

// While a category is being reviewed, its column is highlighted and each
// group's cell previews the pending change as "previous+delta" (e.g. "0+1")
// instead of jumping straight to the new total — scores only actually
// commit once the whole round finishes.
function formatLiveCell(prevPoints, mark, pointsPerRound) {
  if (mark === undefined) return String(prevPoints);
  const delta = getMarkDelta(pointsPerRound, mark);
  if (delta === 0) return String(prevPoints);
  const sign = delta > 0 ? "+" : "";
  return `${prevPoints}${sign}${delta}`;
}

function ScoreBoard({ groups, categories, scores, review, pointsPerRound }) {
  const reviewedCategory = review ? categories[review.categoryIndex] : null;

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
                className={`border-2 border-ink/10 px-4 py-3 text-left font-heading text-base text-ink transition-colors ${
                  cat === reviewedCategory ? "bg-primary/30" : ""
                }`}
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
                {categories.map((cat) => {
                  const mark = review?.marks[g.id]?.[cat];
                  return (
                    <td
                      key={cat}
                      className={`border-2 border-ink/10 px-4 py-3 font-body text-lg text-ink transition-colors ${
                        cat === reviewedCategory ? "bg-primary/10" : ""
                      }`}
                    >
                      {formatLiveCell(
                        entry.byCategory[cat] ?? 0,
                        mark,
                        pointsPerRound
                      )}
                    </td>
                  );
                })}
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

// Same commit-on-blur shape as ClampedNumberInput. The store rejects blank
// names, so an empty submission is caught here and resynced locally rather
// than relying on the name-changed effect, which wouldn't fire in that case
// (a rejected commit leaves the stored name — and thus this prop — unchanged).
function EditableGroupName({ name, onCommit }) {
  const [draft, setDraft] = useState(name);

  useEffect(() => {
    setDraft(name);
  }, [name]);

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(name);
      return;
    }
    onCommit(trimmed);
  }

  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      aria-label={`Endre navn på ${name}`}
      className="w-32 bg-transparent font-body text-lg text-ink focus:outline-none"
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
    <div className="mx-auto max-w-5xl text-center">
      <div
        role="status"
        aria-live="polite"
        className="mb-8 flex min-h-[180px] w-full items-center justify-center rounded-xl2 border-2 border-ink/10 bg-surface shadow-clay"
      >
        <span
          key={currentLetter ?? "none"}
          className="inline-block animate-pop-in font-heading text-8xl font-bold text-primary"
        >
          {currentLetter ?? "?"}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={drawStiansLetter}
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
        >
          Trekk bokstav
        </button>
        <button
          type="button"
          onClick={rerollStiansLetter}
          disabled={!currentLetter}
          className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-all duration-150 hover:bg-ink/5 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          Trekk på nytt
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
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
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
  const renameStiansGroup = useAppStore((s) => s.renameStiansGroup);
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
    <div className="mx-auto max-w-6xl">
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
              <EditableGroupName
                name={g.name}
                onCommit={(name) => renameStiansGroup(g.id, name)}
              />
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
  const endStiansGame = useAppStore((s) => s.endStiansGame);

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
        if (prev <= 1) return 0;
        if (prev <= 4) playSound("tick", soundEnabled);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, soundEnabled]);

  // State updater functions must stay pure — triggering the store update
  // (which re-renders StiansGame) directly inside setRemaining's updater
  // above violates that and trips React's "setState while rendering a
  // different component" warning. Reacting to the zero-crossing here instead
  // keeps the store call in a normal effect, outside any render pass.
  useEffect(() => {
    if (remaining > 0 || stoppedRef.current) return;
    setRunning(false);
    playSound("ding", soundEnabled);
    stoppedRef.current = true;
    stopStiansWriting(null);
  }, [remaining, soundEnabled, stopStiansWriting]);

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
    <div className="mx-auto max-w-4xl text-center">
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
        className={`mb-6 font-heading text-5xl font-bold ${
          remaining > 0 && remaining <= 10 ? "text-accent-coral-ink" : "text-ink"
        }`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {mm}:{ss}
      </div>

      <div className="mb-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          disabled={remaining === 0}
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
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

      <button
        type="button"
        onClick={endStiansGame}
        className="mt-8 min-h-touch cursor-pointer rounded-xl2 border-2 border-destructive/30 px-6 py-3 font-heading text-lg font-semibold text-destructive transition-colors hover:bg-destructive/10"
      >
        Avslutt spill
      </button>
    </div>
  );
}

// mark is a point multiplier. Every group's buttons stay active for the
// whole category (no forced turn order), so several groups that gave the
// same answer can be marked in quick succession instead of waiting for
// each other's "turn".
const MARK_OPTIONS = [
  {
    mark: 1,
    short: "✓ Godkjent",
    label: "Godkjent",
    idle: "border-accent-lime/40 text-ink hover:bg-accent-lime/20",
    active: "border-accent-lime bg-accent-lime/80 text-accent-ink",
  },
  {
    mark: 0.5,
    short: "½ 50%",
    label: "50% riktig",
    idle: "border-accent-peach/50 text-ink hover:bg-accent-peach/20",
    active: "border-accent-peach bg-accent-peach/80 text-accent-ink",
  },
  {
    mark: 0,
    short: "✗ Ikke godkjent",
    label: "Ikke godkjent",
    idle: "border-destructive/30 text-ink hover:bg-destructive/10",
    active: "border-destructive bg-destructive/80 text-white",
  },
  {
    mark: -1,
    short: "− Minus",
    label: "Minuspoeng",
    idle: "border-ink/20 text-ink hover:bg-ink/10",
    active: "border-ink bg-ink text-canvas",
  },
];

function markBadge(mark) {
  const option = MARK_OPTIONS.find((o) => o.mark === mark);
  if (!option) return null;
  const colorClass =
    mark === 1
      ? "text-accent-lime-ink"
      : mark === 0.5
        ? "text-accent-peach-ink"
        : mark === 0
          ? "text-destructive"
          : "text-ink";
  return (
    <span className={`font-heading font-semibold ${colorClass}`}>
      {option.label}
    </span>
  );
}

function ReviewingPhase() {
  const stiansGame = useAppStore((s) => s.stiansGame);
  const markStiansApproval = useAppStore((s) => s.markStiansApproval);
  const endStiansGame = useAppStore((s) => s.endStiansGame);
  const { review, categories, groups, leadGroupId } = stiansGame;
  const nextRowRef = useRef(null);

  const category = review ? categories[review.categoryIndex] : null;
  const nextGroupId = review ? getCurrentReviewGroupId(stiansGame) : null;

  useEffect(() => {
    // Focus the next-up row (not a button) so a stray Enter/Space right
    // after a phase transition can't silently mark an unreviewed answer.
    nextRowRef.current?.focus();
  }, [nextGroupId, category]);

  if (!review) return null;
  const groupsById = Object.fromEntries(groups.map((g) => [g.id, g]));
  const remaining = review.groupOrder.filter(
    (id) => review.marks[id]?.[category] === undefined
  ).length;

  return (
    <div className="mx-auto max-w-4xl text-center">
      <div role="status" aria-live="polite">
        <p className="mb-2 font-body text-lg text-ink/70">
          Kategori {review.categoryIndex + 1} av {categories.length}
        </p>
        <h3 className="mb-2 font-heading text-4xl font-bold text-ink">
          {category}
        </h3>
        <p className="sr-only">
          {remaining} av {review.groupOrder.length} grupper gjenstår
        </p>
      </div>
      <p className="mb-6 text-base text-ink/60">
        Klikk direkte på en gruppe for å vurdere den — ingen fast rekkefølge.
      </p>

      <div className="mb-8 flex flex-col items-center gap-3">
        {review.groupOrder.map((groupId) => {
          const group = groupsById[groupId];
          const mark = review.marks[groupId]?.[category];
          const isNext = groupId === nextGroupId;
          return (
            <div
              key={groupId}
              ref={isNext ? nextRowRef : null}
              tabIndex={isNext ? -1 : undefined}
              aria-current={isNext ? "true" : undefined}
              className={`flex w-full max-w-lg flex-col gap-3 rounded-xl2 border-2 px-5 py-3 shadow-clay transition-colors ${
                isNext
                  ? "border-primary bg-primary/10"
                  : mark === undefined
                    ? "border-ink/10 bg-surface opacity-70"
                    : "border-ink/10 bg-surface"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-heading text-xl font-semibold text-ink">
                  {isNext && "▶ "}
                  {group?.name}
                  {groupId === leadGroupId && " 📣"}
                </span>
                {markBadge(mark)}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {MARK_OPTIONS.map((option) => (
                  <button
                    key={option.mark}
                    type="button"
                    onClick={() => markStiansApproval(groupId, option.mark)}
                    aria-label={`${option.label} for ${group?.name}`}
                    aria-pressed={mark === option.mark}
                    className={`min-h-touch cursor-pointer rounded-xl2 border-2 px-4 py-2 font-heading text-sm font-semibold transition-colors ${
                      mark === option.mark ? option.active : option.idle
                    }`}
                  >
                    {option.short}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={endStiansGame}
        className="min-h-touch cursor-pointer rounded-xl2 border-2 border-destructive/30 px-6 py-3 font-heading text-lg font-semibold text-destructive transition-colors hover:bg-destructive/10"
      >
        Avslutt spill
      </button>
    </div>
  );
}

function EndedPhase() {
  const groups = useAppStore((s) => s.stiansGame.groups);
  const scores = useAppStore((s) => s.stiansGame.scores);
  const resetStiansGameScores = useAppStore((s) => s.resetStiansGameScores);
  const resetStiansGameFull = useAppStore((s) => s.resetStiansGameFull);

  const winner = getWinner(groups, scores);

  useEffect(() => {
    fireConfetti();
  }, []);

  return (
    <div className="mx-auto max-w-3xl text-center">
      <h3
        role="status"
        aria-live="polite"
        className="mb-4 animate-pop-in font-heading text-4xl font-bold text-primary"
      >
        {winner ? `${winner.name} vinner! 🎉` : "Spillet er over"}
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={resetStiansGameScores}
          className="min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Nytt spill, samme lag/kategorier
        </button>
        <button
          type="button"
          onClick={resetStiansGameFull}
          className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          Helt nytt spill
        </button>
      </div>
    </div>
  );
}

const UNFINISHED_PHASE_LABELS = {
  idle: "Klar for å trekke bokstav",
  writing: "Skriving pågår",
  reviewing: "Vurdering pågår",
};

function formatHistoryDate(iso) {
  return new Date(iso).toLocaleString("no", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConfirmNewGameDialog({ unfinishedLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-new-game-title"
        aria-describedby="confirm-new-game-desc"
        className="w-full max-w-md animate-pop-in rounded-xl2 border-2 border-ink/10 bg-surface p-6 shadow-clay"
      >
        <h3
          id="confirm-new-game-title"
          className="mb-2 font-heading text-2xl font-bold text-ink"
        >
          Avslutte pågående spill?
        </h3>
        <p id="confirm-new-game-desc" className="mb-6 text-lg text-ink/70">
          Dere har et spill i gang ({unfinishedLabel.toLowerCase()}). Hvis du
          starter et nytt spill nå, blir det pågående spillet avbrutt og lagt
          i historikken.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 px-5 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-touch cursor-pointer rounded-xl2 bg-destructive px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-destructive/90"
          >
            Avslutt og start nytt
          </button>
        </div>
      </div>
    </div>
  );
}

function StiansGameHome({ onEnterGame }) {
  const stiansGame = useAppStore((s) => s.stiansGame);
  const history = useAppStore((s) => s.stiansGameHistory);
  const resetStiansGameFull = useAppStore((s) => s.resetStiansGameFull);
  const deleteStiansHistoryEntry = useAppStore(
    (s) => s.deleteStiansHistoryEntry
  );

  const [confirmingNewGame, setConfirmingNewGame] = useState(false);

  // A game left in "ended" has nothing left to resume — fold it straight
  // into history as soon as the home screen is shown, instead of leaving it
  // dangling as a phantom "unfinished" game.
  useEffect(() => {
    if (stiansGame.phase === "ended") {
      resetStiansGameFull();
    }
  }, [stiansGame.phase, resetStiansGameFull]);

  const unfinishedLabel = UNFINISHED_PHASE_LABELS[stiansGame.phase];

  function handleNew() {
    if (stiansGame.phase !== "setup") {
      setConfirmingNewGame(true);
      return;
    }
    onEnterGame();
  }

  function handleConfirmNewGame() {
    resetStiansGameFull();
    setConfirmingNewGame(false);
    onEnterGame();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-ink">
          Stians game
        </h2>
        <button
          type="button"
          onClick={handleNew}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={20} aria-hidden="true" />
          Ny Stians game
        </button>
      </div>

      {unfinishedLabel && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl2 border-2 border-primary/40 bg-primary/10 p-5 shadow-clay">
          <div>
            <p className="font-heading text-xl font-semibold text-ink">
              Du har et pågående spill
            </p>
            <p className="text-base text-ink/60">
              {stiansGame.groups.length} lag · {unfinishedLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onEnterGame}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Play size={18} aria-hidden="true" />
            Fortsett spill
          </button>
        </div>
      )}

      <h3 className="mb-3 font-heading text-xl font-semibold text-ink">
        Tidligere spill
      </h3>
      {history.length === 0 ? (
        <p className="text-lg text-ink/60">Ingen tidligere spill ennå.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {history.map((entry) => {
            const winner = getWinner(entry.groups, entry.scores);
            return (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay"
              >
                <div>
                  <p className="font-heading text-xl font-semibold text-ink">
                    {entry.wasAbandoned
                      ? "Avbrutt spill"
                      : winner
                        ? `${winner.name} vant`
                        : "Spill fullført"}
                  </p>
                  <p className="text-base text-ink/60">
                    {formatHistoryDate(entry.endedAt)} · {entry.groups.length}{" "}
                    lag · {entry.categories.length} kategorier
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteStiansHistoryEntry(entry.id)}
                  aria-label="Slett fra historikk"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {confirmingNewGame && (
        <ConfirmNewGameDialog
          unfinishedLabel={unfinishedLabel}
          onCancel={() => setConfirmingNewGame(false)}
          onConfirm={handleConfirmNewGame}
        />
      )}
    </div>
  );
}

function StiansGame() {
  const [view, setView] = useState("home");
  const phase = useAppStore((s) => s.stiansGame.phase);
  const groups = useAppStore((s) => s.stiansGame.groups);
  const categories = useAppStore((s) => s.stiansGame.categories);
  const scores = useAppStore((s) => s.stiansGame.scores);
  const review = useAppStore((s) => s.stiansGame.review);
  const pointsPerRound = useAppStore((s) => s.stiansGame.pointsPerRound);

  if (view === "home") {
    return <StiansGameHome onEnterGame={() => setView("game")} />;
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setView("home")}
        className="mb-4 flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Tilbake til oversikt
      </button>

      {phase === "setup" ? (
        <SetupPhase />
      ) : (
        <>
          <h2 className="mb-6 text-center font-heading text-3xl font-semibold text-ink">
            Stians game
          </h2>
          <ScoreBoard
            groups={groups}
            categories={categories}
            scores={scores}
            review={review}
            pointsPerRound={pointsPerRound}
          />
          {phase === "idle" && <IdlePhase />}
          {phase === "writing" && <WritingPhase />}
          {phase === "reviewing" && <ReviewingPhase />}
          {phase === "ended" && <EndedPhase />}
        </>
      )}
    </div>
  );
}

export default StiansGame;
