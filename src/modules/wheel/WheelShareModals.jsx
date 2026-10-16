import { useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, X, Share2, Download, FileText, Code2, Key } from "lucide-react";
import { exportWheelToString, parseWheelString } from "../../lib/wheelSpin";

export function WheelExportModal({ wheel, onClose }) {
  const [format, setFormat] = useState("token"); // 'token' | 'text' | 'json'
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const exportString = useMemo(() => {
    return exportWheelToString(wheel, format);
  }, [wheel, format]);

  async function handleCopy() {
    if (!exportString) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(exportString);
      } else {
        textareaRef.current?.select();
        document.execCommand("copy");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      textareaRef.current?.select();
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  if (!wheel) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl2 bg-surface p-6 shadow-clay animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Lukk"
          className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10 hover:text-ink"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Share2 size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-semibold text-ink">
              Eksporter hjul
            </h3>
            <p className="text-sm text-ink/60">
              Del hjulet «{wheel.name}» med elever eller kolleger
            </p>
          </div>
        </div>

        <div className="mb-4 flex gap-2 rounded-xl border-2 border-ink/10 bg-surface/50 p-1">
          <button
            type="button"
            onClick={() => setFormat("token")}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2 font-heading text-sm font-semibold transition-all ${
              format === "token"
                ? "bg-primary text-white shadow-sm"
                : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            <Key size={16} aria-hidden="true" />
            Delingskode
          </button>
          <button
            type="button"
            onClick={() => setFormat("text")}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2 font-heading text-sm font-semibold transition-all ${
              format === "text"
                ? "bg-primary text-white shadow-sm"
                : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            <FileText size={16} aria-hidden="true" />
            Tekstliste
          </button>
          <button
            type="button"
            onClick={() => setFormat("json")}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2 font-heading text-sm font-semibold transition-all ${
              format === "json"
                ? "bg-primary text-white shadow-sm"
                : "text-ink/70 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            <Code2 size={16} aria-hidden="true" />
            JSON
          </button>
        </div>

        <p className="mb-2 text-xs font-medium text-ink/60">
          {format === "token" &&
            "Delingskoden inneholder hjulnavnet og alle sektorene på én linje."}
          {format === "text" &&
            "Kopier sektorene som ren tekst (én linje per sektor)."}
          {format === "json" &&
            "Komplett JSON-datastruktur for avansert deling."}
        </p>

        <div className="relative mb-6">
          <textarea
            ref={textareaRef}
            readOnly
            value={exportString}
            onClick={(e) => e.currentTarget.select()}
            rows={format === "token" ? 4 : 7}
            className="w-full resize-none rounded-xl2 border-2 border-ink/10 bg-ink/5 p-4 font-mono text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-touch cursor-pointer items-center justify-center rounded-xl2 border-2 border-ink/10 px-5 py-2.5 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            Lukk
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 px-6 py-2.5 font-heading text-base font-semibold text-white transition-all ${
              copied
                ? "bg-emerald-600 shadow-md"
                : "bg-primary hover:bg-primary-hover active:scale-95"
            }`}
          >
            {copied ? (
              <>
                <Check size={18} aria-hidden="true" />
                Kopiert!
              </>
            ) : (
              <>
                <Copy size={18} aria-hidden="true" />
                Kopier streng
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function WheelImportModal({ onImport, onClose }) {
  const [inputText, setInputText] = useState("");

  const parsedWheel = useMemo(() => {
    return parseWheelString(inputText);
  }, [inputText]);

  function handleConfirm() {
    if (!parsedWheel || parsedWheel.sectors.length === 0) return;
    onImport(parsedWheel);
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl2 bg-surface p-6 shadow-clay animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Lukk"
          className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10 hover:text-ink"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Download size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-semibold text-ink">
              Importer hjul
            </h3>
            <p className="text-sm text-ink/60">
              Lim inn en delingskode eller en tekstliste
            </p>
          </div>
        </div>

        <div className="mb-4">
          <textarea
            autoFocus
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Lim inn delingskode (f.eks. SKOOLBOKS_WHEEL:...) eller skriv inn sektorer, én per linje…"
            rows={5}
            className="w-full rounded-xl2 border-2 border-ink/10 bg-surface p-4 font-body text-base text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
          />
        </div>

        {inputText.trim() !== "" && (
          <div className="mb-6 rounded-xl border-2 border-ink/10 bg-surface/50 p-4">
            {parsedWheel ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-emerald-600 font-heading font-semibold text-sm">
                  <Check size={16} aria-hidden="true" />
                  Klar til å opprette hjul
                </div>
                <p className="font-heading text-lg font-bold text-ink">
                  {parsedWheel.name}
                </p>
                <p className="text-sm text-ink/70">
                  {parsedWheel.sectors.length} sektorer:{" "}
                  <span className="italic">
                    {parsedWheel.sectors.slice(0, 5).join(", ")}
                    {parsedWheel.sectors.length > 5 ? "…" : ""}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-destructive font-medium">
                Kunne ikke gjenkjenne noe gyldig hjul eller sektorliste fra teksten.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-touch cursor-pointer items-center justify-center rounded-xl2 border-2 border-ink/10 px-5 py-2.5 font-heading font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!parsedWheel || parsedWheel.sectors.length === 0}
            className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary px-6 py-2.5 font-heading text-base font-semibold text-white transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            <Download size={18} aria-hidden="true" />
            Importer hjul
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
