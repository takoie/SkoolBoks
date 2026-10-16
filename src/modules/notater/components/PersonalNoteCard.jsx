import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Lock,
  Unlock,
  Trash2,
  Tag,
  KeyRound,
  Calendar,
  Bold,
  Italic,
  List,
  Type,
  ArrowLeft,
  ArrowRight,
  Maximize2,
} from "lucide-react";
import { NOTE_COLORS } from "../../../lib/notaterTypes";

export default function PersonalNoteCard({
  note,
  isUnlocked,
  onUpdate,
  onDeleteRequest,
  onToggleLock,
  onRemovePassword,
  onUnlockPrompt,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  onFocusNote,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const colorObj =
    NOTE_COLORS.find((c) => c.id === note.color) || NOTE_COLORS[0];

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("no-NO", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const fontSizeClass =
    note.fontSize === "lg"
      ? "text-lg"
      : note.fontSize === "xl"
      ? "text-xl font-medium"
      : note.fontSize === "sm"
      ? "text-xs"
      : "text-sm";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col rounded-2xl border-2 ${colorObj.border} ${colorObj.bg} ${colorObj.text} shadow-md ${
        isDragging ? "shadow-2xl ring-4 ring-primary/50" : "hover:-translate-y-1 hover:shadow-xl"
      }`}
    >
      {/* Card Header with Drag Handle, Quick Order Arrows & Category */}
      <div
        className={`flex items-center justify-between border-b ${colorObj.border} ${colorObj.header} px-3 py-2 rounded-t-2xl select-none`}
      >
        {/* Drag handle & Quick Order buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-slate-800 hover:text-slate-950 hover:bg-black/10 rounded"
            title="Dra for å endre rekkefølge"
          >
            <GripVertical size={16} />
          </button>

          {/* Quick Order Left/Right Buttons */}
          <button
            type="button"
            onClick={onMoveLeft}
            disabled={!canMoveLeft}
            className="p-1 text-slate-800 hover:text-slate-950 hover:bg-black/10 rounded disabled:opacity-30 disabled:pointer-events-none"
            title="Flytt før"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveRight}
            disabled={!canMoveRight}
            className="p-1 text-slate-800 hover:text-slate-950 hover:bg-black/10 rounded disabled:opacity-30 disabled:pointer-events-none"
            title="Flytt etter"
          >
            <ArrowRight size={14} />
          </button>

          <div className="flex items-center gap-1 ml-1">
            <Tag size={13} className="opacity-70 text-slate-900" />
            <input
              type="text"
              list={`category-options-${note.id}`}
              spellCheck={false}
              value={note.category || ""}
              onChange={(e) => onUpdate({ category: e.target.value })}
              placeholder="Kategori..."
              disabled={!isUnlocked}
              className="w-20 bg-transparent font-heading text-xs font-bold uppercase tracking-wider text-slate-950 placeholder:text-slate-700/60 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onFocusNote && onFocusNote(note.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-950 transition-colors hover:bg-black/10"
            title="Framhev notat (vis kun dette notatet)"
          >
            <Maximize2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => onToggleLock(note)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-950 transition-colors hover:bg-black/10"
            title={
              note.isLocked
                ? isUnlocked
                  ? "Lås notat (skjul innhold)"
                  : "Låst med passord - klikk for å låse opp"
                : "Beskytt med passord"
            }
          >
            {note.isLocked ? (
              isUnlocked ? (
                <Unlock size={14} />
              ) : (
                <Lock size={14} />
              )
            ) : (
              <KeyRound size={14} />
            )}
          </button>

          <button
            type="button"
            onClick={() => onDeleteRequest(note)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-950 transition-colors hover:bg-red-500/20 hover:text-red-700"
            title="Slett notat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Formatting toolbar when note is unlocked */}
      {isUnlocked && (
        <div
          className={`flex items-center justify-between border-b ${colorObj.border} px-3 py-1 bg-black/5 text-slate-950 text-xs`}
        >
          {/* Bold, Italic, Bullet list toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdate({ isBold: !note.isBold })}
              className={`flex h-6 w-6 items-center justify-center rounded-md font-bold transition-colors ${
                note.isBold ? "bg-black/20 text-slate-950" : "hover:bg-black/10"
              }`}
              title="Fet skrift"
            >
              <Bold size={13} />
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ isItalic: !note.isItalic })}
              className={`flex h-6 w-6 items-center justify-center rounded-md italic transition-colors ${
                note.isItalic ? "bg-black/20 text-slate-950" : "hover:bg-black/10"
              }`}
              title="Kursiv skrift"
            >
              <Italic size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                const current = note.content || "";
                const hasBullet = current.startsWith("- ");
                const next = hasBullet ? current.replace(/^- /gm, "") : `- ${current}`;
                onUpdate({ content: next });
              }}
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-black/10"
              title="Punktliste"
            >
              <List size={13} />
            </button>
          </div>

          {/* Font size selector */}
          <div className="flex items-center gap-1">
            <Type size={12} className="opacity-70" />
            <select
              value={note.fontSize || "base"}
              onChange={(e) => onUpdate({ fontSize: e.target.value })}
              className="bg-transparent font-heading text-[11px] font-bold text-slate-950 focus:outline-none cursor-pointer"
            >
              <option value="sm">Liten</option>
              <option value="base">Normal</option>
              <option value="lg">Stor</option>
              <option value="xl">Ekstra stor</option>
            </select>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4 space-y-3 min-h-[160px]">
        {note.isLocked && !isUnlocked ? (
          /* Locked view */
          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center text-slate-950">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/10 mb-2">
              <Lock size={24} />
            </div>
            <h4 className="font-heading text-sm font-bold opacity-90">
              {note.title || "Passordbeskyttet notat"}
            </h4>
            <p className="font-body text-xs opacity-75 mt-1">Innholdet er skjult</p>
            <button
              type="button"
              onClick={() => onUnlockPrompt(note.id)}
              className="mt-3 rounded-full bg-black/15 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-black/25"
            >
              Lås opp
            </button>
          </div>
        ) : (
          /* Unlocked view */
          <>
            <input
              type="text"
              spellCheck={false}
              value={note.title || ""}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Tittel..."
              className={`w-full bg-transparent font-heading font-bold text-slate-950 placeholder:text-slate-700/50 focus:outline-none ${
                note.isBold ? "font-black" : ""
              } ${note.isItalic ? "italic" : ""}`}
            />

            <textarea
              spellCheck={false}
              value={note.content || ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="Skriv notatet ditt her..."
              rows={5}
              className={`w-full flex-1 resize-none bg-transparent font-body text-slate-950 placeholder:text-slate-700/50 focus:outline-none ${fontSizeClass} ${
                note.isBold ? "font-bold" : ""
              } ${note.isItalic ? "italic" : ""}`}
            />
          </>
        )}
      </div>

      {/* Card Footer: Creation Date & Palette */}
      <div
        className={`flex items-center justify-between border-t ${colorObj.border} px-3 py-2 text-xs text-slate-950 rounded-b-2xl`}
      >
        {/* Creation Date Badge */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-900 opacity-80" title="Opprettet dato">
          <Calendar size={12} />
          <span>{formatDate(note.createdAt)}</span>
        </div>

        {/* Color Palette Selector */}
        {isUnlocked && (
          <div className="flex items-center gap-1">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onUpdate({ color: c.id })}
                className={`h-4 w-4 rounded-full border border-black/30 transition-transform ${
                  note.color === c.id
                    ? "scale-125 ring-2 ring-black/40"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: c.accent }}
                title={c.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
