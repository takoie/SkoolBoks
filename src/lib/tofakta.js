import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { mkdir, writeFile, remove, exists } from "@tauri-apps/plugin-fs";
import { readImage } from "@tauri-apps/plugin-clipboard-manager";

const IMAGE_DIR = "tofakta-images";

export function makeEmptyStatement() {
  return { id: crypto.randomUUID(), text: "", imagePath: null };
}

export function makeEmptyRound() {
  return {
    id: crypto.randomUUID(),
    heading: "",
    statements: [makeEmptyStatement(), makeEmptyStatement(), makeEmptyStatement()],
    lieIndex: 2,
  };
}

// A round is ready to present once every statement has text and exactly one
// lie is marked (lieIndex is always set, so this really just guards against
// empty statements sneaking into presentation mode).
export function isRoundComplete(round) {
  return round.statements.every((s) => s.text.trim() !== "");
}

async function imagesDir() {
  const dir = await join(await appDataDir(), IMAGE_DIR);
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

// Saves image bytes (from a file input or a clipboard paste) under the app's
// data directory and returns the absolute path to store as `imagePath`.
// Storing only the path (not the bytes) keeps the persisted Zustand store
// small regardless of how many/large the images are.
export async function saveStatementImage(bytes, extension) {
  const dir = await imagesDir();
  const filename = `${crypto.randomUUID()}.${extension}`;
  const path = await join(dir, filename);
  await writeFile(path, bytes);
  return path;
}

export async function deleteStatementImage(imagePath) {
  if (!imagePath) return;
  try {
    if (await exists(imagePath)) await remove(imagePath);
  } catch {
    // Best-effort cleanup — a missing/locked file shouldn't block editing.
  }
}

export function imageSrc(imagePath) {
  return imagePath ? convertFileSrc(imagePath) : null;
}

const EXTENSION_BY_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export function extensionForMime(mimeType) {
  return EXTENSION_BY_MIME[mimeType] ?? "png";
}

async function rgbaImageToPngBytes(image) {
  const [rgba, size] = await Promise.all([image.rgba(), image.size()]);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), size.width, size.height), 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}

// Reads an image straight from the system clipboard (screenshot, "Copy
// image" from a browser, etc). The webview's own Clipboard API
// (navigator.clipboard.read) is unreliable for images inside Tauri, so this
// goes through the Rust-backed clipboard-manager plugin instead, which reads
// the OS clipboard directly and hands back raw RGBA pixels we re-encode as
// PNG via a throwaway canvas. Throws if the clipboard has no image.
export async function readClipboardImageBytes() {
  const image = await readImage();
  const bytes = await rgbaImageToPngBytes(image);
  return { bytes, extension: "png" };
}
