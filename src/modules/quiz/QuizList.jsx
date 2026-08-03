import { Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function QuizList({ onEdit, onPlay }) {
  const quizzes = useAppStore((s) => s.quizzes);
  const createQuiz = useAppStore((s) => s.createQuiz);
  const deleteQuiz = useAppStore((s) => s.deleteQuiz);

  const list = Object.values(quizzes);

  function handleNewQuiz() {
    const name = `Quiz ${list.length + 1}`;
    const id = createQuiz(name);
    onEdit(id);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-ink">
          Jeopardy
        </h2>
        <button
          type="button"
          onClick={handleNewQuiz}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={20} aria-hidden="true" />
          Ny quiz
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-lg text-ink/60">
          Ingen quizer laget ennå. Klikk «Ny quiz» for å komme i gang.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((quiz) => (
            <li
              key={quiz.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay"
            >
              <div>
                <p className="font-heading text-xl font-semibold text-ink">
                  {quiz.name}
                </p>
                <p className="text-base text-ink/60">
                  {quiz.categories.length} kategorier ·{" "}
                  {quiz.points.length} poengnivåer
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPlay(quiz.id)}
                  className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-4 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <Play size={18} aria-hidden="true" />
                  Spill
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(quiz.id)}
                  className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  <Pencil size={18} aria-hidden="true" />
                  Rediger
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuiz(quiz.id)}
                  aria-label={`Slett ${quiz.name}`}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default QuizList;
