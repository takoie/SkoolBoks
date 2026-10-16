import { useState } from "react";
import { Calendar, Plus, X, Tag } from "lucide-react";
import { HOLIDAY_PRESETS, parseWeekInput } from "../../lib/ukasUtils";

export default function UkasTimeline({
  currentPlan,
  toggleUkasBlockedWeek,
  showBlockedWeeksPanel,
  setShowBlockedWeeksPanel,
}) {
  const [customWeekInput, setCustomWeekInput] = useState("");
  const [customLabelInput, setCustomLabelInput] = useState("");
  const [editingWeek, setEditingWeek] = useState(null);
  const [editingLabelInput, setEditingLabelInput] = useState("");

  const blockedWeekLabels = currentPlan.blockedWeekLabels || {};

  function handleAddCustomWeeks() {
    if (!currentPlan) return;
    const parsed = parseWeekInput(customWeekInput);
    if (parsed.length === 0) return;

    parsed.forEach((w) => {
      toggleUkasBlockedWeek(currentPlan.id, w, customLabelInput.trim() || undefined);
    });
    setCustomWeekInput("");
    setCustomLabelInput("");
  }

  function handleSaveEditLabel(week) {
    toggleUkasBlockedWeek(currentPlan.id, week, editingLabelInput.trim());
    setEditingWeek(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowBlockedWeeksPanel(!showBlockedWeeksPanel)}
        className={`flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-2 font-heading text-xs font-extrabold transition-colors cursor-pointer ${
          showBlockedWeeksPanel
            ? "border-amber-600 bg-amber-400 text-amber-950 shadow-xs dark:bg-amber-600 dark:text-white"
            : "border-ink/10 bg-canvas text-ink hover:border-amber-500/40"
        }`}
      >
        <Calendar size={16} aria-hidden="true" />
        Sperrede uker ({currentPlan.blockedWeeks?.length || 0})
      </button>

      {showBlockedWeeksPanel && (
        <div className="rounded-xl2 border-2 border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/30 p-5 space-y-4 animate-fadeIn w-full text-ink shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
            <div>
              <h4 className="font-heading text-base font-bold text-ink">
                Sperrede uker og ferier
              </h4>
              <p className="font-body text-xs text-ink/70">
                Tidsplanen hopper automatisk over disse ukenumrene når gruppene fordeles.
              </p>
            </div>
            <span className="font-body text-xs font-semibold text-amber-800 dark:text-amber-300">
              {currentPlan.blockedWeeks?.length || 0} ferieuker sperret
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="space-y-1.5">
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-ink/60 block">
              Hurtigvalg for skoleferier:
            </span>
            <div className="flex flex-wrap gap-2">
              {HOLIDAY_PRESETS.map((preset) => {
                const isActive = preset.weeks.every((w) =>
                  currentPlan.blockedWeeks?.includes(w)
                );
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      preset.weeks.forEach((w) =>
                        toggleUkasBlockedWeek(currentPlan.id, w, preset.name)
                      );
                    }}
                    className={`rounded-xl border-2 px-3 py-1.5 text-xs font-heading font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? "border-amber-600 bg-amber-400 text-amber-950 shadow-xs dark:bg-amber-600 dark:text-white"
                        : "border-ink/15 bg-surface text-ink hover:border-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
                    }`}
                  >
                    {isActive ? "✓ " : "+ "} {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom week / range + description input */}
          <div className="space-y-2 pt-2 border-t border-amber-500/20">
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-ink/60 block">
              Legg til egne ferieuker med beskrivelse:
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder='Uke(r), f.eks. "41" eller "41-42"'
                value={customWeekInput}
                onChange={(e) => setCustomWeekInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomWeeks();
                  }
                }}
                className="w-full sm:w-44 rounded-xl border-2 border-ink/20 bg-surface px-3 py-2 text-xs font-heading font-bold text-ink focus:border-amber-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder='Beskrivelse, f.eks. "Høstferie" (valgfritt)'
                value={customLabelInput}
                onChange={(e) => setCustomLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomWeeks();
                  }
                }}
                className="flex-1 rounded-xl border-2 border-ink/20 bg-surface px-3 py-2 text-xs font-body text-ink focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomWeeks}
                className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-amber-600 bg-amber-400 px-4 py-2 text-xs font-heading font-black text-amber-950 hover:bg-amber-500 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-700 shadow-xs cursor-pointer transition-colors"
              >
                <Plus size={16} aria-hidden="true" /> Legg til ferie
              </button>
            </div>
          </div>

          {/* Active blocked weeks list */}
          {currentPlan.blockedWeeks?.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-amber-500/20">
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-ink/70 block">
                Aktive sperrede uker:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentPlan.blockedWeeks.map((w) => {
                  const label = blockedWeekLabels[w];
                  const isEditingThis = editingWeek === w;

                  if (isEditingThis) {
                    return (
                      <div
                        key={w}
                        className="inline-flex items-center gap-1 rounded-xl border-2 border-amber-500 bg-surface p-1 shadow-xs"
                      >
                        <span className="font-heading text-xs font-extrabold text-amber-950 dark:text-amber-100 pl-2">
                          Uke {w}:
                        </span>
                        <input
                          type="text"
                          autoFocus
                          value={editingLabelInput}
                          onChange={(e) => setEditingLabelInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEditLabel(w);
                            if (e.key === "Escape") setEditingWeek(null);
                          }}
                          placeholder="Feriebeskrivelse..."
                          className="w-32 rounded-lg border border-amber-400 bg-canvas px-2 py-0.5 text-xs font-body text-ink focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditLabel(w)}
                          className="rounded-lg bg-amber-500 px-2 py-0.5 font-heading text-xs font-bold text-amber-950 dark:text-white cursor-pointer"
                        >
                          Lagre
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={w}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-400/80 bg-amber-100 dark:bg-amber-900/60 dark:border-amber-600 px-3 py-1 text-xs font-heading font-extrabold text-amber-950 dark:text-amber-100 shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWeek(w);
                          setEditingLabelInput(label || "");
                        }}
                        className="flex items-center gap-1 text-left cursor-pointer hover:underline"
                        title="Klikk for å endre beskrivelse"
                      >
                        <span>Uke {w}</span>
                        {label ? (
                          <span className="font-body font-semibold text-amber-900 dark:text-amber-200">
                            ({label})
                          </span>
                        ) : (
                          <Tag size={12} className="text-amber-700/60 dark:text-amber-300/60 hover:text-amber-900" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleUkasBlockedWeek(currentPlan.id, w)}
                        aria-label={`Fjern sperring for uke ${w}`}
                        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-amber-900/60 hover:bg-destructive/20 hover:text-destructive cursor-pointer transition-colors dark:text-amber-200"
                        title="Fjern sperring"
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
