import { alphabetForLanguage, isLetterGuessed } from "../../lib/hangman";

function HangmanKeyboard({ language, word, guessedLetters, onGuess, disabled }) {
  const alphabet = alphabetForLanguage(language);
  const upperWord = word?.toUpperCase() ?? "";

  return (
    <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Bokstaver">
      {alphabet.map((letter) => {
        const guessed = isLetterGuessed(letter, guessedLetters);
        const correct = guessed && upperWord.includes(letter);
        const wrong = guessed && !correct;

        const stateClasses = correct
          ? "bg-guess-correct text-white border-guess-correct"
          : wrong
            ? "bg-guess-absent text-white border-guess-absent"
            : "border-ink/10 bg-surface text-ink hover:bg-primary/10";

        return (
          <button
            key={letter}
            type="button"
            disabled={disabled || guessed}
            onClick={() => onGuess(letter)}
            aria-pressed={guessed}
            className={`flex min-h-touch min-w-10 cursor-pointer items-center justify-center rounded-xl2 border-2 px-2 font-heading text-lg font-bold uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${stateClasses}`}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}

export default HangmanKeyboard;
