// Curated denylist of Norwegian and English swear words/sexual terms, used
// to filter the bundled dictionary dumps (which are raw lexicon exports with
// no content moderation of their own) before they reach a classroom game.
// Whole-word matching only — not a substring filter — to avoid false
// positives on innocuous words that merely contain a blocked substring.
// This list is a best-effort baseline, not exhaustive; teachers can opt back
// in via the "allow unwanted words" setting for older students.
//
// The words are stored base64-encoded rather than as plain string literals
// so they don't show up verbatim if someone greps or full-text-searches the
// installed app's files on disk. This is obfuscation, not real encryption —
// anyone opening devtools or decoding the base64 by hand can still read the
// list — it only stops the words from turning up as plaintext hits in a
// casual filesystem search.

const ENCODED_NORWEGIAN =
  "WyJmYWVuIiwiZmFlbnNrYXAiLCJqw6Z2bGEiLCJqw6Z2bGlnIiwiasOmdmVsIiwiZHJpdHQiLCJkcml0dHNla2siLCJkcml0dHVuZ2UiLCJrdWsiLCJrdWtzdWdlciIsImZpdHRlIiwiZml0dGEiLCJwaWtrIiwicsOmdiIsInLDpnZhIiwicnVtcGVodWxsIiwicHVsZSIsInB1bGluZyIsImtudWxsZSIsImtudWxsaW5nIiwiaG9yZSIsImhvcnVuZ2UiLCJtZWdnZSIsIm1lZ2dlciIsImvDuGRkIiwiaG9tb2ZpbCIsInBvcm5vIiwicG9ybm9ncmFmaSIsIm9uYW5pIiwib25hbmVyZSIsIm9yZ2FzbWUiLCJzw6ZkIiwic3Blcm0iLCJrbGl0b3JpcyIsInZhZ2luYSIsInBlbmlzIiwicHVwcGUiLCJwYXR0ZSIsInB1cHBlciIsInBhdHRlciJd";

const ENCODED_ENGLISH =
  "WyJmdWNrIiwiZnVja2luZyIsImZ1Y2tlciIsInNoaXQiLCJzaGl0dHkiLCJjdW50IiwiZGljayIsImRpY2toZWFkIiwicHVzc3kiLCJjb2NrIiwiYml0Y2giLCJiYXN0YXJkIiwid2hvcmUiLCJzbHV0IiwiYXNzaG9sZSIsImFzcyIsImRhbW4iLCJuaWdnZXIiLCJmYWdnb3QiLCJyZXRhcmQiLCJwb3JuIiwicG9ybm8iLCJwb3Jub2dyYXBoeSIsInNleCIsInNleHkiLCJwZW5pcyIsInZhZ2luYSIsImJvb2JzIiwidGl0cyIsIm9yZ2FzbSIsIm1hc3R1cmJhdGUiLCJtYXN0dXJiYXRpb24iLCJibG93am9iIiwiaGFuZGpvYiIsImN1bSIsInNlbWVuIiwiaG9ybnkiLCJyYXBlIl0=";

function decode(base64) {
  return JSON.parse(atob(base64));
}

export const WORD_DENYLIST = new Set([
  ...decode(ENCODED_NORWEGIAN),
  ...decode(ENCODED_ENGLISH),
]);

export function isMatureWord(word) {
  return WORD_DENYLIST.has(word.toLowerCase());
}
