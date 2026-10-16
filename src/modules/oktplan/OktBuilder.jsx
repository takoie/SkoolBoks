import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  GripVertical,
  Clock,
  Play,
  FolderOpen,
  Edit3,
  Check,
  User,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { CLASSROOM_ACTIVITIES, getActivity } from "./oktConstants";

function SortableIntervalItem({
  interval,
  index,
  totalItems,
  students = [],
  activeClassName = "",
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: interval.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    touchAction: "none",
  };

  const activity = getActivity(interval.activityId);
  const Icon = activity.icon;

  const [isEditingTitle, setIsEditingTitle] = useState(
    Boolean(
      interval.isEditingTitle ||
        (interval.activityId === "annet" &&
          (!interval.customTitle ||
            interval.customTitle === "Egen aktivitet / Annet" ||
            interval.customTitle === "Annet / Valgfri"))
    )
  );
  const [isCustomStudent, setIsCustomStudent] = useState(false);

  function handleMinutesChange(val) {
    const min = Math.max(0, Math.min(599, parseInt(val) || 0));
    onUpdate({ ...interval, minutes: min });
  }

  function handleSecondsChange(val) {
    const sec = Math.max(0, Math.min(59, parseInt(val) || 0));
    onUpdate({ ...interval, seconds: sec });
  }

  function adjustMinutes(delta) {
    const newMin = Math.max(0, Math.min(599, (interval.minutes || 0) + delta));
    onUpdate({ ...interval, minutes: newMin });
  }

  function adjustSeconds(delta) {
    let newSec = (interval.seconds || 0) + delta;
    let newMin = interval.minutes || 0;
    if (newSec >= 60) {
      newMin += Math.floor(newSec / 60);
      newSec = newSec % 60;
    } else if (newSec < 0) {
      if (newMin > 0) {
        newMin -= 1;
        newSec = 60 + newSec;
      } else {
        newSec = 0;
      }
    }
    onUpdate({ ...interval, minutes: newMin, seconds: newSec });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl2 border transition-all ${
        isDragging
          ? "z-30 border-primary shadow-2xl bg-surface opacity-90 scale-[1.01]"
          : "border-border-subtle bg-surface shadow-clay hover:border-primary/40"
      }`}
    >
      {/* Left Content Area: Row 1 (Header: Drag + Index + Dropdown + Ansvarlig), Row 2 (Redigeringsfelt under dropdown) */}
      <div className="flex-1 space-y-3 min-w-0">
        {/* Row 1: Drag handle, Index, Activity selector dropdown, and Ansvarlig (rett bak dropdown) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Dra for å endre rekkefølge"
            className="flex h-10 w-7 cursor-grab active:cursor-grabbing items-center justify-center text-ink-muted/50 transition-colors hover:text-ink shrink-0"
          >
            <GripVertical size={22} />
          </button>

          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary shrink-0">
            {index + 1}
          </span>

          {/* Activity selector dropdown */}
          <div className="relative shrink-0 min-w-[210px]">
            <select
              value={interval.activityId}
              onChange={(e) => {
                const newActId = e.target.value;
                const isAnnet = newActId === "annet";
                onUpdate({
                  ...interval,
                  activityId: newActId,
                  customTitle: isAnnet ? "" : getActivity(newActId).name,
                });
              }}
              className="w-full appearance-none rounded-xl border-2 border-border-subtle bg-surface px-4 py-2.5 pr-10 font-heading text-base font-bold text-ink cursor-pointer focus:border-primary focus:outline-none"
            >
              {CLASSROOM_ACTIVITIES.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name}
                </option>
              ))}
            </select>
            <div
              className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 ${activity.textClass}`}
            >
              <Icon size={20} />
            </div>
          </div>

          {/* Ansvarlig elev/lærer (rett bak dropdown-menyen for aktivitet) */}
          <div className="flex items-center gap-2 rounded-xl border-2 border-border-subtle bg-canvas px-3 py-1.5 shrink-0">
            <User size={16} className="text-primary shrink-0" />
            {isCustomStudent ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Skriv navn..."
                  value={interval.assignedStudent || ""}
                  onChange={(e) =>
                    onUpdate({ ...interval, assignedStudent: e.target.value })
                  }
                  className="rounded-lg border-2 border-primary bg-surface px-2.5 py-1 text-sm font-semibold text-ink focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsCustomStudent(false)}
                  className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-white hover:bg-primary-hover shrink-0"
                >
                  OK
                </button>
              </div>
            ) : (
              <select
                value={
                  students.includes(interval.assignedStudent)
                    ? interval.assignedStudent
                    : interval.assignedStudent
                    ? "__custom_value__"
                    : ""
                }
                onChange={(e) => {
                  if (e.target.value === "__custom__" || e.target.value === "__custom_value__") {
                    setIsCustomStudent(true);
                  } else {
                    onUpdate({ ...interval, assignedStudent: e.target.value });
                  }
                }}
                className="rounded-lg border-0 bg-transparent font-heading text-sm font-semibold text-ink-muted hover:text-ink cursor-pointer focus:outline-none"
              >
                <option value="">Ingen ansvarlig</option>
                {students.length > 0 && (
                  <optgroup label={`Navneliste (${activeClassName || "klasse"})`}>
                    {students.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </optgroup>
                )}
                {interval.assignedStudent && !students.includes(interval.assignedStudent) && (
                  <option value="__custom_value__">
                    Ansvarlig: {interval.assignedStudent}
                  </option>
                )}
                <option value="__custom__">+ Skriv inn navn...</option>
              </select>
            )}
          </div>
        </div>

        {/* Row 2: Redigeringsfelt for tittel / egendefinert aktivitet (UNDER DROPDOWN-MENYEN) */}
        <div className="flex items-center gap-2 pt-0.5 sm:pl-11">
          <input
            type="text"
            value={interval.customTitle ?? ""}
            onChange={(e) =>
              onUpdate({ ...interval, customTitle: e.target.value })
            }
            placeholder={
              interval.activityId === "annet"
                ? "Skriv inn egen aktivitet her (f.eks. Quiz, Sløyd, Stasjonsarbeid...)"
                : `Beskrivelse / Egen tittel (standard: ${activity.name})`
            }
            className="w-full rounded-xl border-2 border-border-subtle bg-surface px-4 py-2 font-heading text-base font-bold text-ink placeholder:text-ink-muted/50 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Time Controls: Minutes & Seconds */}
      <div className="flex items-center gap-4 bg-canvas p-3 rounded-xl border border-border-subtle shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <input
              type="number"
              min="0"
              max="599"
              value={interval.minutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              className="w-16 sm:w-20 text-center font-heading text-lg sm:text-2xl font-bold text-ink rounded-xl border-2 border-border-subtle bg-surface py-1.5 focus:border-primary focus:outline-none"
            />
            <span className="text-xs font-heading font-bold text-ink-muted mt-1">
              min
            </span>
          </div>

          <span className="font-heading text-xl font-bold text-ink pb-4">:</span>

          <div className="flex flex-col items-center">
            <input
              type="number"
              min="0"
              max="59"
              value={interval.seconds}
              onChange={(e) => handleSecondsChange(e.target.value)}
              className="w-16 sm:w-20 text-center font-heading text-lg sm:text-2xl font-bold text-ink rounded-xl border-2 border-border-subtle bg-surface py-1.5 focus:border-primary focus:outline-none"
            />
            <span className="text-xs font-heading font-bold text-ink-muted mt-1">
              sek
            </span>
          </div>
        </div>

        {/* Quick adjustments */}
        <div className="flex items-center gap-1.5 border-l border-border-subtle pl-3">
          <button
            type="button"
            onClick={() => adjustMinutes(5)}
            className="flex min-h-[38px] items-center justify-center rounded-xl bg-surface px-2.5 py-1.5 font-heading text-xs sm:text-sm font-bold text-ink border border-border-subtle hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
          >
            +5m
          </button>
          <button
            type="button"
            onClick={() => adjustMinutes(1)}
            className="flex min-h-[38px] items-center justify-center rounded-xl bg-surface px-2.5 py-1.5 font-heading text-xs sm:text-sm font-bold text-ink border border-border-subtle hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
          >
            +1m
          </button>
          <button
            type="button"
            onClick={() => adjustSeconds(30)}
            className="flex min-h-[38px] items-center justify-center rounded-xl bg-surface px-2.5 py-1.5 font-heading text-xs sm:text-sm font-bold text-ink border border-border-subtle hover:border-primary hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
          >
            +30s
          </button>
        </div>
      </div>

      {/* Item actions: Up, Down, Duplicate, Delete */}
      <div className="flex items-center gap-1.5 shrink-0 justify-end">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          title="Flytt opp"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-ink-muted hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowUp size={18} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === totalItems - 1}
          title="Flytt ned"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-ink-muted hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowDown size={18} />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          title="Dupliser intervall"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-ink-muted hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <Copy size={18} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Fjern intervall"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function OktBuilder({
  title,
  setTitle,
  intervals,
  setIntervals,
  onStartRun,
  onOpenPresets,
  onBackToOverview,
}) {
  const activeClass = useAppStore(
    (s) => s.classes[s.activeClassId] ?? { name: "Min klasse", students: [] }
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = intervals.findIndex((item) => item.id === active.id);
    const newIndex = intervals.findIndex((item) => item.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setIntervals(arrayMove(intervals, oldIndex, newIndex));
    }
  }

  function handleAddInterval(activityId = "lese") {
    const act = getActivity(activityId);
    const isAnnet = activityId === "annet";
    const newInterval = {
      id: crypto.randomUUID(),
      activityId,
      customTitle: isAnnet ? "" : act.name,
      minutes: 5,
      seconds: 0,
      isEditingTitle: isAnnet,
    };
    setIntervals([...intervals, newInterval]);
  }

  function handleUpdateInterval(index, updated) {
    const next = [...intervals];
    next[index] = updated;
    setIntervals(next);
  }

  function handleRemoveInterval(index) {
    setIntervals(intervals.filter((_, i) => i !== index));
  }

  function handleDuplicateInterval(index) {
    const item = intervals[index];
    const duplicated = {
      ...item,
      id: crypto.randomUUID(),
      customTitle: `${item.customTitle || getActivity(item.activityId).name}`,
    };
    const next = [...intervals];
    next.splice(index + 1, 0, duplicated);
    setIntervals(next);
  }

  function handleMoveUp(index) {
    if (index <= 0) return;
    setIntervals(arrayMove(intervals, index, index - 1));
  }

  function handleMoveDown(index) {
    if (index >= intervals.length - 1) return;
    setIntervals(arrayMove(intervals, index, index + 1));
  }

  const totalSeconds = intervals.reduce(
    (acc, item) =>
      acc + (Number(item.minutes) || 0) * 60 + (Number(item.seconds) || 0),
    0
  );

  const totalMins = Math.floor(totalSeconds / 60);
  const remainingSecs = totalSeconds % 60;

  return (
    <div className="space-y-6">
      {/* Back to overview button */}
      {onBackToOverview && (
        <div>
          <button
            type="button"
            onClick={onBackToOverview}
            className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border-2 border-border-subtle bg-surface px-5 py-2.5 font-heading text-base font-bold text-ink-muted hover:text-ink hover:border-primary/40 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft size={20} />
            Tilbake til øktoversikt
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-xl2 border-2 border-border-subtle bg-surface p-6 sm:p-8 shadow-clay">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-heading font-bold text-ink-muted uppercase tracking-wider">
            Navn på økten
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="f.eks. Dagens skrive- og leseløkt"
            className="w-full rounded-xl border-2 border-border-subtle bg-surface px-4 py-3 font-heading text-2xl sm:text-3xl font-bold text-ink focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenPresets}
            className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border-2 border-border-subtle bg-surface px-5 py-2.5 font-heading text-base font-bold text-ink shadow-sm hover:border-primary/50 hover:bg-primary/10 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            <FolderOpen size={20} className="text-primary" />
            Mal-arkiv
          </button>

          <button
            type="button"
            onClick={onStartRun}
            disabled={intervals.length === 0 || totalSeconds === 0}
            className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl bg-primary px-7 py-2.5 font-heading text-lg font-bold text-white shadow-clay hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Play size={22} className="fill-current" />
            Start økt ({totalMins}m)
          </button>
        </div>
      </div>

      {/* Classroom Activity Quick Add Palette */}
      <div className="rounded-xl2 border-2 border-border-subtle bg-surface p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl font-bold text-ink">
            Legg til aktivitet
          </h3>
          <span className="text-sm text-ink-muted font-body font-medium">
            Klikk for å legge til et nytt intervall
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
          {CLASSROOM_ACTIVITIES.map((act) => {
            const Icon = act.icon;
            return (
              <div className="relative group" key={act.id}>
                <button
                  type="button"
                  onClick={() => handleAddInterval(act.id)}
                  className="w-full flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-surface p-3 text-center transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl mb-2 transition-transform group-hover:scale-110 ${act.lightBg} ${act.textClass}`}
                  >
                    <Icon size={24} />
                  </div>
                  <span className="font-heading text-xs sm:text-sm font-bold text-ink line-clamp-1">
                    {act.shortName || act.name}
                  </span>
                </button>

                {/* Elegant Hover-boks Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:flex group-focus-within:flex flex-col gap-1.5 w-60 rounded-xl border-2 border-border-subtle bg-surface p-3.5 shadow-2xl z-50 animate-fade-in text-left">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${act.lightBg} ${act.textClass}`}>
                      <Icon size={18} />
                    </span>
                    <span className="font-heading text-sm font-bold text-ink leading-tight">
                      {act.name}
                    </span>
                  </div>
                  {act.description && (
                    <p className="font-body text-xs font-medium text-ink-muted leading-snug">
                      {act.description}
                    </p>
                  )}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-surface border-b-2 border-r-2 border-border-subtle rotate-45" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Intervals List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <h3 className="font-heading text-2xl font-bold text-ink">
              Tidsintervaller ({intervals.length})
            </h3>
            <span className="rounded-full bg-primary/10 px-3.5 py-1 font-heading text-sm font-bold text-primary">
              Totaltid: {totalMins} min {remainingSecs > 0 ? `${remainingSecs} sek` : ""}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAddInterval("lese")}
            className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/10 px-5 py-2 font-heading text-base font-bold text-primary hover:bg-primary/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus size={18} />
            Legg til intervall
          </button>
        </div>

        {intervals.length === 0 ? (
          <div className="rounded-xl2 border-2 border-dashed border-border-subtle p-12 text-center bg-surface">
            <Clock className="mx-auto h-14 w-14 text-ink-muted/40 mb-3" />
            <p className="font-heading text-xl font-bold text-ink">
              Ingen intervaller i økten enda
            </p>
            <p className="font-body text-base text-ink-muted mt-1 max-w-md mx-auto">
              Velg en aktivitet fra listen over eller klikk "Legg til intervall" for å bygge opp økten.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={intervals.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {intervals.map((interval, index) => (
                  <SortableIntervalItem
                    key={interval.id}
                    interval={interval}
                    index={index}
                    totalItems={intervals.length}
                    students={activeClass.students}
                    activeClassName={activeClass.name}
                    onUpdate={(updated) => handleUpdateInterval(index, updated)}
                    onRemove={() => handleRemoveInterval(index)}
                    onDuplicate={() => handleDuplicateInterval(index)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
