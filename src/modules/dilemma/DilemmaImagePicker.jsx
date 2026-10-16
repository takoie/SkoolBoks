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

export function DilemmaImagePicker({ imagePath, onImageChange, accentColor = "cyan" }) {
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [pasteError, setPasteError] = useState(false);

  async function replaceImage(bytes, extension) {
    setSaving(true);
    try {
      const path = await saveStatementImage(bytes, extension);
      const previous = imagePath;
      onImageChange(path);
      if (previous) deleteStatementImage(previous);
    } catch (e) {
      console.error("Feil ved lagring av bilde:", e);
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
    if (imagePath) deleteStatementImage(imagePath);
    onImageChange("");
  }

  const borderClass = accentColor === "cyan" ? "border-cyan-500/30" : "border-amber-500/30";

  return (
    <div onPaste={handlePaste} className="space-y-2">
      <label className="block font-heading text-xs text-ink/60">
        Bilde (Valgfritt)
      </label>

      {imagePath ? (
        <div className="relative inline-block overflow-hidden rounded-xl border-2 border-ink/10 bg-black/10">
          <img
            src={imageSrc(imagePath)}
            alt="Valgt bilde"
            className="max-h-36 max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            aria-label="Fjern bilde"
            className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive shadow-md"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-dashed ${borderClass} bg-surface px-3 py-2 text-xs font-heading font-semibold text-ink/70 hover:border-primary hover:text-ink disabled:opacity-50`}
            >
              <ImagePlus size={16} aria-hidden="true" />
              <span>Last opp bilde</span>
            </button>

            <button
              type="button"
              onClick={handlePasteButton}
              disabled={saving}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-dashed ${borderClass} bg-surface px-3 py-2 text-xs font-heading font-semibold text-ink/70 hover:border-primary hover:text-ink disabled:opacity-50`}
            >
              <ClipboardPaste size={16} aria-hidden="true" />
              <span>{saving ? "Henter..." : "Lim inn bilde"}</span>
            </button>
          </div>

          {pasteError && (
            <p className="text-xs text-destructive">
              Kopier et bilde først, og trykk «Lim inn bilde» (eller Ctrl+V).
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
