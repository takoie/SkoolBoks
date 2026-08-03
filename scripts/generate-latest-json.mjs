// Generates src-tauri/target/release/bundle/nsis/latest.json for the Tauri
// updater from the NSIS installer + .sig that `npm run build` just produced.
// Run after a signed build: `node scripts/generate-latest-json.mjs`
// Optional: pass release notes as the first CLI arg, e.g.
//   node scripts/generate-latest-json.mjs "Fixed the spin wheel bug"
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONF_PATH = path.join(ROOT, "src-tauri", "tauri.conf.json");
const BUNDLE_DIR = path.join(ROOT, "src-tauri", "target", "release", "bundle", "nsis");

const conf = JSON.parse(await readFile(CONF_PATH, "utf8"));
const { version, productName } = conf;
const endpoint = conf.plugins?.updater?.endpoints?.[0];
if (!endpoint) {
  throw new Error("No plugins.updater.endpoints[0] found in tauri.conf.json");
}
const releaseBaseUrl = endpoint.replace(/\/latest\.json$/, "");

const exeName = `${productName}_${version}_x64-setup.exe`;
const exePath = path.join(BUNDLE_DIR, exeName);
const sigPath = `${exePath}.sig`;

let signature;
try {
  signature = (await readFile(sigPath, "utf8")).trim();
} catch {
  throw new Error(
    `Could not find ${sigPath}. Build with the signing env vars set first: npm run build (with TAURI_SIGNING_PRIVATE_KEY / _PASSWORD exported).`
  );
}

const notes = process.argv[2] ?? "Se CHANGELOG.md";

const manifest = {
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature,
      url: `${releaseBaseUrl}/${exeName}`,
    },
  },
};

const outPath = path.join(BUNDLE_DIR, "latest.json");
await writeFile(outPath, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`Upload to the GitHub release: ${exePath}, ${sigPath}, and ${outPath}`);
