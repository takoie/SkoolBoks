import { Minus } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function ModuleCard({
  id,
  icon: Icon,
  image,
  title,
  description,
  accent = "primary",
  onClick,
  isEditMode = false,
  onRemove,
  categories = [],
  currentCategoryId,
  onMoveToCategory,
}) {
  // Soft tinted tile with an ink-toned glyph - keeps the per-module colour
  // coding without large saturated blocks competing with the content.
  const accentClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    lime: "bg-accent-lime/20 text-accent-lime-ink",
    peach: "bg-accent-peach/25 text-accent-peach-ink",
    coral: "bg-accent-coral/15 text-accent-coral-ink",
    teal: "bg-accent-teal/20 text-accent-teal-ink",
    sky: "bg-accent-sky/20 text-accent-sky-ink",
    violet: "bg-accent-violet/20 text-accent-violet-ink",
    fuchsia: "bg-accent-fuchsia/15 text-accent-fuchsia-ink",
    gold: "bg-accent-gold/20 text-accent-gold-ink",
    green: "bg-accent-green/20 text-accent-green-ink",
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative h-full ${isDragging ? "z-30 opacity-90 scale-[1.02]" : ""}`}
      {...(isEditMode ? attributes : {})}
      {...(isEditMode ? listeners : {})}
    >
      {isEditMode && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            aria-label={`Skjul ${title}`}
            className="absolute -top-3 -right-3 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-surface bg-destructive text-white shadow-clay transition-transform hover:scale-110 active:scale-95 focus-visible:ring-4 focus-visible:ring-primary"
          >
            <Minus size={20} strokeWidth={3} aria-hidden="true" />
          </button>

          {categories.length > 0 && onMoveToCategory && (
            <div
              className="absolute bottom-3 right-3 z-20"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <select
                aria-label={`Flytt ${title} til kategori`}
                value={currentCategoryId || ""}
                onChange={(e) => {
                  e.stopPropagation();
                  onMoveToCategory(e.target.value);
                }}
                className="cursor-pointer rounded-xl border border-border-subtle bg-surface/90 px-3 py-1.5 font-body text-xs font-semibold text-ink shadow-sm backdrop-blur-sm transition-colors hover:border-primary hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="" disabled>
                  Flytt til...
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    📁 {cat.name}
                  </option>
                ))}
                <option value="hidden">🙈 Skjulte moduler</option>
              </select>
            </div>
          )}
        </>
      )}
      <button
        type="button"
        onClick={isEditMode ? undefined : onClick}
        className={`group flex h-full min-h-[9.5rem] w-full flex-col items-start gap-3 rounded-xl2 border border-border-subtle bg-surface p-5 text-left shadow-clay transition-[border-color,box-shadow,transform] duration-150 ease-out focus-visible:ring-4 focus-visible:ring-primary ${
          isEditMode
            ? `${isDragging ? "shadow-2xl border-primary" : "animate-wiggle"} cursor-grab touch-none active:cursor-grabbing`
            : "cursor-pointer hover:border-primary/50 hover:shadow-lg focus-visible:border-primary/60 active:scale-[0.99] active:duration-75"
        }`}
      >
        {image ? (
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="h-12 w-12 rounded-xl object-cover"
          />
        ) : (
          <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${accentClasses[accent]}`}
          >
            <Icon size={24} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        <span>
          <span className="block font-heading text-xl font-semibold leading-tight text-ink">
            {title}
          </span>
          <span className="mt-1 block text-[0.95rem] leading-snug text-ink/65">{description}</span>
        </span>
      </button>
    </div>
  );
}

export default ModuleCard;
