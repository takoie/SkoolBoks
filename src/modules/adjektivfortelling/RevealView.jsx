import { useState } from "react";
import { ArrowLeft, ChevronRight, Rows3, Maximize } from "lucide-react";
import { splitIntoLines, renderSegments, TYPE_COLORS } from "../../lib/adjectiveStory";

function Segments({ segments }) {
  return segments.map((seg, i) =>
    seg.isAnswer ? (
      <span
        key={i}
        className={`rounded font-semibold ${TYPE_COLORS[seg.type].bg} ${TYPE_COLORS[seg.type].text}`}
      >
        {seg.text}
      </span>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}

function RevealView({ story, answers, onBack }) {
  const [mode, setMode] = useState(null);
  const [lineIndex, setLineIndex] = useState(0);

  const lines = splitIntoLines(story.text);
  const isLastLine = lineIndex >= lines.length - 1;

  if (!mode) {
    return (
      <div className="relative mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Tilbake til redigering"
          className="absolute left-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>

        <h2 className="font-heading text-3xl font-semibold text-ink">
          Hvordan vil du vise «{story.title}»?
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setMode("lines")}
            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-5 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
          >
            <Rows3 size={24} aria-hidden="true" />
            Linje for linje
          </button>
          <button
            type="button"
            onClick={() => setMode("fullscreen")}
            className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-5 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
          >
            <Maximize size={24} aria-hidden="true" />
            Fullskjerm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setMode(null)}
          aria-label="Tilbake til visningsvalg"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h2 className="font-heading text-3xl font-semibold text-ink">{story.title}</h2>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setMode("lines")}
            className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
              mode === "lines"
                ? "border-primary bg-primary text-white"
                : "border-ink/10 text-ink hover:bg-ink/5"
            }`}
          >
            <Rows3 size={18} aria-hidden="true" />
            Linje for linje
          </button>
          <button
            type="button"
            onClick={() => setMode("fullscreen")}
            className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
              mode === "fullscreen"
                ? "border-primary bg-primary text-white"
                : "border-ink/10 text-ink hover:bg-ink/5"
            }`}
          >
            <Maximize size={18} aria-hidden="true" />
            Fullskjerm
          </button>
        </div>
      </div>

      {mode === "lines" ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-8 text-center">
          <p className="text-balance font-body text-4xl leading-relaxed text-ink">
            <Segments segments={renderSegments(lines[lineIndex] ?? "", answers)} />
          </p>
          <button
            type="button"
            onClick={() => (isLastLine ? undefined : setLineIndex((i) => i + 1))}
            disabled={isLastLine}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Neste linje
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto rounded-xl2 border-2 border-ink/10 bg-surface p-8">
          <p className="whitespace-pre-line font-body text-2xl leading-relaxed text-ink">
            <Segments segments={renderSegments(story.text, answers)} />
          </p>
        </div>
      )}
    </div>
  );
}

export default RevealView;
