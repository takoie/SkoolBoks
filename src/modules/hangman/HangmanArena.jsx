import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Shuffle,
  UserCog,
  RotateCcw,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { playSound } from "../../lib/sound";
import { fireConfetti } from "../../lib/confetti";
import Select from "../../components/Select";
import HangmanFigure from "../../components/hangman/HangmanFigure";
import HangmanKeyboard from "./HangmanKeyboard";
import {
  LANGUAGES,
  alphabetForLanguage,
  isGuessableChar,
  isLetterGuessed,
  getGameStatus,
  getMaxWrongGuesses,
  getRandomHangmanWord,
} from "../../lib/hangman";

const LANGUAGE_OPTIONS = Object.entries(LANGUAGES).map(([value, { label }]) => ({
  value,
  label,
}));

function HangmanArena() {
  const hangman = useAppStore((s) => s.hangman);
  const setHangmanSettings = useAppStore((s) => s.setHangmanSettings);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  const [source, setSource] = useState("random"); // "random" | "gamehost"
  const [word, setWord] = useState(null);
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [gamehostDraft, setGamehostDraft] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const maxWrongGuesses = getMaxWrongGuesses(hangman);
  const status = word ? getGameStatus(word, guessedLetters, wrongCount, maxWrongGuesses) : "idle";

  function resetRound() {
    setWord(null);
    setGuessedLetters([]);
    setWrongCount(0);
    setLoadError(null);
    setShowResult(false);
  }

  function changeSource(nextSource) {
    if (nextSource === source) return;
    setSource(nextSource);
    resetRound();
  }

  async function startRandomRound() {
    setLoading(true);
    setLoadError(null);
    try {
      const nextWord = await getRandomHangmanWord(hangman.language, {
        minLength: hangman.wordMinLength,
        maxLength: hangman.wordMaxLength,
        allowMatureWords: hangman.allowMatureWords,
        exclude: word ? [word] : [],
      });
      if (!nextWord) {
        setLoadError(
          "Fant ingen ord som matcher filtrene. Prøv å justere ordlengden i innstillingene."
        );
        return;
      }
      setWord(nextWord);
      setGuessedLetters([]);
      setWrongCount(0);
      setShowResult(false);
    } finally {
      setLoading(false);
    }
  }

  function startGamehostRound(e) {
    e.preventDefault();
    const trimmed = gamehostDraft.trim();
    if (!trimmed) return;
    setWord(trimmed);
    setGuessedLetters([]);
    setWrongCount(0);
    setShowResult(false);
    setGamehostDraft("");
  }

  function handleGuess(letter) {
    if (status !== "playing" || !word) return;
    const upper = letter.toUpperCase();
    if (isLetterGuessed(upper, guessedLetters)) return;

    const nextGuessed = [...guessedLetters, upper];
    const correct = word.toUpperCase().includes(upper);
    const nextWrong = correct ? wrongCount : wrongCount + 1;

    setGuessedLetters(nextGuessed);
    setWrongCount(nextWrong);
    playSound("tick", soundEnabled);

    const nextStatus = getGameStatus(word, nextGuessed, nextWrong, maxWrongGuesses);
    if (nextStatus === "won") {
      playSound("tada", soundEnabled);
      fireConfetti();
      setShowResult(true);
    } else if (nextStatus === "lost") {
      playSound("ding", soundEnabled);
      setShowResult(true);
    }
  }

  useEffect(() => {
    if (status !== "playing") return;
    const alphabet = alphabetForLanguage(hangman.language);
    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLocaleUpperCase("no");
      if (alphabet.includes(key)) handleGuess(key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, guessedLetters, wrongCount, word, hangman.language]);

  const remaining = maxWrongGuesses - wrongCount;

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
      {showSettings && (
        <aside className="w-full shrink-0 rounded-xl2 border-2 border-ink/10 bg-surface p-5 text-left shadow-clay lg:w-72">
          <h3 className="mb-4 font-heading text-xl font-semibold text-ink">
            Innstillinger
          </h3>
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 font-heading text-base font-semibold text-ink">Ordkilde</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => changeSource("random")}
                  className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
                    source === "random"
                      ? "border-primary bg-primary text-white"
                      : "border-ink/10 bg-surface text-ink hover:bg-primary/10"
                  }`}
                >
                  <Shuffle size={18} aria-hidden="true" />
                  Tilfeldig ord
                </button>
                <button
                  type="button"
                  onClick={() => changeSource("gamehost")}
                  className={`flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 px-4 py-2 font-heading font-semibold transition-colors ${
                    source === "gamehost"
                      ? "border-secondary bg-secondary text-white"
                      : "border-ink/10 bg-surface text-ink hover:bg-secondary/10"
                  }`}
                >
                  <UserCog size={18} aria-hidden="true" />
                  Gamehost skriver inn ord
                </button>
              </div>
            </div>

            {source === "random" && (
              <div className="flex flex-col items-start gap-3">
                <label className="flex flex-col gap-1 font-body text-base text-ink">
                  Språk
                  <Select
                    value={hangman.language}
                    onChange={(value) => setHangmanSettings({ language: value })}
                    ariaLabel="Velg språk for tilfeldig ord"
                    options={LANGUAGE_OPTIONS}
                    className="min-h-touch w-full rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 font-body text-base text-ink">
                  Min. lengde
                  <input
                    type="number"
                    min={2}
                    max={hangman.wordMaxLength}
                    value={hangman.wordMinLength}
                    onChange={(e) =>
                      setHangmanSettings({ wordMinLength: Number(e.target.value) })
                    }
                    className="min-h-touch w-24 rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 font-body text-base text-ink">
                  Maks. lengde
                  <input
                    type="number"
                    min={hangman.wordMinLength}
                    max={20}
                    value={hangman.wordMaxLength}
                    onChange={(e) =>
                      setHangmanSettings({ wordMaxLength: Number(e.target.value) })
                    }
                    className="min-h-touch w-24 rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-2"
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2 font-body text-base text-ink">
                  <input
                    type="checkbox"
                    checked={hangman.allowMatureWords}
                    onChange={(e) =>
                      setHangmanSettings({ allowMatureWords: e.target.checked })
                    }
                    className="h-5 w-5 accent-destructive"
                  />
                  Tillat uønskede ord
                </label>
              </div>
            )}

            <div>
              <p className="mb-2 font-heading text-base font-semibold text-ink">
                Flere gjettinger
              </p>
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 font-body text-base text-ink">
                  <input
                    type="checkbox"
                    checked={hangman.extraHandsFeet}
                    onChange={(e) =>
                      setHangmanSettings({ extraHandsFeet: e.target.checked })
                    }
                    className="h-5 w-5 accent-primary"
                  />
                  Hender og føtter (+4 forsøk)
                </label>
                <label className="flex cursor-pointer items-center gap-2 font-body text-base text-ink">
                  <input
                    type="checkbox"
                    checked={hangman.extraFace}
                    onChange={(e) => setHangmanSettings({ extraFace: e.target.checked })}
                    className="h-5 w-5 accent-primary"
                  />
                  Øyne, nese og munn (+3 forsøk)
                </label>
              </div>
            </div>

            {source === "gamehost" && (
              <p className="font-body text-sm text-ink/60">
                Skriv inn ordet nede på siden og trykk «Skjul ordet og start» —
                ordet vises aldri på skjermen før spillets slutt.
              </p>
            )}
          </div>
        </aside>
      )}

      <div className="flex w-full flex-1 flex-col gap-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            aria-label={showSettings ? "Skjul innstillinger" : "Vis innstillinger"}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
          >
            {showSettings ? (
              <PanelLeftClose size={22} aria-hidden="true" />
            ) : (
              <PanelLeftOpen size={22} aria-hidden="true" />
            )}
          </button>
          <h2 className="font-heading text-2xl font-semibold text-ink">Hangman</h2>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
        {!word && source === "random" && (
          <div className="flex flex-col items-center gap-3">
            {loadError && (
              <p className="font-body text-base text-destructive">{loadError}</p>
            )}
            <button
              type="button"
              onClick={startRandomRound}
              disabled={loading}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 bg-primary px-8 py-4 font-heading text-2xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Shuffle size={22} aria-hidden="true" />
              {loading ? "Henter ord…" : "Start runde"}
            </button>
          </div>
        )}

        {!word && source === "gamehost" && (
          <form onSubmit={startGamehostRound} className="flex w-full flex-col gap-3">
            <label className="flex flex-col gap-1 text-left font-body text-base text-ink">
              Ordet som skal gjettes
              <input
                type="text"
                value={gamehostDraft}
                onChange={(e) => setGamehostDraft(e.target.value)}
                placeholder="Skriv inn ordet her"
                autoComplete="off"
                spellCheck="false"
                className="min-h-touch w-full rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-heading text-xl tracking-wide"
              />
            </label>
            <button
              type="submit"
              disabled={!gamehostDraft.trim()}
              className="flex min-h-touch cursor-pointer items-center justify-center gap-3 rounded-xl2 bg-secondary px-8 py-4 font-heading text-xl font-semibold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Lock size={20} aria-hidden="true" />
              Skjul ordet og start
            </button>
          </form>
        )}

        {word && (
          <>
            <div className="w-full" style={{ maxWidth: 338, aspectRatio: "1 / 1" }}>
              <HangmanFigure
                wrongCount={wrongCount}
                extraHandsFeet={hangman.extraHandsFeet}
                extraFace={hangman.extraFace}
              />
            </div>

            <p className="font-body text-lg text-ink/70">
              {status === "playing"
                ? `${remaining} feil igjen`
                : status === "won"
                  ? "Gjettet riktig!"
                  : "Hengemannen er ferdig tegnet"}
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {word.split("").map((char, i) => {
                if (char === " ") return <span key={i} className="w-4" aria-hidden="true" />;
                const guessable = isGuessableChar(char);
                const revealed =
                  !guessable ||
                  isLetterGuessed(char, guessedLetters) ||
                  status !== "playing";
                return (
                  <span
                    key={i}
                    className="flex h-[62px] w-[47px] items-end justify-center border-b-4 border-ink/30 pb-1 font-heading text-[39px] font-bold uppercase text-ink sm:h-[73px] sm:w-[57px] sm:text-[47px]"
                  >
                    {revealed ? char.toUpperCase() : ""}
                  </span>
                );
              })}
            </div>

            <HangmanKeyboard
              language={hangman.language}
              word={word}
              guessedLetters={guessedLetters}
              onGuess={handleGuess}
              disabled={status !== "playing"}
            />

            {status !== "playing" && (
              <button
                type="button"
                onClick={source === "random" ? startRandomRound : resetRound}
                className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl2 border-2 border-ink/10 px-8 py-4 font-heading text-xl font-semibold text-ink transition-all duration-150 hover:bg-ink/5 active:scale-[0.97]"
              >
                <RotateCcw size={20} aria-hidden="true" />
                {source === "random" ? "Nytt ord" : "Nytt ord fra gamehost"}
              </button>
            )}

            {status === "playing" && (
              <button
                type="button"
                onClick={resetRound}
                className="font-body text-sm text-ink/50 underline decoration-dotted hover:text-ink"
              >
                Avbryt runden
              </button>
            )}
          </>
        )}
        </div>
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
                {status === "won" ? "Riktig!" : "Bang! Hengemannen vant"}
              </p>
              <p className="mb-8 break-words font-heading text-2xl font-semibold text-primary uppercase">
                {word}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResult(false);
                    if (source === "random") startRandomRound();
                    else resetRound();
                  }}
                  className="flex min-h-touch cursor-pointer items-center justify-center gap-3 rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
                >
                  {source === "random" ? "Nytt ord" : "Nytt ord fra gamehost"}
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

export default HangmanArena;
