import { useRef, useState } from "react";
import { ImagePlus, ClipboardPaste, X } from "lucide-react";
import {
  saveStatementImage,
  deleteStatementImage,
  readClipboardImageBytes,
  imageSrc,
  extensionForMime,
} from "../../lib/tofakta";

async function fileToBytes(file) {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

function StatementField({ statement, isLie, onChangeText, onSetLie, onImageChange }) {
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [pasteError, setPasteError] = useState(false);

  async function replaceImage(bytes, extension) {
    setSaving(true);
    try {
      const path = await saveStatementImage(bytes, extension);
      const previous = statement.imagePath;
      onImageChange(path);
      if (previous) deleteStatementImage(previous);
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const bytes = await fileToBytes(file);
    await replaceImage(bytes, extensionForMime(file.type));
  }

  // Native Ctrl+V while the text field is focused — a bonus path that works
  // when the webview's own clipboard event happens to carry the image data.
  // The "Lim inn bilde"-button below is the reliable path (goes through
  // Tauri's clipboard plugin) so this isn't the only way in.
  async function handlePaste(e) {
    const item = Array.from(e.clipboardData?.items ?? []).find((it) =>
      it.type.startsWith("image/")
    );
    if (!item) return;
    e.preventDefault();
    const blob = item.getAsFile();
    if (!blob) return;
    setPasteError(false);
    const bytes = await fileToBytes(blob);
    await replaceImage(bytes, extensionForMime(item.type));
  }

  async function handlePasteButton() {
    setPasteError(false);
    setSaving(true);
    try {
      const { bytes, extension } = await readClipboardImageBytes();
      await replaceImage(bytes, extension);
    } catch {
      setPasteError(true);
    } finally {
      setSaving(false);
    }
  }

  function handleRemoveImage() {
    if (statement.imagePath) deleteStatementImage(statement.imagePath);
    onImageChange(null);
  }

  return (
    <div
      onPaste={handlePaste}
      className={`flex flex-col gap-3 rounded-xl2 border-2 p-4 transition-colors ${
        isLie ? "border-destructive/40 bg-destructive/5" : "border-ink/10 bg-surface"
      }`}
    >
      <label className="flex cursor-pointer items-center gap-2 font-body text-sm font-semibold text-ink/70">
        <input
          type="radio"
          checked={isLie}
          onChange={onSetLie}
          className="h-5 w-5 cursor-pointer accent-destructive"
        />
        Dette er løgnen
      </label>

      <textarea
        value={statement.text}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder="Skriv en påstand…"
        rows={3}
        className="w-full resize-none rounded-xl2 border-2 border-ink/10 bg-background p-3 font-body text-lg text-ink outline-none transition-colors focus:border-primary"
      />

      {statement.imagePath ? (
        <div className="relative">
          <img
            src={imageSrc(statement.imagePath)}
            alt=""
            className="max-h-48 w-full rounded-xl2 object-contain"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            aria-label="Fjern bilde"
            className="absolute right-2 top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-ink/70 text-white transition-colors hover:bg-destructive"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="flex min-h-touch flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-ink/20 px-4 py-3 font-body text-base text-ink/60 transition-colors hover:border-primary/40 hover:text-ink disabled:cursor-wait disabled:opacity-60"
            >
              <ImagePlus size={20} aria-hidden="true" />
              Last opp fil
            </button>
            <button
              type="button"
              onClick={handlePasteButton}
              disabled={saving}
              className="flex min-h-touch flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-ink/20 px-4 py-3 font-body text-base text-ink/60 transition-colors hover:border-primary/40 hover:text-ink disabled:cursor-wait disabled:opacity-60"
            >
              <ClipboardPaste size={20} aria-hidden="true" />
              {saving ? "Henter…" : "Lim inn bilde"}
            </button>
          </div>
          {pasteError && (
            <p className="text-sm text-destructive">
              Fant ikke noe bilde på utklippstavlen. Kopier et bilde først, og trykk «Lim inn bilde».
            </p>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

export default StatementField;
