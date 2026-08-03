export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

export const LANGUAGES = {
  bokmal: { label: "Bokmål" },
  nynorsk: { label: "Nynorsk" },
  english: { label: "English" },
};

export const TILE_STATUS = {
  CORRECT: "correct",
  PRESENT: "present",
  ABSENT: "absent",
};

// Simple 32-bit string hash (djb2), deterministic across runs/platforms.
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

export function todayDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Deterministic word-of-the-day: same date + language always yields the same
// word for every player, without needing a server.
export function getDailyWord(wordList, language, dateStr = todayDateString()) {
  const hash = hashString(`${language}:${dateStr}`);
  return wordList[hash % wordList.length];
}

export function getRandomWord(wordList, excludeWord = null) {
  if (wordList.length <= 1) return wordList[0];
  let word = excludeWord;
  while (word === excludeWord) {
    word = wordList[Math.floor(Math.random() * wordList.length)];
  }
  return word;
}

// Classic two-pass Wordle evaluation: exact-position matches first, then
// leftover letters get PRESENT on a first-come-first-served basis so
// duplicate letters in the guess never over-count matches in the answer.
export function evaluateGuess(guess, answer) {
  const result = new Array(WORD_LENGTH).fill(TILE_STATUS.ABSENT);
  const answerLetters = answer.split("");
  const remaining = {};

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answerLetters[i]) {
      result[i] = TILE_STATUS.CORRECT;
    } else {
      remaining[answerLetters[i]] = (remaining[answerLetters[i]] ?? 0) + 1;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === TILE_STATUS.CORRECT) continue;
    const letter = guess[i];
    if (remaining[letter] > 0) {
      result[i] = TILE_STATUS.PRESENT;
      remaining[letter] -= 1;
    }
  }

  return result;
}

export function isWinningResult(result) {
  return result.every((status) => status === TILE_STATUS.CORRECT);
}

// Merges a tile status into a running best-status-per-letter map, used to
// color the on-screen keyboard. CORRECT always wins, then PRESENT, then
// ABSENT, matching Wordle's usual keyboard-coloring priority.
export function mergeLetterStatuses(current, guess, result) {
  const next = { ...current };
  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i];
    const status = result[i];
    const existing = next[letter];
    if (existing === TILE_STATUS.CORRECT) continue;
    if (status === TILE_STATUS.CORRECT || existing === undefined) {
      next[letter] = status;
    } else if (status === TILE_STATUS.PRESENT && existing === TILE_STATUS.ABSENT) {
      next[letter] = status;
    }
  }
  return next;
}
