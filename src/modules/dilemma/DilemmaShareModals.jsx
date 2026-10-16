import { useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, X, Share2, Download, Key, FileText, Code2, Upload, AlertCircle } from "lucide-react";
import { exportDilemmaSessionToString, parseDilemmaShareString } from "../../lib/dilemmaShare";
import { useAppStore } from "../../store/useAppStore";

export function DilemmaExportModal({ session, onClose }) {
  const [format, setFormat] = useState("token"); // 'token' | 'json' | 'text'
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const exportString = useMemo(() => {
    return exportDilemmaSessionToString(session, format);
  }, [session, format]);

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

  function handleDownloadJson() {
    const jsonStr = exportDilemmaSessionToString(session, "json");
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dilemma_${(session.title || "okt").toLowerCase().replace(/[^a-z0-9]/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!session) return null;

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
              Eksporter / Del økt
            </h3>
            <p className="text-sm text-ink/60">
              Del «{session.title}» med andre lærere
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
            Tekst
          </button>
        </div>

        <div className="relative mb-4">
          <textarea
            ref={textareaRef}
            readOnly
            value={exportString}
            rows={5}
            className="w-full resize-none rounded-xl border-2 border-ink/10 bg-background/50 p-3 font-mono text-sm text-ink focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-ink/10 bg-surface px-4 py-2 font-heading text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            <Download size={16} aria-hidden="true" />
            Last ned JSON
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover shadow-sm"
          >
            {copied ? (
              <>
                <Check size={18} aria-hidden="true" />
                Kopiert!
              </>
            ) : (
              <>
                <Copy size={18} aria-hidden="true" />
                Kopier delingskode
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function DilemmaImportModal({ onClose, onImportSuccess }) {
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState(null);
  const importDilemmaSession = useAppStore((s) => s.importDilemmaSession);
  const fileInputRef = useRef(null);

  const parsedSession = useMemo(() => {
    if (!inputCode.trim()) {
      setError(null);
      return null;
    }
    const result = parseDilemmaShareString(inputCode);
    if (!result) {
      setError("Ugyldig delingskode eller JSON-format.");
      return null;
    }
    setError(null);
    return result;
  }, [inputCode]);

  function handleImport() {
    if (!parsedSession) return;
    importDilemmaSession(parsedSession);
    if (onImportSuccess) {
      onImportSuccess(parsedSession.id);
    }
    onClose();
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setInputCode(content);
      }
    };
    reader.readAsText(file);
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
            <Upload size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-semibold text-ink">
              Importer dilemma-økt
            </h3>
            <p className="text-sm text-ink/60">
              Lim inn en delingskode eller JSON-streng fra en annen lærer
            </p>
          </div>
        </div>

        <div className="mb-4">
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Lim inn delingskode (SKOOLBOKS_DILEMMA:...) eller JSON her..."
            rows={5}
            className="w-full resize-none rounded-xl border-2 border-ink/10 bg-background/50 p-3 font-mono text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {parsedSession && (
          <div className="mb-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-3 text-sm text-ink">
            <p className="font-heading font-semibold text-primary">
              ✓ Klargjort for import:
            </p>
            <p className="font-bold">{parsedSession.title}</p>
            <p className="text-ink/70">
              Inneholder {parsedSession.dilemmas.length} dilemmaer.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-ink/10 bg-surface px-4 py-2 font-heading text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
          >
            <Upload size={16} aria-hidden="true" />
            Last opp fil
          </button>

          <button
            type="button"
            disabled={!parsedSession}
            onClick={handleImport}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
          >
            Importer økt
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
