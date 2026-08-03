import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Check, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { imageSrc } from "../../lib/tofakta";

function PresentationView({ sessionId, onBack }) {
  const session = useAppStore((s) => s.tofaktaSessions[sessionId]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState("discussion");

  if (!session) return null;

  const round = session.rounds[roundIndex];
  const isLast = roundIndex >= session.rounds.length - 1;
  const isFirst = roundIndex === 0;

  function goTo(nextIndex) {
    setRoundIndex(nextIndex);
    setPhase("discussion");
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Tilbake til redigering"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h2 className="font-heading text-3xl font-semibold text-ink">{session.title}</h2>
        <span className="ml-auto font-body text-xl text-ink/60">
          Runde {roundIndex + 1} / {session.rounds.length}
        </span>
      </div>

      {round.heading && (
        <h3 className="text-center font-heading text-2xl font-semibold text-ink/80">
          {round.heading}
        </h3>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {round.statements.map((statement, i) => {
          const isLie = round.lieIndex === i;
          const revealed = phase === "reveal";
          const stateClasses = !revealed
            ? "border-ink/10 bg-surface"
            : isLie
              ? "border-destructive bg-destructive/10"
              : "border-accent-lime bg-accent-lime/10";

          return (
            <div
              key={statement.id}
              className={`flex flex-col items-center gap-4 rounded-xl2 border-4 p-6 text-center shadow-clay transition-colors duration-500 ${stateClasses}`}
            >
              {statement.imagePath && (
                <img
                  src={imageSrc(statement.imagePath)}
                  alt=""
                  className="max-h-64 w-full rounded-xl2 object-contain"
                />
              )}
              <p className="font-body text-2xl text-ink">{statement.text}</p>
              {revealed && (
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${
                    isLie ? "bg-destructive" : "bg-accent-lime text-accent-ink"
                  }`}
                  aria-hidden="true"
                >
                  {isLie ? <X size={26} /> : <Check size={26} />}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => goTo(roundIndex - 1)}
          disabled={isFirst}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-5 py-3 font-heading font-semibold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={22} aria-hidden="true" />
          Forrige runde
        </button>

        {phase === "discussion" ? (
          <button
            type="button"
            onClick={() => setPhase("reveal")}
            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-3 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
          >
            <Eye size={24} aria-hidden="true" />
            Avslør
          </button>
        ) : (
          <span className="px-8 py-3 font-heading text-xl font-semibold text-ink/40">
            Avslørt
          </span>
        )}

        <button
          type="button"
          onClick={() => goTo(roundIndex + 1)}
          disabled={isLast}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 px-5 py-3 font-heading font-semibold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Neste runde
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default PresentationView;
