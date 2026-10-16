import { useState } from "react";
import {
  Plus,
  Play,
  Edit3,
  Trash2,
  Copy,
  Clock,
  Check,
  FolderOpen,
  Sparkles,
  Bookmark,
  Layers,
  RotateCcw,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { getActivity, PRESET_SESSIONS } from "./oktConstants";

export default function OktOverview({
  onCreateNewSession,
  onSelectSessionToEdit,
  onSelectSessionToRun,
}) {
  const oktSessions = useAppStore((s) => s.oktSessions);
  const addOktSession = useAppStore((s) => s.addOktSession);
  const deleteOktSession = useAppStore((s) => s.deleteOktSession);
  const resetOktPresets = useAppStore((s) => s.resetOktPresets);

  const [copiedId, setCopiedId] = useState(null);
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'custom' | 'preset'

  function calculateTotalSeconds(intervals = []) {
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

  const customSessions = oktSessions.filter((s) => !s.id.startsWith("preset-"));
  const presetSessions = oktSessions.filter((s) => s.id.startsWith("preset-"));

  const displaySessions =
    filterTab === "custom"
      ? customSessions
      : filterTab === "preset"
      ? presetSessions
      : oktSessions;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-xl2 border border-border-subtle bg-surface p-6 sm:p-8 shadow-clay">
        <div className="space-y-2 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 font-heading text-xs font-bold text-primary">
            <Sparkles size={16} />
            Øktplanlegger og tidslinje
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink">
            Øktplaner og maler
          </h1>
          <p className="font-body text-base text-ink-muted max-w-2xl">
            Velg en av dine lagrede økter eller standardmaler for å starte undervisningen,
            eller opprett en ny tilpasset økt for klasserommet.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNewSession}
          className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2.5 rounded-xl2 bg-primary px-8 py-3 font-heading text-lg font-bold text-white shadow-clay hover:bg-primary-hover active:scale-95 transition-all shrink-0 focus-visible:ring-4 focus-visible:ring-primary"
        >
          <Plus size={24} />
          Opprett ny økt
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 font-heading text-sm sm:text-base font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary ${
              filterTab === "all"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface text-ink-muted hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <Layers size={18} />
            Alle økter ({oktSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("custom")}
            className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 font-heading text-sm sm:text-base font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary ${
              filterTab === "custom"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface text-ink-muted hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <Bookmark size={18} />
            Mine økter ({customSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("preset")}
            className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 font-heading text-sm sm:text-base font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary ${
              filterTab === "preset"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface text-ink-muted hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <FolderOpen size={18} />
            Standardmaler ({presetSessions.length})
          </button>
        </div>

        {presetSessions.length < PRESET_SESSIONS.length && (
          <button
            type="button"
            onClick={resetOktPresets}
            title="Gjenopprett slettede standardmaler"
            className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-border-subtle bg-surface px-4 py-2.5 font-heading text-sm font-bold text-primary hover:bg-primary/10 transition-all focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RotateCcw size={16} />
            Gjenopprett slettede maler
          </button>
        )}
      </div>

      {/* Sessions Grid / Cards */}
      {displaySessions.length === 0 ? (
        <div className="rounded-xl2 border-2 border-dashed border-border-subtle p-12 text-center bg-surface">
          <Clock className="mx-auto h-14 w-14 text-ink-muted/40 mb-3" />
          <h3 className="font-heading text-xl font-bold text-ink">
            Ingen økter funnet i denne kategorien
          </h3>
          <p className="font-body text-base text-ink-muted mt-2 max-w-md mx-auto">
            Klikk på "Opprett ny økt" øverst for å bygge opp din første egne øktplan!
          </p>
          <button
            type="button"
            onClick={onCreateNewSession}
            className="mt-6 inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-heading text-base font-bold text-white shadow-clay hover:bg-primary-hover active:scale-95 transition-all"
          >
            <Plus size={20} />
            Opprett ny økt nå
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {displaySessions.map((session) => {
            const totalSecs = calculateTotalSeconds(session.intervals);
            const isPreset = session.id.startsWith("preset-");

            return (
              <div
                key={session.id}
                className="group flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-xl2 border-2 border-border-subtle bg-surface p-6 shadow-clay transition-all hover:border-primary/50"
              >
                {/* Session Info & Visual Interval Timeline */}
                <div className="space-y-4 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-heading text-2xl font-bold text-ink">
                      {session.title}
                    </h2>
                    {isPreset ? (
                      <span className="rounded-full bg-secondary/15 px-3 py-1 font-heading text-xs font-bold text-secondary">
                        Standardmal
                      </span>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-heading text-xs font-bold text-primary">
                        Egendefinert økt
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-heading text-sm font-semibold text-ink-muted">
                    <span>{session.intervals?.length || 0} intervaller</span>
                    <span>•</span>
                    <span>Totaltid: {formatTotalTime(totalSecs)}</span>
                  </div>

                  {/* Interval Timeline Chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {session.intervals?.map((inv, idx) => {
                      const act = getActivity(inv.activityId);
                      const Icon = act.icon;
                      const durationStr =
                        (inv.minutes > 0 ? `${inv.minutes}m` : "") +
                        (inv.seconds > 0 ? ` ${inv.seconds}s` : "");

                      return (
                        <div
                          key={inv.id || idx}
                          className="flex items-center gap-2 rounded-xl border border-border-subtle bg-canvas px-3.5 py-2 text-sm font-medium text-ink shadow-sm"
                        >
                          <span
                            className={`inline-flex p-1 rounded-lg ${act.lightBg} ${act.textClass}`}
                          >
                            <Icon size={18} />
                          </span>
                          <span className="font-heading font-bold text-base">
                            {inv.customTitle || act.name}
                          </span>
                          <span className="font-heading font-semibold text-ink-muted text-sm">
                            ({durationStr.trim()})
                          </span>
                          {inv.assignedStudent && (
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                              👤 {inv.assignedStudent}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Session Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border-subtle">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(session)}
                    title="Dupliser økt"
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border-subtle bg-surface text-ink-muted transition-all hover:bg-primary/10 hover:text-primary active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {copiedId === session.id ? (
                      <Check size={20} className="text-emerald-500" />
                    ) : (
                      <Copy size={20} />
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
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border-subtle bg-surface text-destructive transition-all hover:bg-destructive/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Trash2 size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSessionToEdit(session)}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/10 px-5 py-2.5 font-heading text-base font-bold text-primary transition-all hover:bg-primary/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Edit3 size={18} />
                    Rediger
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSessionToRun(session)}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl bg-primary px-6 py-2.5 font-heading text-base font-bold text-white shadow-clay transition-all hover:bg-primary-hover active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Play size={20} className="fill-current" />
                    Start økt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
