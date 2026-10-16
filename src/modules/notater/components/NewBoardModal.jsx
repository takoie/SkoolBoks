import { useState } from "react";
import { Layout, X, Check } from "lucide-react";
import { BOARD_THEMES } from "../../../lib/notaterTypes";

export default function NewBoardModal({ onConfirm, onClose }) {
  const [title, setTitle] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("chalkboard");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onConfirm(title.trim(), selectedTheme);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border-2 border-border-subtle bg-surface p-6 shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Layout size={20} />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-ink">
                Ny klassetavle
              </h3>
              <p className="font-body text-xs text-ink-muted">
                Opprett en ny tavle for undervisning eller idémyldring
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-canvas hover:text-ink"
            aria-label="Lukk"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-body">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">
              Tavlenavn
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="f.eks. Klasse 1T - Matematikk kap 4"
              autoFocus
              className="w-full rounded-xl border border-border-subtle bg-canvas px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-2">
              Velg bakgrunnstema
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BOARD_THEMES.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`flex items-center justify-between rounded-xl border-2 p-3 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-border-subtle bg-canvas text-ink hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xs">{theme.name}</span>
                    {isSelected && <Check size={16} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-canvas hover:text-ink"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-contrast shadow-sm hover:bg-primary-hover active:scale-95 disabled:opacity-50"
            >
              Opprett tavle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
