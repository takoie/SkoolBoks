import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Tag,
  Lock,
  Printer,
  Copy,
  Check,
  Move,
} from "lucide-react";
import { NOTE_COLORS } from "../../../lib/notaterTypes";

export default function FocusNoteModal({
  notes = [],
  initialNoteId,
  isUnlockedMap = {},
  onClose,
  onUpdateNote,
}) {
  const initialIndex = Math.max(
    0,
    notes.findIndex((n) => n.id === initialNoteId)
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [copied, setCopied] = useState(false);

  // Position state for floating draggable popup window
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const popupRef = useRef(null);

  const currentNote = notes[currentIndex] || notes[0];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      } else if (e.key === "ArrowRight") {
        if (currentIndex < notes.length - 1) setCurrentIndex((i) => i + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, notes.length, onClose]);

  // Pointer drag logic for floating window header
  const handlePointerDownHeader = (e) => {
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest("textarea")) {
      return;
    }
    e.preventDefault();

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      const nextX = dragRef.current.origX + deltaX;
      const nextY = dragRef.current.origY + deltaY;

      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  if (!currentNote) return null;

  const colorObj =
    NOTE_COLORS.find((c) => c.id === currentNote.color) || NOTE_COLORS[0];
  const isUnlocked = !currentNote.isLocked || isUnlockedMap[currentNote.id];

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("no-NO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const handleCopyText = () => {
    const textToCopy = `${currentNote.title || ""}\n\n${currentNote.content || ""}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintNote = () => {
    window.print();
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      {/* Draggable Floating Popup Window */}
      <div
        ref={popupRef}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        className="pointer-events-auto relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-3xl border-4 border-surface/80 bg-surface shadow-2xl overflow-hidden animate-scale-up"
      >
        {/* Draggable Top Header Bar */}
        <div
          onPointerDown={handlePointerDownHeader}
          className={`flex cursor-move items-center justify-between border-b ${colorObj.border} ${colorObj.header} px-5 py-3 select-none`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 text-slate-950">
              <Move size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-xs font-black uppercase tracking-wider text-slate-950 opacity-80">
                  Framhevet notat ({currentIndex + 1} av {notes.length})
                </span>
                <span className="text-[10px] font-bold opacity-60 text-slate-900">
                  (Dra for å flytte)
                </span>
              </div>
              {currentNote.category && (
                <div className="flex items-center gap-1 text-slate-900 font-bold text-xs">
                  <Tag size={11} />
                  <span>{currentNote.category}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1 font-heading text-xs font-bold text-slate-950 transition-colors hover:bg-black/20"
              title="Kopier notatinnhold"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Kopiert!" : "Kopier"}
            </button>

            <button
              type="button"
              onClick={handlePrintNote}
              className="flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1 font-heading text-xs font-bold text-slate-950 transition-colors hover:bg-black/20"
              title="Skriv ut notat"
            >
              <Printer size={13} />
              Skriv ut
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 text-slate-950 transition-transform hover:scale-110 hover:bg-black/25 active:scale-95"
              aria-label="Lukk popup"
              title="Lukk popup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Focused Single Note Content Area */}
        <div
          className={`flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 ${colorObj.bg} ${colorObj.text}`}
        >
          {currentNote.isLocked && !isUnlocked ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-950">
              <Lock size={40} className="mb-3 opacity-80" />
              <h3 className="font-heading text-xl font-bold">
                Passordbeskyttet notat
              </h3>
              <p className="font-body text-xs opacity-75 mt-1 max-w-sm">
                Dette notatet er låst. Vennligst lås det opp i oversikten for å lese eller redigere innholdet.
              </p>
            </div>
          ) : (
            <>
              {/* Note Title */}
              <input
                type="text"
                spellCheck={false}
                value={currentNote.title || ""}
                onChange={(e) =>
                  onUpdateNote &&
                  onUpdateNote(currentNote.id, { title: e.target.value })
                }
                placeholder="Tittel..."
                className={`w-full bg-transparent font-heading text-2xl sm:text-3xl font-extrabold text-slate-950 placeholder:text-slate-700/40 focus:outline-none ${
                  currentNote.isBold ? "font-black" : ""
                } ${currentNote.isItalic ? "italic" : ""}`}
              />

              {/* Creation Date Badge */}
              <div className="flex items-center gap-1.5 border-b border-black/10 pb-3 text-xs font-semibold text-slate-900 opacity-80">
                <Calendar size={13} />
                <span className="capitalize">{formatDate(currentNote.createdAt)}</span>
              </div>

              {/* Note Content Textarea */}
              <textarea
                spellCheck={false}
                value={currentNote.content || ""}
                onChange={(e) =>
                  onUpdateNote &&
                  onUpdateNote(currentNote.id, { content: e.target.value })
                }
                placeholder="Skriv notat..."
                rows={8}
                className={`w-full flex-1 resize-none bg-transparent font-body text-base sm:text-lg leading-relaxed text-slate-950 placeholder:text-slate-700/40 focus:outline-none ${
                  currentNote.fontSize === "lg"
                    ? "text-xl"
                    : currentNote.fontSize === "xl"
                    ? "text-2xl font-medium"
                    : currentNote.fontSize === "sm"
                    ? "text-sm"
                    : "text-base"
                } ${currentNote.isBold ? "font-bold" : ""} ${
                  currentNote.isItalic ? "italic" : ""
                }`}
              />
            </>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="flex items-center justify-between border-t border-border-subtle bg-surface px-5 py-3 select-none">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-canvas px-3.5 py-1.5 font-heading text-xs font-bold text-ink transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft size={15} />
            Forrige
          </button>

          <span className="font-heading text-xs font-bold text-ink-muted">
            {currentIndex + 1} / {notes.length}
          </span>

          <button
            type="button"
            onClick={() =>
              setCurrentIndex((i) => Math.min(notes.length - 1, i + 1))
            }
            disabled={currentIndex === notes.length - 1}
            className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-canvas px-3.5 py-1.5 font-heading text-xs font-bold text-ink transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
          >
            Neste
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
