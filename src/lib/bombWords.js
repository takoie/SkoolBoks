import { isMatureWord } from "./wordDenylist";

const SOURCES = {
  bokmal: "/bomb-words/bokmal.json",
  nynorsk: "/bomb-words/nynorsk.json",
  engelsk: "/bomb-words/english.json",
};

const cache = {};

async function loadWordList(language) {
  if (cache[language]) return cache[language];
  const url = SOURCES[language] ?? SOURCES.bokmal;
  const res = await fetch(url);
  const words = await res.json();
  cache[language] = words;
  return words;
}

export async function generateWordPack(
  language,
  count = 50,
  existing = [],
  minLength = 2,
  maxLength = 20,
  allowMatureWords = false
) {
  const words = await loadWordList(language);
  const seen = new Set(existing.map((w) => w.toLowerCase()));
  const pool = words.filter(
    (w) =>
      w.length >= minLength &&
      w.length <= maxLength &&
      !seen.has(w) &&
      (allowMatureWords || !isMatureWord(w))
  );

  const picked = [];
  const poolCopy = [...pool];
  while (picked.length < count && poolCopy.length > 0) {
    const idx = Math.floor(Math.random() * poolCopy.length);
    picked.push(poolCopy[idx]);
    poolCopy.splice(idx, 1);
  }
  return picked;
}
