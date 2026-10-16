import { useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

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

function ModuleDrawer({ modules, categories = [], onRestore }) {
  const [isOpen, setIsOpen] = useState(false);

  if (modules.length === 0) return null;

  return (
    <div className="mt-8 border-t-2 border-dashed border-ink/10 pt-6">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 font-heading text-lg font-semibold text-ink/70 transition-colors hover:text-ink"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronUp size={20} aria-hidden="true" />
        ) : (
          <ChevronDown size={20} aria-hidden="true" />
        )}
        Skjulte moduler ({modules.length})
      </button>

      {isOpen && (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
          {modules.map((m) => (
            <div key={m.id} className="relative h-full">
              <button
                type="button"
                onClick={() => onRestore(m.id)}
                aria-label={`Vis ${m.title} på hovedsiden`}
                className="absolute -top-2 -right-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-surface bg-primary text-white shadow-clay transition-transform hover:scale-110"
              >
                <Plus size={16} strokeWidth={3} aria-hidden="true" />
              </button>
              <div className="flex h-full min-h-[180px] w-full flex-col justify-between rounded-xl2 border-2 border-ink/10 bg-surface p-6 text-left opacity-60 shadow-clay">
                <div className="flex flex-col items-start gap-4">
                  {m.image ? (
                    <img
                      src={m.image}
                      alt=""
                      aria-hidden="true"
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <span
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${accentClasses[m.accent]}`}
                    >
                      <m.icon size={28} strokeWidth={2} aria-hidden="true" />
                    </span>
                  )}
                  <span>
                    <span className="block font-heading text-2xl font-semibold text-ink">
                      {m.title}
                    </span>
                    <span className="mt-1 block text-base text-ink/70">
                      {m.description}
                    </span>
                  </span>
                </div>

                {categories.length > 0 && (
                  <div className="mt-4 pt-2 border-t border-ink/10">
                    <select
                      aria-label={`Vis ${m.title} i kategori`}
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onRestore(m.id, e.target.value);
                        }
                      }}
                      className="w-full cursor-pointer rounded-xl border border-ink/20 bg-surface px-2.5 py-1 font-body text-xs font-semibold text-ink shadow-sm transition-colors hover:border-primary focus:outline-none"
                    >
                      <option value="" disabled>
                        Vis i kategori...
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          📁 {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ModuleDrawer;
