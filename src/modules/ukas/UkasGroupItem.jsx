import { useState } from "react";
import {
  Check,
  RotateCcw,
  Calendar,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit2,
  ArrowRight,
  UserPlus,
  X,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function UkasGroupItem({
  group,
  index,
  totalCount,
  isCurrentWeek,
  onMarkCompleted,
  onMarkPlanned,
  onShiftRest,
  onUpdateGroup,
  onDeleteGroup,
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
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(group.name || "");
  const [studentsText, setStudentsText] = useState(
    (group.students || []).join(", ")
  );

  const isCompleted = group.status === "completed";

  function handleSaveEdit() {
    const parsedStudents = studentsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onUpdateGroup(group.id, {
      name: nameInput.trim() || `Gruppe ${index + 1}`,
      students: parsedStudents,
    });
    setIsEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl2 border-2 p-4 transition-all ${
        isDragging ? "z-20 opacity-50 shadow-2xl scale-[1.02]" : ""
      } ${
        isCompleted
          ? "border-emerald-500/30 bg-emerald-500/5 text-ink/70"
          : isCurrentWeek
          ? "border-primary bg-primary/10 shadow-clay ring-2 ring-primary/30"
          : "border-ink/10 bg-surface hover:border-ink/20"
      }`}
    >
      {/* Left side: Drag handle + week badge + group info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex h-8 w-6 cursor-grab items-center justify-center rounded text-ink/40 hover:bg-ink/5 hover:text-ink active:cursor-grabbing"
          title="Dra for å endre rekkefølge"
        >
          <GripVertical size={18} />
        </button>

        {/* Move up / down buttons for accessibility/keyboard users */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            className="flex h-4 w-4 items-center justify-center text-ink/40 hover:text-ink disabled:opacity-20 disabled:hover:text-ink/40 cursor-pointer"
            title="Flytt opp"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={index === totalCount - 1}
            onClick={() => onMoveDown(index)}
            className="flex h-4 w-4 items-center justify-center text-ink/40 hover:text-ink disabled:opacity-20 disabled:hover:text-ink/40 cursor-pointer"
            title="Flytt ned"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Week tag */}
        <div
          className={`flex flex-col items-center justify-center rounded-xl border px-3 py-1.5 min-w-[70px] text-center ${
            isCompleted
              ? "border-emerald-600/40 bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 font-bold"
              : isCurrentWeek
              ? "border-primary bg-primary text-white font-bold shadow-xs"
              : "border-ink/10 bg-canvas text-ink font-bold"
          }`}
        >
          <span className="font-heading text-xs uppercase font-bold tracking-wider">
            {group.assignedWeek ? `Uke ${group.assignedWeek}` : "Uten uke"}
          </span>
          {group.assignedYear && (
            <span className="font-body text-[10px] opacity-90 font-semibold">
              {group.assignedYear}
            </span>
          )}
        </div>

        {/* Group details or inline editor */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2 p-2 rounded-lg border border-primary/40 bg-canvas">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Gruppenavn (valgfritt)"
                className="w-full rounded-md border border-ink/10 bg-surface px-2 py-1 font-heading text-sm text-ink focus:outline-none"
              />
              <input
                type="text"
                value={studentsText}
                onChange={(e) => setStudentsText(e.target.value)}
                placeholder="Elever (separert med komma)"
                className="w-full rounded-md border border-ink/10 bg-surface px-2 py-1 font-body text-xs text-ink focus:outline-none"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-md bg-primary px-3 py-1 font-heading text-xs font-semibold text-white hover:bg-primary-hover"
                >
                  Lagre
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-md border border-ink/10 bg-surface px-2.5 py-1 font-heading text-xs text-ink hover:bg-ink/5"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h4
                  className={`font-heading text-base font-bold ${
                    isCompleted ? "line-through text-ink/60" : "text-ink"
                  }`}
                >
                  {group.name || `Gruppe ${index + 1}`}
                </h4>

                {isCurrentWeek && !isCompleted && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 font-heading text-[11px] font-bold text-primary animate-pulse">
                    🌟 NESTE UT
                  </span>
                )}
                {isCompleted && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-heading text-[11px] font-bold text-emerald-950 dark:text-emerald-100">
                    ✓ Gjennomført
                  </span>
                )}
              </div>

              {group.students && group.students.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.students.map((student, i) => (
                    <span
                      key={i}
                      className={`inline-block rounded-md px-2 py-0.5 font-body text-xs ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 font-semibold"
                          : "bg-canvas text-ink/90 border border-ink/10 font-semibold"
                      }`}
                    >
                      {student}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {!isCompleted ? (
          <button
            type="button"
            onClick={() => onMarkCompleted(group.id)}
            className="flex items-center gap-1.5 rounded-xl border-2 border-emerald-600 bg-emerald-600 px-3.5 py-1.5 font-heading text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <Check size={16} /> Markér som gjennomført
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onMarkPlanned(group.id)}
            className="flex items-center gap-1.5 rounded-xl border-2 border-ink/20 bg-canvas px-3 py-1.5 font-heading text-xs font-bold text-ink hover:bg-ink/5 transition-colors"
          >
            <RotateCcw size={14} /> Sett til planlagt
          </button>
        )}

        {!isCompleted && (
          <button
            type="button"
            onClick={() => onShiftRest(group.id)}
            className="flex items-center gap-1 rounded-xl border-2 border-amber-600 bg-amber-600 px-3 py-1.5 font-heading text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors"
            title="Utsatt – skyv denne og resten 1 uke fram"
          >
            <ArrowRight size={14} /> Skyv 1 uke
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-canvas text-ink/60 hover:text-ink hover:border-primary/40"
          title="Rediger gruppe / elever"
        >
          <Edit2 size={14} />
        </button>

        <button
          type="button"
          onClick={() => onDeleteGroup(group.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 bg-canvas text-ink/60 hover:text-destructive hover:border-destructive/40"
          title="Slett gruppe"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
