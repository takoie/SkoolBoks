import { useState } from "react";
import { Plus, Trash2, Play } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { getWinner } from "../../lib/stiansGame";

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

export default function StiansGameHome({ onEnterGame }) {
  const stiansGame = useAppStore((s) => s.stiansGame);
  const history = useAppStore((s) => s.stiansGameHistory);
  const resetStiansGameFull = useAppStore((s) => s.resetStiansGameFull);
  const deleteStiansHistoryEntry = useAppStore(
    (s) => s.deleteStiansHistoryEntry
  );

  const [confirmingNewGame, setConfirmingNewGame] = useState(false);

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
          Nytt Stians game
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
