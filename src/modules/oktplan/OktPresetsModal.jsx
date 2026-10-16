import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Clock,
  Check,
  BookmarkPlus,
  Layers,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { getActivity } from "./oktConstants";

export default function OktPresetsModal({
  isOpen,
  onClose,
  currentIntervals,
  currentTitle,
  onLoadSession,
}) {
  const oktSessions = useAppStore((s) => s.oktSessions);
  const addOktSession = useAppStore((s) => s.addOktSession);
  const deleteOktSession = useAppStore((s) => s.deleteOktSession);

  const [saveName, setSaveName] = useState("");
  const [activeTab, setActiveTab] = useState("load"); // 'load' | 'save'
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  function calculateTotalSeconds(intervals) {
    return intervals.reduce(
      (acc, curr) => acc + (Number(curr.minutes) || 0) * 60 + (Number(curr.seconds) || 0),
      0
    );
  }

  function formatTotalTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs} sek`;
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} sek`;
  }

  function handleSaveNewSession(e) {
    e.preventDefault();
    const nameToUse = saveName.trim() || currentTitle.trim() || "Min nye økt";
    const newSession = {
      id: crypto.randomUUID(),
      title: nameToUse,
      intervals: JSON.parse(JSON.stringify(currentIntervals)),
      createdAt: new Date().toISOString(),
    };
    addOktSession(newSession);
    setSaveName("");
    onLoadSession(newSession);
    onClose();
  }

  function handleDuplicate(session) {
    const duplicated = {
      ...JSON.parse(JSON.stringify(session)),
      id: crypto.randomUUID(),
      title: `${session.title} (kopi)`,
      createdAt: new Date().toISOString(),
    };
    addOktSession(duplicated);
    setCopiedId(session.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl2 border border-ink/10 bg-surface shadow-2xl overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 bg-surface px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderOpen size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-ink">
                Lagrede økter og maler
              </h2>
              <p className="font-body text-xs text-ink-muted">
                Last inn tidligere økter eller lagre den aktive økten for gjenbruk.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
            aria-label="Lukk"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ink/10 bg-surface-hightlight/30 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("load")}
            className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 font-heading text-sm font-semibold transition-colors ${
              activeTab === "load"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            <Layers size={16} />
            Velg lagret økt ({oktSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("save")}
            className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 font-heading text-sm font-semibold transition-colors ${
              activeTab === "save"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            <BookmarkPlus size={16} />
            Lagre nåværende økt
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "save" ? (
            <form onSubmit={handleSaveNewSession} className="space-y-4">
              <div>
                <label
                  htmlFor="session-save-name"
                  className="block font-heading text-sm font-bold text-ink mb-1"
                >
                  Navn på økten
                </label>
                <input
                  id="session-save-name"
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={currentTitle || "f.eks. Norsk Stasjonsundervisning"}
                  className="w-full rounded-xl border border-ink/15 bg-surface px-4 py-2.5 font-body text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>

              <div className="rounded-xl border border-ink/10 bg-ink/5 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-heading font-semibold text-ink-muted">
                  <span>Innhold i økten</span>
                  <span>
                    {currentIntervals.length} intervaller •{" "}
                    {formatTotalTime(calculateTotalSeconds(currentIntervals))}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentIntervals.map((inv, idx) => {
                    const act = getActivity(inv.activityId);
                    const Icon = act.icon;
                    return (
                      <div
                        key={inv.id || idx}
                        className="flex items-center gap-1.5 rounded-lg border border-ink/10 bg-surface px-2.5 py-1 text-xs font-medium text-ink"
                      >
                        <span className={`inline-flex p-0.5 rounded ${act.textClass}`}>
                          <Icon size={14} />
                        </span>
                        <span>{inv.customTitle || act.name}</span>
                        <span className="text-ink-muted text-[10px]">
                          ({inv.minutes > 0 ? `${inv.minutes}m` : ""}{" "}
                          {inv.seconds > 0 ? `${inv.seconds}s` : ""})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-ink/15 bg-surface px-4 py-2 font-heading font-semibold text-ink hover:bg-ink/5 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-heading font-bold text-white shadow-clay transition-colors hover:bg-primary-hover"
                >
                  <Plus size={18} />
                  Lagre økt
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {oktSessions.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="mx-auto h-12 w-12 text-ink-muted/50 mb-3" />
                  <p className="font-heading text-lg font-bold text-ink">
                    Ingen lagrede økter enda
                  </p>
                  <p className="font-body text-sm text-ink-muted mt-1">
                    Bygg opp en økt og lagre den for gjenbruk senere!
                  </p>
                </div>
              ) : (
                oktSessions.map((session) => {
                  const totalSecs = calculateTotalSeconds(session.intervals);
                  const isPreset = session.id.startsWith("preset-");
                  return (
                    <div
                      key={session.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl2 border border-ink/10 bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-base font-bold text-ink">
                            {session.title}
                          </h3>
                          {isPreset && (
                            <span className="rounded-full bg-secondary/15 px-2 py-0.5 font-heading text-[11px] font-bold text-secondary">
                              Standardmal
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                          <span className="font-medium text-ink font-heading">
                            {session.intervals.length} intervaller
                          </span>
                          <span>•</span>
                          <span>{formatTotalTime(totalSecs)}</span>
                        </div>
                        {/* Preview chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {session.intervals.map((inv, i) => {
                            const act = getActivity(inv.activityId);
                            const Icon = act.icon;
                            return (
                              <span
                                key={inv.id || i}
                                className="inline-flex items-center gap-1 rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink"
                              >
                                <Icon size={12} className={act.textClass} />
                                {inv.customTitle || act.name}
                                {inv.assignedStudent && (
                                  <span className="text-primary font-semibold">({inv.assignedStudent})</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(session)}
                          title="Dupliser økt"
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-ink/10 bg-surface text-ink-muted transition-colors hover:border-ink/20 hover:text-ink"
                        >
                          {copiedId === session.id ? (
                            <Check size={16} className="text-emerald-500" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Er du sikker på at du vil slette "${session.title}"?`)) {
                              deleteOktSession(session.id);
                            }
                          }}
                          title="Slett økt"
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-ink/10 bg-surface text-rose-500 transition-colors hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onLoadSession(session);
                            onClose();
                          }}
                          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-heading font-bold text-white shadow-clay transition-colors hover:bg-primary-hover"
                        >
                          <FolderOpen size={16} />
                          Bruk økt
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
