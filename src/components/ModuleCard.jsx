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
}) {
  const accentClasses = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    lime: "bg-accent-lime text-accent-ink",
    peach: "bg-accent-peach text-accent-ink",
    coral: "bg-accent-coral text-accent-ink",
    teal: "bg-accent-teal text-accent-ink",
    sky: "bg-accent-sky text-accent-ink",
    violet: "bg-accent-violet text-accent-ink",
    fuchsia: "bg-accent-fuchsia text-accent-ink",
    gold: "bg-accent-gold text-accent-ink",
    green: "bg-accent-green text-accent-ink",
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
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative h-full ${isDragging ? "z-10 opacity-80" : ""}`}
      {...(isEditMode ? attributes : {})}
      {...(isEditMode ? listeners : {})}
    >
      {isEditMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label={`Skjul ${title}`}
          className="absolute -top-2 -right-2 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-surface bg-destructive text-white shadow-clay transition-transform hover:scale-110"
        >
          <Minus size={16} strokeWidth={3} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        onClick={isEditMode ? undefined : onClick}
        className={`group flex h-full min-h-[180px] w-full flex-col items-start gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-6 text-left shadow-clay transition-all duration-200 ease-out ${
          isEditMode
            ? "animate-wiggle cursor-grab touch-none active:cursor-grabbing"
            : "cursor-pointer hover:-translate-y-1 hover:border-primary/40 focus-visible:-translate-y-1 active:translate-y-0 active:scale-[0.98] active:duration-75"
        }`}
      >
        {image ? (
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="h-14 w-14 rounded-2xl object-cover"
          />
        ) : (
          <span
            className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${accentClasses[accent]}`}
          >
            <Icon size={28} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        <span>
          <span className="block font-heading text-2xl font-semibold text-ink">
            {title}
          </span>
          <span className="mt-1 block text-base text-ink/70">{description}</span>
        </span>
      </button>
    </div>
  );
}

export default ModuleCard;
