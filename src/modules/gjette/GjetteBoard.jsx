import { WORD_LENGTH, MAX_ATTEMPTS, TILE_STATUS } from "../../lib/gjette";

const STATUS_CLASSES = {
  [TILE_STATUS.CORRECT]: "border-guess-correct bg-guess-correct text-white",
  [TILE_STATUS.PRESENT]: "border-guess-present bg-guess-present text-white",
  [TILE_STATUS.ABSENT]: "border-guess-absent bg-guess-absent text-white",
};

function Tile({ letter, status, isShaking, isRevealing, delay }) {
  const stateClasses = status
    ? STATUS_CLASSES[status]
    : letter
      ? "border-ink/40 bg-surface text-ink"
      : "border-ink/15 bg-surface text-ink";

  return (
    <span
      className={`flex h-14 w-14 items-center justify-center rounded-xl2 border-2 font-heading text-3xl font-bold uppercase transition-colors duration-300 sm:h-16 sm:w-16 ${stateClasses} ${
        isShaking ? "animate-guess-shake" : ""
      } ${isRevealing ? "animate-tile-flip" : ""}`}
      style={isRevealing ? { animationDelay: `${delay}ms` } : undefined}
    >
      {letter}
    </span>
  );
}

function GjetteBoard({ guesses, currentGuess, isShaking, revealingRow }) {
  const rows = [];

  for (let r = 0; r < MAX_ATTEMPTS; r++) {
    const submitted = guesses[r];
    const isCurrentRow = r === guesses.length;
    const letters = submitted
      ? submitted.word.split("")
      : isCurrentRow
        ? currentGuess.padEnd(WORD_LENGTH, " ").split("")
        : new Array(WORD_LENGTH).fill(" ");

    rows.push(
      <div key={r} className="flex gap-2">
        {letters.map((letter, c) => (
          <Tile
            key={c}
            letter={letter.trim()}
            status={submitted?.result[c]}
            isShaking={isCurrentRow && isShaking}
            isRevealing={submitted && r === revealingRow}
            delay={c * 180}
          />
        ))}
      </div>
    );
  }

  return <div className="flex flex-col gap-2">{rows}</div>;
}

export default GjetteBoard;
