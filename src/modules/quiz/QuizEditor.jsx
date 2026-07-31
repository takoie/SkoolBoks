import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function makeId() {
  return crypto.randomUUID();
}

function QuizEditor({ quizId, onDone }) {
  const quiz = useAppStore((s) => s.quizzes[quizId]);
  const updateQuiz = useAppStore((s) => s.updateQuiz);

  if (!quiz) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-lg text-ink/70">Fant ikke quizen.</p>
        <button
          type="button"
          onClick={onDone}
          className="mx-auto flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-5 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          Tilbake til quizliste
        </button>
      </div>
    );
  }

  function setCell(catId, pointId, partial) {
    const key = `${catId}-${pointId}`;
    updateQuiz(quizId, {
      cells: {
        ...quiz.cells,
        [key]: { ...quiz.cells[key], ...partial },
      },
    });
  }

  function addCategory() {
    updateQuiz(quizId, {
      categories: [
        ...quiz.categories,
        { id: makeId(), name: `Kategori ${quiz.categories.length + 1}` },
      ],
    });
  }

  function removeCategory(catId) {
    const cells = { ...quiz.cells };
    Object.keys(cells)
      .filter((k) => k.startsWith(`${catId}-`))
      .forEach((k) => delete cells[k]);
    updateQuiz(quizId, {
      categories: quiz.categories.filter((c) => c.id !== catId),
      cells,
    });
  }

  function renameCategory(catId, name) {
    updateQuiz(quizId, {
      categories: quiz.categories.map((c) =>
        c.id === catId ? { ...c, name } : c
      ),
    });
  }

  function addPointLevel() {
    const maxValue = quiz.points.reduce((m, p) => Math.max(m, p.value), 0);
    updateQuiz(quizId, {
      points: [...quiz.points, { id: makeId(), value: maxValue + 100 }],
    });
  }

  function removePointLevel(pointId) {
    const cells = { ...quiz.cells };
    Object.keys(cells)
      .filter((k) => k.endsWith(`-${pointId}`))
      .forEach((k) => delete cells[k]);
    updateQuiz(quizId, {
      points: quiz.points.filter((p) => p.id !== pointId),
      cells,
    });
  }

  function renamePointValue(pointId, value) {
    updateQuiz(quizId, {
      points: quiz.points.map((p) =>
        p.id === pointId ? { ...p, value } : p
      ),
    });
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onDone}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
          aria-label="Tilbake til quizliste"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <input
          value={quiz.name}
          onChange={(e) => updateQuiz(quizId, { name: e.target.value })}
          className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-heading text-2xl font-semibold text-ink"
        />
        <button
          type="button"
          onClick={addCategory}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <Plus size={18} aria-hidden="true" />
          Kategori
        </button>
        <button
          type="button"
          onClick={addPointLevel}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          <Plus size={18} aria-hidden="true" />
          Poengnivå
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-2">
          <thead>
            <tr>
              <th />
              {quiz.categories.map((cat) => (
                <th key={cat.id} className="min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <input
                      value={cat.name}
                      onChange={(e) => renameCategory(cat.id, e.target.value)}
                      className="min-h-touch flex-1 rounded-xl2 border-2 border-primary/30 bg-primary/10 px-3 py-2 text-center font-heading text-lg font-semibold text-primary"
                    />
                    {quiz.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(cat.id)}
                        aria-label={`Fjern ${cat.name}`}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quiz.points.map((point) => (
              <tr key={point.id}>
                <td className="whitespace-nowrap align-top">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={point.value}
                      onChange={(e) => {
                        const parsed = Number(e.target.value);
                        if (Number.isFinite(parsed)) {
                          renamePointValue(point.id, parsed);
                        }
                      }}
                      className="min-h-touch w-20 rounded-xl2 border-2 border-ink/10 bg-surface px-2 py-2 text-center font-heading text-lg font-semibold text-ink"
                    />
                    {quiz.points.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePointLevel(point.id)}
                        aria-label={`Fjern poengnivå ${point.value}`}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </td>
                {quiz.categories.map((cat) => {
                  const key = `${cat.id}-${point.id}`;
                  const cell = quiz.cells[key] ?? { question: "", answer: "" };
                  return (
                    <td key={key} className="align-top">
                      <textarea
                        value={cell.question}
                        onChange={(e) =>
                          setCell(cat.id, point.id, {
                            question: e.target.value,
                          })
                        }
                        placeholder="Spørsmål"
                        rows={2}
                        className="mb-2 w-full rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2 font-body text-base text-ink"
                      />
                      <textarea
                        value={cell.answer}
                        onChange={(e) =>
                          setCell(cat.id, point.id, { answer: e.target.value })
                        }
                        placeholder="Svar"
                        rows={2}
                        className="w-full rounded-xl2 border-2 border-accent-lime/40 bg-accent-lime/10 px-3 py-2 font-body text-base text-ink"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default QuizEditor;
