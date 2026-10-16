import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Lock, Eye, EyeOff, X, Move } from "lucide-react";

export default function SecretWordModal({ isOpen, onClose, onSubmitWord }) {
  const [draftWord, setDraftWord] = useState("");
  const [hideText, setHideText] = useState(true);

  // Position state relative to center
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, initialX: 0, initialY: 0 });

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
      setDraftWord("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handlePointerDown(e) {
    if (e.target.closest("button") || e.target.closest("input")) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  }

  function handlePointerMove(e) {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setPosition({
      x: dragStartRef.current.initialX + dx,
      y: dragStartRef.current.initialY + dy,
    });
  }

  function handlePointerUp(e) {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = draftWord.trim();
    if (!trimmed) return;
    onSubmitWord(trimmed);
    setDraftWord("");
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none p-4">
      <div
        className="pointer-events-auto fixed w-full max-w-lg overflow-hidden rounded-2xl border-4 border-secondary bg-surface p-6 shadow-2xl select-none"
        style={{
          left: `calc(50% + ${position.x}px)`,
          top: `calc(50% + ${position.y}px)`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Header - Drag Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex cursor-move items-center justify-between border-b-2 border-ink/10 pb-4 select-none touch-none"
          title="Klikk og hold inne musen for å dra vinduet på skjermen"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <Move size={22} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-xl font-bold text-ink">
                  Hemmelig inntastingsvindu
                </h3>
                <span className="rounded-md bg-secondary/20 px-2 py-0.5 text-[10px] font-black uppercase text-secondary">
                  Flyttbar ✋
                </span>
              </div>
              <p className="font-heading text-xs font-semibold text-ink/70">
                Hold inne musen i dette toppfeltet for å dra vinduet!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Lukk"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/60 hover:bg-ink/10 hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-left select-text">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-heading text-sm font-bold text-ink">
                Skriv inn hemmelig ord
              </label>
              <button
                type="button"
                onClick={() => setHideText((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline cursor-pointer"
              >
                {hideText ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>{hideText ? "Vis bokstaver" : "Skjul bokstaver (masker)"}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={hideText ? "password" : "text"}
                value={draftWord}
                onChange={(e) => setDraftWord(e.target.value)}
                placeholder="Skriv ordet her..."
                autoFocus
                autoComplete="off"
                spellCheck="false"
                className="w-full rounded-xl border-2 border-ink/20 bg-background p-3.5 font-heading text-2xl font-bold text-ink tracking-wider focus:border-secondary focus:outline-none"
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-ink/70">
              💡 Dra overskriften over til PC-skjermen din før du skriver ordet.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-touch cursor-pointer items-center justify-center rounded-xl border-2 border-ink/20 bg-surface px-5 py-2.5 font-heading text-sm font-bold text-ink hover:bg-ink/5"
            >
              Avbryt
            </button>

            <button
              type="submit"
              disabled={!draftWord.trim()}
              className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-2.5 font-heading text-sm font-bold text-white transition-all hover:brightness-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Lock size={18} />
              <span>Start spillet med ordet</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
