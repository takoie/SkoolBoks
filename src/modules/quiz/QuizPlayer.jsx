import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function makeInitialBoard(quiz) {
  const board = {};
  if (!quiz) return board;
  quiz.categories.forEach((cat) => {
    quiz.points.forEach((point) => {
      board[`${cat.id}-${point.id}`] = { used: false };
    });
  });
  return board;
}

function makeInitialTeams() {
  return [
    { id: "a", name: "Lag A", score: 0 },
    { id: "b", name: "Lag B", score: 0 },
  ];
}

function QuizPlayer({ quizId, onDone }) {
  const quiz = useAppStore((s) => s.quizzes[quizId]);
  const [board, setBoard] = useState(() => makeInitialBoard(quiz));
  const [teams, setTeams] = useState(makeInitialTeams);
  const [activeCell, setActiveCell] = useState(null);
  const [answerVisible, setAnswerVisible] = useState(false);

  if (!quiz) return null;

  function openCell(catId, pointId) {
    const key = `${catId}-${pointId}`;
    if (board[key].used) return;
    setActiveCell({ catId, pointId });
    setAnswerVisible(false);
  }

  function closeCell() {
    if (activeCell) {
      const key = `${activeCell.catId}-${activeCell.pointId}`;
      setBoard((b) => ({ ...b, [key]: { ...b[key], used: true } }));
    }
    setActiveCell(null);
  }

  function adjustScore(teamId, delta) {
    setTeams((ts) =>
      ts.map((t) => (t.id === teamId ? { ...t, score: t.score + delta } : t))
    );
  }

  function resetBoard() {
    setBoard(makeInitialBoard(quiz));
    setTeams(makeInitialTeams());
    setActiveCell(null);
  }

  const activePoint = activeCell
    ? quiz.points.find((p) => p.id === activeCell.pointId)
    : null;
  const activeCategory = activeCell
    ? quiz.categories.find((c) => c.id === activeCell.catId)
    : null;
  const activeCellData = activeCell
    ? quiz.cells[`${activeCell.catId}-${activeCell.pointId}`] ?? {
        question: "",
        answer: "",
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onDone}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
            aria-label="Tilbake til quizliste"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <h2 className="font-heading text-3xl font-semibold text-ink">
            {quiz.name}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {teams.map((t) => (
            <span
              key={t.id}
              className="rounded-xl2 border-2 border-ink/10 bg-surface px-5 py-2 font-heading text-xl font-semibold text-ink shadow-clay"
            >
              {t.name}: {t.score}
            </span>
          ))}
          <button
            type="button"
            onClick={resetBoard}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            <RotateCcw size={20} aria-hidden="true" />
            Nullstill brett
          </button>
        </div>
      </div>

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${quiz.categories.length}, minmax(0, 1fr))`,
        }}
      >
        {quiz.categories.map((cat) => (
          <div
            key={cat.id}
            className="min-h-touch rounded-xl2 border-2 border-primary/30 bg-primary/10 px-3 py-2 text-center font-heading text-lg font-semibold text-primary"
          >
            {cat.name}
          </div>
        ))}

        {quiz.points.map((point) =>
          quiz.categories.map((cat) => {
            const key = `${cat.id}-${point.id}`;
            const used = board[key]?.used;
            return (
              <button
                key={key}
                type="button"
                disabled={used}
                onClick={() => openCell(cat.id, point.id)}
                className={`min-h-[100px] cursor-pointer rounded-xl2 border-2 font-heading text-3xl font-bold shadow-clay transition-all ${
                  used
                    ? "cursor-not-allowed border-ink/5 bg-ink/5 text-ink/20"
                    : "border-secondary/30 bg-secondary/10 text-secondary hover:-translate-y-1 hover:bg-secondary/20"
                }`}
              >
                {used ? "" : point.value}
              </button>
            );
          })
        )}
      </div>

      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6">
          <div className="w-full max-w-2xl rounded-xl2 bg-surface p-8 shadow-clay">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="font-heading text-2xl font-semibold text-ink">
                {activeCategory.name} — {activePoint.value} poeng
              </h3>
              <button
                type="button"
                onClick={closeCell}
                aria-label="Lukk"
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-ink/10"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            <p className="mb-4 min-h-[80px] rounded-xl2 border-2 border-ink/10 bg-canvas p-4 font-body text-lg text-ink">
              {activeCellData.question || "Ingen spørsmål skrevet inn."}
            </p>

            <button
              type="button"
              onClick={() => setAnswerVisible((v) => !v)}
              className="mb-6 flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-5 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              {answerVisible ? (
                <EyeOff size={20} aria-hidden="true" />
              ) : (
                <Eye size={20} aria-hidden="true" />
              )}
              {answerVisible ? "Skjul svar" : "Vis svar"}
            </button>
            {answerVisible && (
              <p className="mb-6 rounded-xl2 border-2 border-accent-lime/40 bg-accent-lime/10 p-4 font-body text-lg text-ink">
                {activeCellData.answer || "Ingen fasit skrevet inn."}
              </p>
            )}

            <div className="flex flex-wrap gap-4">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2"
                >
                  <span className="font-heading font-semibold text-ink">
                    {t.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustScore(t.id, activePoint.value)}
                    aria-label={`Gi poeng til ${t.name}`}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent-lime/20 text-ink transition-colors hover:bg-accent-lime/40"
                  >
                    <Plus size={20} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustScore(t.id, -activePoint.value)}
                    aria-label={`Trekk poeng fra ${t.name}`}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent-coral/20 text-ink transition-colors hover:bg-accent-coral/40"
                  >
                    <Minus size={20} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizPlayer;
