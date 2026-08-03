import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function ClassListOverview({ onEdit }) {
  const classes = useAppStore((s) => s.classes);
  const createClass = useAppStore((s) => s.createClass);
  const deleteClass = useAppStore((s) => s.deleteClass);

  const entries = Object.entries(classes);

  function handleNewList() {
    const name = `Navneliste ${entries.length + 1}`;
    const id = createClass(name);
    onEdit(id);
  }

  function handleDelete(id, name) {
    if (entries.length <= 1) return;
    if (!window.confirm(`Slette navnelisten "${name}"?`)) return;
    deleteClass(id);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-3xl font-semibold text-ink">
          Navnelister
        </h2>
        <button
          type="button"
          onClick={handleNewList}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={20} aria-hidden="true" />
          Ny navneliste
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-lg text-ink/60">
          Ingen navnelister opprettet ennå. Trykk «Ny navneliste» for å komme i gang.
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {entries.map(([id, c]) => (
            <li
              key={id}
              className="flex flex-col gap-3 rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay"
            >
              <div className="flex items-center gap-2">
                <Users size={20} className="text-primary" aria-hidden="true" />
                <span className="font-heading text-lg font-semibold text-ink">
                  {c.name}
                </span>
              </div>
              <span className="text-base text-ink/60">
                {c.students.length} navn
              </span>
              <div className="mt-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(id)}
                  className="flex min-h-touch flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary/10 px-4 py-2 font-heading font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <Pencil size={18} aria-hidden="true" />
                  Rediger
                </button>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(id, c.name)}
                    aria-label={`Slett ${c.name}`}
                    className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 border-2 border-destructive/30 px-4 py-2 font-heading font-semibold text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                    Slett
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ClassListOverview;
