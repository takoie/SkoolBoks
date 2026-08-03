import { Pencil, Trash2, Plus } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { deleteStatementImage } from "../../lib/tofakta";

function SessionList({ onOpen }) {
  const sessions = useAppStore((s) => s.tofaktaSessions);
  const createTofaktaSession = useAppStore((s) => s.createTofaktaSession);
  const deleteTofaktaSession = useAppStore((s) => s.deleteTofaktaSession);

  const list = Object.values(sessions).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  function handleNewSession() {
    const title = `Opplegg ${list.length + 1}`;
    const id = createTofaktaSession(title);
    onOpen(id);
  }

  function handleDelete(session) {
    deleteTofaktaSession(session.id);
    for (const round of session.rounds) {
      for (const statement of round.statements) {
        deleteStatementImage(statement.imagePath);
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-ink">2+1 fake</h2>
        <button
          type="button"
          onClick={handleNewSession}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={20} aria-hidden="true" />
          Nytt opplegg
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-lg text-ink/60">
          Ingen opplegg laget ennå. Klikk «Nytt opplegg» for å komme i gang.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay"
            >
              <div>
                <p className="font-heading text-xl font-semibold text-ink">
                  {session.title}
                </p>
                <p className="text-base text-ink/60">
                  {session.rounds.length} runder
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(session.id)}
                  className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-4 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <Pencil size={18} aria-hidden="true" />
                  Åpne
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(session)}
                  aria-label={`Slett ${session.title}`}
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

export default SessionList;
