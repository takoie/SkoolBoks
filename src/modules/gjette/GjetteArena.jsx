import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Shuffle, CalendarDays, RotateCcw } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { playSound } from "../../lib/sound";
import { fireConfetti } from "../../lib/confetti";
import { isMatureWord } from "../../lib/wordDenylist";
import {
  WORD_LENGTH,
  MAX_ATTEMPTS,
  LANGUAGES,
  evaluateGuess,
  isWinningResult,
  mergeLetterStatuses,
  getDailyWord,
  getRandomWord,
  todayDateString,
} from "../../lib/gjette";
import GjetteBoard from "./GjetteBoard";
import GjetteKeyboard from "./GjetteKeyboard";
import bokmalWords from "./data/bokmal.json";
import nynorskWords from "./data/nynorsk.json";
import englishWords from "./data/english.json";

// Answer pools exclude denylisted words (same filter as "Send bomben"),
// so the daily/random word is never a swear word. Guess validation below
// still accepts the full dictionary — players can guess any real word.
const WORD_LISTS = {
  bokmal: bokmalWords.filter((w) => !isMatureWord(w)),
  nynorsk: nynorskWords.filter((w) => !isMatureWord(w)),
  english: englishWords.filter((w) => !isMatureWord(w)),
};

const WORD_SETS = {
  bokmal: new Set(bokmalWords),
  nynorsk: new Set(nynorskWords),
  english: new Set(englishWords),
};

const SHAKE_DURATION = 500;

function GjetteArena() {
  const language = useAppStore((s) => s.settings.gjetteLanguage);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const setSettings = useAppStore((s) => s.setSettings);

  const [mode, setMode] = useState("daily");
  const [answer, setAnswer] = useState(() =>
    getDailyWord(WORD_LISTS[language], language)
  );
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState("playing");
  const [isShaking, setIsShaking] = useState(false);
  const [message, setMessage] = useState("");
  const [revealingRow, setRevealingRow] = useState(-1);
  const [showResult, setShowResult] = useState(false);

  const wordList = WORD_LISTS[language];
  const wordSet = WORD_SETS[language];

  function startNewGame(nextMode, nextLanguage) {
    const list = WORD_LISTS[nextLanguage];
    const nextAnswer =
      nextMode === "daily"
        ? getDailyWord(list, nextLanguage, todayDateString())
        : getRandomWord(list, answer);
    setAnswer(nextAnswer);
    setGuesses([]);
    setCurrentGuess("");
    setStatus("playing");
    setMessage("");
    setShowResult(false);
    setRevealingRow(-1);
  }

  function handleLanguageChange(nextLanguage) {
    if (nextLanguage === language) return;
    setSettings({ gjetteLanguage: nextLanguage });
    startNewGame(mode, nextLanguage);
  }

  function handleModeChange(nextMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    startNewGame(nextMode, language);
  }

  function triggerShake(msg) {
    setMessage(msg);
    setIsShaking(true);
    playSound("tick", soundEnabled);
    setTimeout(() => {
      setIsShaking(false);
      setMessage("");
    }, SHAKE_DURATION);
  }

  const submitGuess = useCallback(() => {
    if (status !== "playing") return;
    if (currentGuess.length !== WORD_LENGTH) {
      triggerShake(`Ordet må ha ${WORD_LENGTH} bokstaver`);
      return;
    }
    if (!wordSet.has(currentGuess)) {
      triggerShake("Ikke i ordlisten");
      return;
    }

    const result = evaluateGuess(currentGuess, answer);
    const nextGuesses = [...guesses, { word: currentGuess, result }];
    const rowIndex = nextGuesses.length - 1;

    setGuesses(nextGuesses);
    setCurrentGuess("");
    setRevealingRow(rowIndex);

    const won = isWinningResult(result);
    const lost = !won && nextGuesses.length === MAX_ATTEMPTS;

    setTimeout(() => {
      if (won) {
        setStatus("won");
        playSound("tada", soundEnabled);
        fireConfetti();
        setShowResult(true);
      } else if (lost) {
        setStatus("lost");
        playSound("ding", soundEnabled);
        setShowResult(true);
      } else {
        playSound("ding", soundEnabled);
      }
    }, WORD_LENGTH * 180 + 300);
  }, [status, currentGuess, wordSet, answer, guesses, soundEnabled]);

  const handleKey = useCallback(
    (key) => {
      if (status !== "playing") return;
      if (key === "enter") {
        submitGuess();
      } else if (key === "backspace") {
        setCurrentGuess((g) => g.slice(0, -1));
      } else if (currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((g) => g + key);
      }
    },
    [status, currentGuess, submitGuess]
  );

  useEffect(() => {
    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLocaleLowerCase("no");
      if (key === "enter") {
        handleKey("enter");
      } else if (key === "backspace") {
        handleKey("backspace");
      } else if (/^[a-zæøå]$/.test(key)) {
        handleKey(key);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const letterStatuses = useMemo(() => {
    return guesses.reduce(
      (acc, g) => mergeLetterStatuses(acc, g.word, g.result),
      {}
    );
  }, [guesses]);

  return (
    <div className="relative w-full">
      <div className="absolute top-0 left-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-start gap-2">
          {Object.entries(LANGUAGES).map(([code, { label }]) => (
            <button
              key={code}
              type="button"
              onClick={() => handleLanguageChange(code)}
              className={`min-h-touch cursor-pointer rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
                language === code
                  ? "border-primary bg-primary text-white"
                  : "border-ink/10 bg-surface text-ink hover:bg-primary/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2">
          <button
            type="button"
            onClick={() => handleModeChange("daily")}
            className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
              mode === "daily"
                ? "border-secondary bg-secondary text-white"
                : "border-ink/10 bg-surface text-ink hover:bg-secondary/10"
            }`}
          >
            <CalendarDays size={20} aria-hidden="true" />
            Dagens ord
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("free")}
            className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
              mode === "free"
                ? "border-secondary bg-secondary text-white"
                : "border-ink/10 bg-surface text-ink hover:bg-secondary/10"
            }`}
          >
            <Shuffle size={20} aria-hidden="true" />
            Fri lek
          </button>
          {mode === "free" && (
            <button
              type="button"
              onClick={() => startNewGame("free", language)}
              className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-heading font-semibold text-ink transition-colors hover:bg-primary/10"
            >
              <RotateCcw size={20} aria-hidden="true" />
              Nytt ord
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-fit flex-col items-center text-center">
        <h2 className="mb-2 font-heading text-3xl font-semibold text-ink">
          GjettE
        </h2>
        <p className="mb-6 text-lg text-ink/70">
          Gjett {WORD_LENGTH}-bokstavsordet på {MAX_ATTEMPTS} forsøk.
        </p>

        <div className="mb-4 h-6 font-heading text-lg font-semibold text-destructive">
          {message}
        </div>

        <div className="mb-8">
          <GjetteBoard
            guesses={guesses}
            currentGuess={currentGuess}
            isShaking={isShaking}
            revealingRow={revealingRow}
          />
        </div>

        <GjetteKeyboard
          language={language}
          letterStatuses={letterStatuses}
          onKey={handleKey}
          disabled={status !== "playing"}
        />
      </div>

      {showResult &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
            onClick={() => setShowResult(false)}
          >
            <div
              className="w-full max-w-md rounded-xl2 bg-surface p-8 text-center shadow-clay animate-modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-2 font-heading text-3xl font-bold text-ink">
                {status === "won" ? "Riktig!" : "Ikke denne gangen"}
              </p>
              <p className="mb-8 break-words font-heading text-2xl font-semibold text-primary uppercase">
                {answer}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => startNewGame(mode, language)}
                  className="flex min-h-touch cursor-pointer items-center justify-center gap-3 rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
                >
                  {mode === "daily" ? "Spill dagens ord igjen" : "Nytt ord"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResult(false)}
                  className="flex min-h-touch cursor-pointer items-center justify-center gap-3 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default GjetteArena;
