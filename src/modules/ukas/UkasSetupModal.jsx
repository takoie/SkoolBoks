import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Calendar, Users } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import Select from "../../components/Select";
import {
  getCurrentWeekNumber,
  getCurrentYear,
  HOLIDAY_PRESETS,
  parseWeekInput,
} from "../../lib/ukasUtils";

export default function UkasSetupModal({ isOpen, onClose, initialPlan = null }) {
  const classes = useAppStore((s) => s.classes);
  const activeClassId = useAppStore((s) => s.activeClassId);
  const createUkasPlan = useAppStore((s) => s.createUkasPlan);
  const updateUkasPlan = useAppStore((s) => s.updateUkasPlan);

  const isEditing = Boolean(initialPlan?.id);

  const [title, setTitle] = useState(initialPlan?.title || "Forskerframlegg");
  const [subject, setSubject] = useState(initialPlan?.subject || "");
  const [selectedClassId, setSelectedClassId] = useState(
    initialPlan?.classId || activeClassId || Object.keys(classes)[0] || ""
  );
  const [startWeek, setStartWeek] = useState(
    initialPlan?.startWeek || getCurrentWeekNumber()
  );
  const [startYear, setStartYear] = useState(
    initialPlan?.startYear || getCurrentYear()
  );
  const [interval, setInterval] = useState(initialPlan?.interval || 1);
  const [groupSize, setGroupSize] = useState(initialPlan?.groupSize || 1);
  const [blockedWeeks, setBlockedWeeks] = useState(
    initialPlan?.blockedWeeks || [40, 51, 52, 8, 14]
  );
  const [customWeekInput, setCustomWeekInput] = useState("");

  if (!isOpen) return null;

  function togglePreset(presetWeeks) {
    const allSelected = presetWeeks.every((w) => blockedWeeks.includes(w));
    if (allSelected) {
      setBlockedWeeks(blockedWeeks.filter((w) => !presetWeeks.includes(w)));
    } else {
      const merged = [...new Set([...blockedWeeks, ...presetWeeks])].sort(
        (a, b) => a - b
      );
      setBlockedWeeks(merged);
    }
  }

  function addCustomWeeks() {
    const parsed = parseWeekInput(customWeekInput);
    if (parsed.length > 0) {
      const merged = [...new Set([...blockedWeeks, ...parsed])].sort(
        (a, b) => a - b
      );
      setBlockedWeeks(merged);
      setCustomWeekInput("");
    }
  }

  function removeBlockedWeek(w) {
    setBlockedWeeks(blockedWeeks.filter((week) => week !== w));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing) {
      updateUkasPlan(initialPlan.id, {
        title: title.trim(),
        subject: subject.trim(),
        classId: selectedClassId || null,
        startWeek: Number(startWeek),
        startYear: Number(startYear),
        interval: Number(interval),
        groupSize: Number(groupSize),
        blockedWeeks,
      });
    } else {
      const classStudents = selectedClassId
        ? classes[selectedClassId]?.students || []
        : [];

      createUkasPlan({
        title: title.trim(),
        subject: subject.trim(),
        classId: selectedClassId || null,
        startWeek: Number(startWeek),
        startYear: Number(startYear),
        interval: Number(interval),
        groupSize: Number(groupSize),
        blockedWeeks,
        initialStudents: classStudents,
      });
    }

    onClose();
  }

  const classOptions = [
    { value: "", label: "Ingen (legg til grupper manuelt)" },
    ...Object.entries(classes).map(([id, cls]) => ({
      value: id,
      label: `${cls.name} (${cls.students.length} elever)`,
    })),
  ];

  const intervalOptions = [
    { value: "1", label: "Hver uke" },
    { value: "2", label: "Annenhver uke" },
    { value: "3", label: "Hver 3. uke" },
    { value: "4", label: "Hver 4. uke" },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-8 sm:pt-14 bg-black/60 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-xl2 border-2 border-ink/10 bg-surface p-8 shadow-clay animate-modal-in my-auto sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar size={22} />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-ink">
                {isEditing ? "Rediger Ukas.. opplegg" : "Opprett nytt Ukas.. opplegg"}
              </h2>
              <p className="font-body text-sm text-ink/70">
                Logistikk, elevgrupper og tidsplan for roterende oppgaver
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/60 hover:bg-ink/5 hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tittel & Fag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-heading text-sm font-semibold text-ink">
                Aktivitetstittel *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="f.eks. Forskerframlegg"
                required
                className="w-full rounded-xl border-2 border-ink/10 bg-canvas px-3 py-2 font-body text-ink focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-heading text-sm font-semibold text-ink">
                Fag / Klasse (valgfritt)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="f.eks. Naturfag 8A"
                  className="w-full rounded-xl border-2 border-ink/10 bg-canvas px-3 py-2 font-body text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Klassevalg & Gruppestørrelse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-heading text-sm font-semibold text-ink flex items-center gap-1.5">
                <Users size={16} className="text-primary" />
                Hent elever fra navneliste
              </label>
              <Select
                value={selectedClassId}
                onChange={(id) => setSelectedClassId(id)}
                ariaLabel="Velg klasse for elever"
                options={classOptions}
                className="w-full rounded-xl border-2 border-ink/10 bg-canvas px-3.5 py-2 font-body text-ink focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block font-heading text-sm font-semibold text-ink">
                Elever per gruppe (1–4)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setGroupSize(size)}
                    className={`flex-1 rounded-xl border-2 py-2 font-heading font-semibold transition-all ${
                      groupSize === size
                        ? "border-primary bg-primary/10 text-primary shadow-xs"
                        : "border-ink/10 bg-canvas text-ink hover:border-primary/40"
                    }`}
                  >
                    {size} {size === 1 ? "elev" : "elever"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Startuke, År & Intervall */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border-2 border-ink/10 bg-canvas/60 p-4">
            <div>
              <label className="mb-1 block font-heading text-xs font-semibold text-ink">
                Startuke
              </label>
              <input
                type="number"
                min="1"
                max="53"
                value={startWeek}
                onChange={(e) =>
                  setStartWeek(
                    Math.max(1, Math.min(53, parseInt(e.target.value) || 1))
                  )
                }
                className="w-full rounded-lg border-2 border-ink/10 bg-surface px-2.5 py-1.5 font-body text-ink focus:border-primary focus:outline-none text-center"
              />
            </div>
            <div>
              <label className="mb-1 block font-heading text-xs font-semibold text-ink">
                Startår
              </label>
              <input
                type="number"
                min="2024"
                max="2035"
                value={startYear}
                onChange={(e) =>
                  setStartYear(parseInt(e.target.value) || getCurrentYear())
                }
                className="w-full rounded-lg border-2 border-ink/10 bg-surface px-2.5 py-1.5 font-body text-ink focus:border-primary focus:outline-none text-center"
              />
            </div>
            <div>
              <label className="mb-1 block font-heading text-xs font-semibold text-ink">
                Intervall
              </label>
              <Select
                value={interval.toString()}
                onChange={(val) => setInterval(parseInt(val, 10))}
                ariaLabel="Velg intervall"
                options={intervalOptions}
                className="w-full rounded-lg border-2 border-ink/10 bg-surface px-2.5 py-1.5 font-body text-xs font-semibold text-ink"
              />
            </div>
          </div>

          {/* Sperrede uker / Ferier */}
          <div className="space-y-3 rounded-xl border-2 border-ink/10 bg-canvas/40 p-4">
            <div className="flex items-center justify-between">
              <label className="font-heading text-sm font-semibold text-ink">
                Sperrede uker og ferier (hoppes over automatisk)
              </label>
              <span className="text-xs font-body text-ink/60">
                Ferie- og prøveuker
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {HOLIDAY_PRESETS.map((preset) => {
                const isActive = preset.weeks.every((w) =>
                  blockedWeeks.includes(w)
                );
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => togglePreset(preset.weeks)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-heading font-bold transition-colors ${
                      isActive
                        ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                        : "border-ink/10 bg-surface text-ink hover:border-amber-500/40"
                    }`}
                  >
                    {isActive ? "✓ " : "+ "}
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Flexible text input for holiday weeks / ranges */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder='Skriv inn uker (f.eks. "40", "51-52", "8, 9, 14")'
                  value={customWeekInput}
                  onChange={(e) => setCustomWeekInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomWeeks();
                    }
                  }}
                  className="flex-1 rounded-lg border-2 border-ink/10 bg-surface px-3 py-1.5 text-xs font-body text-ink focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomWeeks}
                  className="flex items-center gap-1 rounded-lg border-2 border-amber-600 bg-amber-600 px-3.5 py-1.5 text-xs font-heading font-bold text-white hover:bg-amber-700 shadow-xs"
                >
                  <Plus size={14} /> Legg til ferieuker
                </button>
              </div>
              <p className="text-[11px] font-body text-ink/60 italic">
                Du kan skrive inn enkeltuker eller intervaller som f.eks. "40-42" eller "51, 52".
              </p>
            </div>

            {/* Active blocked weeks chips */}
            {blockedWeeks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {blockedWeeks.map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-600/40 bg-amber-500/20 px-2 py-0.5 text-xs font-heading font-bold text-amber-950 dark:text-amber-100"
                  >
                    Uke {w}
                    <button
                      type="button"
                      onClick={() => removeBlockedWeek(w)}
                      className="hover:text-destructive"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-ink/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-ink/10 bg-surface px-5 py-2.5 font-heading font-semibold text-ink hover:bg-ink/5"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="rounded-xl border-2 border-primary bg-primary px-6 py-2.5 font-heading font-semibold text-white shadow-clay hover:bg-primary-hover active:bg-primary-active"
            >
              {isEditing ? "Lagre endringer" : "Opprett opplegg"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
