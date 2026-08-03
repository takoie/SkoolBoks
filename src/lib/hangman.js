import { generateWordPack } from "./bombWords";

export const BASE_MAX_WRONG_GUESSES = 6;
export const EXTRA_HANDS_FEET_GUESSES = 4;
export const EXTRA_FACE_GUESSES = 3;

export function getMaxWrongGuesses({ extraHandsFeet = false, extraFace = false } = {}) {
  return (
    BASE_MAX_WRONG_GUESSES +
    (extraHandsFeet ? EXTRA_HANDS_FEET_GUESSES : 0) +
    (extraFace ? EXTRA_FACE_GUESSES : 0)
  );
}

export const LANGUAGES = {
  bokmal: { label: "Bokmål" },
  nynorsk: { label: "Nynorsk" },
  engelsk: { label: "Engelsk" },
};

export const NORWEGIAN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ".split("");
export const ENGLISH_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function alphabetForLanguage(language) {
  return language === "engelsk" ? ENGLISH_ALPHABET : NORWEGIAN_ALPHABET;
}

// Words are letters-only in the bundled dictionaries, but stay defensive
// about anything a gamehost types in by hand (spaces, hyphens, punctuation).
export function isGuessableChar(char) {
  return /[a-zæøåA-ZÆØÅ]/.test(char);
}

export function isLetterGuessed(letter, guessedLetters) {
  return guessedLetters.includes(letter.toUpperCase());
}

export function isWordSolved(word, guessedLetters) {
  return word
    .toUpperCase()
    .split("")
    .every((char) => !isGuessableChar(char) || isLetterGuessed(char, guessedLetters));
}

export function getGameStatus(word, guessedLetters, wrongCount, maxWrongGuesses) {
  if (wrongCount >= maxWrongGuesses) return "lost";
  if (word && isWordSolved(word, guessedLetters)) return "won";
  return "playing";
}

// Pulls a single random word from the same filtered, denylist-checked
// dictionaries the "Send bomben" module uses, so language selection and
// mature-word filtering behave identically across both games.
export async function getRandomHangmanWord(
  language,
  { minLength = 3, maxLength = 12, allowMatureWords = false, exclude = [] } = {}
) {
  const picked = await generateWordPack(
    language,
    1,
    exclude,
    minLength,
    maxLength,
    allowMatureWords
  );
  return picked[0] ?? null;
}
