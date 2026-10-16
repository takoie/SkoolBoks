import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, Share2, Download, FileText, Code2, AlertCircle, Sparkles } from "lucide-react";
import { exportUkasPlanToString, parseUkasPlanString } from "../../lib/ukasUtils";

export function UkasExportModal({ plan, onClose }) {
  const [format, setFormat] = useState("token");
  const [copied, setCopied] = useState(false);

  const exportedContent = useMemo(() => {
    return exportUkasPlanToString(plan, format);
  }, [plan, format]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!plan) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl2 bg-surface p-6 sm:p-8 shadow-clay animate-modal-in flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10"
          aria-label="Lukk"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Share2 size={24} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-ink">Eksporter opplegg</h2>
            <p className="font-body text-xs text-ink/60">{plan.title}</p>
          </div>
        </div>

        {/* Format Selector */}
        <div className="flex rounded-xl bg-canvas p-1">
          <button
            type="button"
            onClick={() => setFormat("token")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-heading text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              format === "token"
                ? "bg-surface text-primary shadow-sm"
                : "text-ink/60 hover:text-ink"
            }`}
          >
            <Sparkles size={16} aria-hidden="true" />
            Delingskode
          </button>
          <button
            type="button"
            onClick={() => setFormat("text")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-heading text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              format === "text"
                ? "bg-surface text-primary shadow-sm"
                : "text-ink/60 hover:text-ink"
            }`}
          >
            <FileText size={16} aria-hidden="true" />
            Ren tekst
          </button>
          <button
            type="button"
            onClick={() => setFormat("json")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-heading text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              format === "json"
                ? "bg-surface text-primary shadow-sm"
                : "text-ink/60 hover:text-ink"
            }`}
          >
            <Code2 size={16} aria-hidden="true" />
            JSON
          </button>
        </div>

        {/* Exported Content Box */}
        <div className="relative">
          <textarea
            readOnly
            value={exportedContent}
            rows={format === "json" ? 8 : 6}
            className="w-full rounded-xl border-2 border-ink/10 bg-canvas p-3.5 font-mono text-xs text-ink focus:outline-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-heading font-semibold text-white shadow-xs transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check size={18} aria-hidden="true" />
                Kopiert til utklippstavle!
              </>
            ) : (
              <>
                <Copy size={18} aria-hidden="true" />
                Kopier {format === "token" ? "delingskode" : format === "json" ? "JSON" : "tekst"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function UkasImportModal({ onImport, onClose }) {
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");

  const parsedPlan = useMemo(() => {
    if (!inputText.trim()) return null;
    return parseUkasPlanString(inputText);
  }, [inputText]);

  const handleConfirmImport = () => {
    if (!parsedPlan) {
      setError("Ugyldig delingskode, JSON eller tekstformat.");
      return;
    }
    onImport(parsedPlan);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl2 bg-surface p-6 sm:p-8 shadow-clay animate-modal-in flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10"
          aria-label="Lukk"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Download size={24} aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-ink">Importer Ukas-opplegg</h2>
            <p className="font-body text-xs text-ink/60">Lim inn delingskode, JSON eller gruppelinjer</p>
          </div>
        </div>

        <div>
          <textarea
            autoFocus
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setError("");
            }}
            placeholder="Lim inn delingskode (f.eks. SKOOLBOKS_UKAS:...) eller JSON / tekst her..."
            rows={6}
            className="w-full rounded-xl border-2 border-ink/10 bg-canvas p-3.5 font-mono text-xs text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            <AlertCircle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        {parsedPlan && (
          <div className="flex flex-col gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-heading font-bold text-emerald-700 dark:text-emerald-400">
              <Check size={16} aria-hidden="true" />
              Gyldig opplegg funnet: {parsedPlan.title}
            </div>
            <p className="opacity-80">
              Inneholder {parsedPlan.groups?.length || 0} gruppe(r). Klikk på Importer for å legge til.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border-2 border-ink/10 px-4 py-3 font-heading font-semibold text-ink hover:bg-ink/5"
          >
            Avbryt
          </button>
          <button
            type="button"
            disabled={!parsedPlan}
            onClick={handleConfirmImport}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-heading font-semibold text-white shadow-xs transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} aria-hidden="true" />
            Importer opplegg
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
