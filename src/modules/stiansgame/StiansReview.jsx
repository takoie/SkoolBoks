import { useEffect, useRef } from "react";
import { Undo2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { getCurrentReviewGroupId } from "../../lib/stiansGame";

const MARK_OPTIONS = [
  {
    mark: 1,
    short: "✓",
    label: "Godkjent",
    idle: "border-accent-lime/40 text-ink hover:bg-accent-lime/20",
    active: "border-accent-lime bg-accent-lime/80 text-accent-ink",
  },
  {
    mark: 0.5,
    short: "½",
    label: "50% riktig",
    idle: "border-accent-peach/50 text-ink hover:bg-accent-peach/20",
    active: "border-accent-peach bg-accent-peach/80 text-accent-ink",
  },
  {
    mark: 0,
    short: "✗",
    label: "Ikke godkjent",
    idle: "border-destructive/30 text-ink hover:bg-destructive/10",
    active: "border-destructive bg-destructive/80 text-white",
  },
  {
    mark: -1,
    short: "−1",
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

export default function StiansReview() {
  const stiansGame = useAppStore((s) => s.stiansGame);
  const markStiansApproval = useAppStore((s) => s.markStiansApproval);
  const canUndoMark = useAppStore((s) => !!s.stiansGameUndo);
  const undoStiansMark = useAppStore((s) => s.undoStiansMark);
  const { review, categories, groups, leadGroupId } = stiansGame;
  const nextRowRef = useRef(null);

  const category = review ? categories[review.categoryIndex] : null;
  const nextGroupId = review ? getCurrentReviewGroupId(stiansGame) : null;

  useEffect(() => {
    nextRowRef.current?.focus();
  }, [nextGroupId, category]);

  if (!review) return null;
  const groupsById = Object.fromEntries(groups.map((g) => [g.id, g]));
  const remaining = review.groupOrder.filter(
    (id) => review.marks[id]?.[category] === undefined
  ).length;

  return (
    <div className="w-full text-center">
      <div role="status" aria-live="polite">
        <p className="mb-2 font-body text-lg text-ink/70">
          Kategori {review.categoryIndex + 1} av {categories.length}
        </p>
        <h3 className="mb-6 font-heading text-4xl font-bold text-ink">
          {category}
        </h3>
        <p className="sr-only">
          {remaining} av {review.groupOrder.length} grupper gjenstår
        </p>
      </div>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
              className={`flex flex-col gap-3 rounded-xl2 border-2 px-5 py-3 shadow-clay transition-colors ${
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
              <div className="flex flex-nowrap items-center justify-center gap-2">
                {MARK_OPTIONS.map((option) => (
                  <button
                    key={option.mark}
                    type="button"
                    onClick={() => markStiansApproval(groupId, option.mark)}
                    aria-label={`${option.label} for ${group?.name}`}
                    aria-pressed={mark === option.mark}
                    title={option.label}
                    className={`min-h-touch min-w-touch flex-1 cursor-pointer rounded-xl2 border-2 px-2 py-2 font-heading text-lg font-semibold transition-colors ${
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

      {canUndoMark && (
        <button
          type="button"
          onClick={undoStiansMark}
          className="inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <Undo2 size={18} aria-hidden="true" />
          Angre siste vurdering
        </button>
      )}
    </div>
  );
}
