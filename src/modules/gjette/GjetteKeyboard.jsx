import { Delete, CornerDownLeft } from "lucide-react";
import { TILE_STATUS } from "../../lib/gjette";

const NORWEGIAN_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "å"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ø", "æ"],
  ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
];

const ENGLISH_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
];

const STATUS_CLASSES = {
  [TILE_STATUS.CORRECT]: "bg-guess-correct text-white",
  [TILE_STATUS.PRESENT]: "bg-guess-present text-white",
  [TILE_STATUS.ABSENT]: "bg-guess-absent text-white",
};

function GjetteKeyboard({ language, letterStatuses, onKey, disabled }) {
  const rows = language === "english" ? ENGLISH_ROWS : NORWEGIAN_ROWS;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, r) => (
        <div key={r} className="flex justify-center gap-1.5">
          {row.map((key) => {
            if (key === "enter" || key === "backspace") {
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onKey(key)}
                  className="flex min-h-touch min-w-16 cursor-pointer items-center justify-center rounded-xl2 border-2 border-ink/10 bg-surface px-3 font-heading text-sm font-semibold text-ink transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={key === "enter" ? "Send inn" : "Slett"}
                >
                  {key === "enter" ? (
                    <CornerDownLeft size={20} aria-hidden="true" />
                  ) : (
                    <Delete size={20} aria-hidden="true" />
                  )}
                </button>
              );
            }

            const status = letterStatuses[key];
            const stateClasses = status
              ? STATUS_CLASSES[status]
              : "bg-surface text-ink hover:bg-primary/10";

            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onKey(key)}
                className={`flex min-h-touch min-w-9 cursor-pointer items-center justify-center rounded-xl2 border-2 border-ink/10 px-2 font-heading text-lg font-bold uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${stateClasses}`}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default GjetteKeyboard;
