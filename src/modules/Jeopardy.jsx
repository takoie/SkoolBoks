import { useState } from "react";
import { X, Eye, EyeOff, Plus, Minus, RotateCcw } from "lucide-react";

const POINTS = [100, 200, 300, 400, 500];
const DEFAULT_CATEGORY_NAMES = ["Norsk", "Matte", "Naturfag", "Historie"];

function makeInitialBoard() {
  const board = {};
  DEFAULT_CATEGORY_NAMES.forEach((_, catIdx) => {
    POINTS.forEach((points) => {
      board[`${catIdx}-${points}`] = { used: false };
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

function Jeopardy() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORY_NAMES);
  const [board, setBoard] = useState(makeInitialBoard);
  const [teams, setTeams] = useState(makeInitialTeams);
  const [activeCell, setActiveCell] = useState(null); // { catIdx, points }
  const [answerVisible, setAnswerVisible] = useState(false);

  function openCell(catIdx, points) {
    const key = `${catIdx}-${points}`;
    if (board[key].used) return;
    setActiveCell({ catIdx, points });
    setAnswerVisible(false);
  }

  function closeCell() {
    if (activeCell) {
      const key = `${activeCell.catIdx}-${activeCell.points}`;
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
    setBoard(makeInitialBoard());
    setTeams(makeInitialTeams());
    setActiveCell(null);
  }

  function renameCategory(idx, name) {
    setCategories((cats) => cats.map((c, i) => (i === idx ? name : c)));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-ink">
          Quiz-arena
        </h2>
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
        style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}
      >
        {categories.map((cat, catIdx) => (
          <input
            key={catIdx}
            value={cat}
            onChange={(e) => renameCategory(catIdx, e.target.value)}
            className="min-h-touch rounded-xl2 border-2 border-primary/30 bg-primary/10 px-3 py-2 text-center font-heading text-lg font-semibold text-primary"
          />
        ))}

        {POINTS.map((points) =>
          categories.map((_, catIdx) => {
            const key = `${catIdx}-${points}`;
            const used = board[key].used;
            return (
              <button
                key={key}
                type="button"
                disabled={used}
                onClick={() => openCell(catIdx, points)}
                className={`min-h-[100px] cursor-pointer rounded-xl2 border-2 font-heading text-3xl font-bold shadow-clay transition-all ${
                  used
                    ? "cursor-not-allowed border-ink/5 bg-ink/5 text-ink/20"
                    : "border-secondary/30 bg-secondary/10 text-secondary hover:-translate-y-1 hover:bg-secondary/20"
                }`}
              >
                {used ? "" : points}
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
                {categories[activeCell.catIdx]} — {activeCell.points} poeng
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
              Skriv spørsmålet her og les det høyt for klassen.
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
                Fasit skrives her.
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
                    onClick={() => adjustScore(t.id, activeCell.points)}
                    aria-label={`Gi poeng til ${t.name}`}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent-lime/20 text-ink transition-colors hover:bg-accent-lime/40"
                  >
                    <Plus size={20} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustScore(t.id, -activeCell.points)}
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

export default Jeopardy;
