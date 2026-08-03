// One-off fetch: downloads Bokmål, Nynorsk and English wordlists from their
// upstream repos, filters to exactly-5-letter single words, and writes them
// as JSON arrays into src/modules/gjette/data/. Re-run manually if the
// upstream lists are updated — the game itself never hits the network.
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "src", "modules", "gjette", "data");

const NORWEGIAN_LETTER_RE = /^[a-zA-ZæøåÆØÅ]{5}$/;
const ENGLISH_LETTER_RE = /^[a-zA-Z]{5}$/;

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function filterWords(text, re) {
  const seen = new Set();
  for (const rawLine of text.split("\n")) {
    const word = rawLine.trim();
    if (!word || !re.test(word)) continue;
    seen.add(word.toLocaleLowerCase("no"));
  }
  return [...seen].sort();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const [nob, nno, enRaw] = await Promise.all([
    fetchText(
      "https://raw.githubusercontent.com/Ondkloss/norwegian-wordlist/master/wordlist_20220201_norsk_ordbank_nob_2005.txt"
    ),
    fetchText(
      "https://raw.githubusercontent.com/Ondkloss/norwegian-wordlist/master/wordlist_20220201_norsk_ordbank_nno_2012.txt"
    ),
    fetchText(
      "https://raw.githubusercontent.com/darkermango/5-Letter-words/master/words.txt"
    ),
  ]);

  const bokmal = filterWords(nob, NORWEGIAN_LETTER_RE);
  const nynorsk = filterWords(nno, NORWEGIAN_LETTER_RE);
  const english = filterWords(enRaw, ENGLISH_LETTER_RE).map((w) =>
    w.toLowerCase()
  );

  await writeFile(
    path.join(OUT_DIR, "bokmal.json"),
    JSON.stringify(bokmal),
    "utf-8"
  );
  await writeFile(
    path.join(OUT_DIR, "nynorsk.json"),
    JSON.stringify(nynorsk),
    "utf-8"
  );
  await writeFile(
    path.join(OUT_DIR, "english.json"),
    JSON.stringify(english),
    "utf-8"
  );

  console.log(`bokmal: ${bokmal.length} words`);
  console.log(`nynorsk: ${nynorsk.length} words`);
  console.log(`english: ${english.length} words`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
