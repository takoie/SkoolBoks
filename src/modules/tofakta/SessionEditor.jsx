import { ArrowLeft, Plus, Play } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { deleteStatementImage, isRoundComplete } from "../../lib/tofakta";
import RoundEditor from "./RoundEditor";

function SessionEditor({ sessionId, onBack, onPresent }) {
  const session = useAppStore((s) => s.tofaktaSessions[sessionId]);
  const renameTofaktaSession = useAppStore((s) => s.renameTofaktaSession);
  const addTofaktaRound = useAppStore((s) => s.addTofaktaRound);
  const deleteTofaktaRound = useAppStore((s) => s.deleteTofaktaRound);
  const updateTofaktaStatement = useAppStore((s) => s.updateTofaktaStatement);
  const setTofaktaLieIndex = useAppStore((s) => s.setTofaktaLieIndex);
  const setTofaktaRoundHeading = useAppStore((s) => s.setTofaktaRoundHeading);

  if (!session) return null;

  const canPresent = session.rounds.length > 0 && session.rounds.every(isRoundComplete);

  function handleDeleteRound(round) {
    if (session.rounds.length <= 1) return;
    deleteTofaktaRound(sessionId, round.id);
    round.statements.forEach((s) => deleteStatementImage(s.imagePath));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Tilbake til opplegg-listen"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <input
          value={session.title}
          onChange={(e) => renameTofaktaSession(sessionId, e.target.value)}
          className="min-w-0 flex-1 rounded-xl2 border-2 border-transparent bg-transparent px-2 py-1 font-heading text-2xl font-semibold text-ink outline-none transition-colors focus:border-primary/40 focus:bg-surface"
        />
        <button
          type="button"
          onClick={onPresent}
          disabled={!canPresent}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play size={20} aria-hidden="true" />
          Presenter
        </button>
      </div>

      {!canPresent && (
        <p className="mb-4 text-base text-ink/60">
          Fyll ut alle tre påstander i hver runde for å kunne presentere.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {session.rounds.map((round, i) => (
          <RoundEditor
            key={round.id}
            round={round}
            index={i}
            canDelete={session.rounds.length > 1}
            onUpdateStatement={(statementIndex, partial) =>
              updateTofaktaStatement(sessionId, round.id, statementIndex, partial)
            }
            onSetLieIndex={(lieIndex) => setTofaktaLieIndex(sessionId, round.id, lieIndex)}
            onUpdateHeading={(heading) => setTofaktaRoundHeading(sessionId, round.id, heading)}
            onDelete={() => handleDeleteRound(round)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => addTofaktaRound(sessionId)}
        className="mt-6 flex min-h-touch w-full cursor-pointer items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-ink/20 px-5 py-4 font-heading font-semibold text-ink/60 transition-colors hover:border-primary/40 hover:text-ink"
      >
        <Plus size={20} aria-hidden="true" />
        Ny runde
      </button>
    </div>
  );
}

export default SessionEditor;
