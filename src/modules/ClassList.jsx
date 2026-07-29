import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

function ClassList() {
  const classes = useAppStore((s) => s.classes);
  const activeClassId = useAppStore((s) => s.activeClassId);
  const setActiveClassId = useAppStore((s) => s.setActiveClassId);
  const createClass = useAppStore((s) => s.createClass);
  const renameClass = useAppStore((s) => s.renameClass);
  const deleteClass = useAppStore((s) => s.deleteClass);
  const setStudents = useAppStore((s) => s.setStudents);
  const resetDrawn = useAppStore((s) => s.resetDrawn);

  const activeClass = classes[activeClassId] ?? { name: "", students: [] };
  const [draft, setDraft] = useState("");
  const [nameDraft, setNameDraft] = useState(activeClass.name);

  useEffect(() => {
    setNameDraft(activeClass.name);
    setDraft("");
  }, [activeClassId, activeClass.name]);

  function handleSaveNames() {
    const names = draft
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setStudents(activeClassId, [...activeClass.students, ...names]);
    resetDrawn(activeClassId);
    setDraft("");
  }

  function handleRemoveStudent(name) {
    setStudents(
      activeClassId,
      activeClass.students.filter((s) => s !== name)
    );
    resetDrawn(activeClassId);
  }

  function handleNewClass() {
    const name = `Klasse ${Object.keys(classes).length + 1}`;
    createClass(name);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 font-heading text-3xl font-semibold text-ink">
        Klasseliste
      </h2>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={activeClassId ?? ""}
          onChange={(e) => setActiveClassId(e.target.value)}
          className="min-h-touch cursor-pointer rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink"
        >
          {Object.entries(classes).map(([id, c]) => (
            <option key={id} value={id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleNewClass}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={20} aria-hidden="true" />
          Ny klasse
        </button>
        {Object.keys(classes).length > 1 && (
          <button
            type="button"
            onClick={() => deleteClass(activeClassId)}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 border-2 border-destructive/30 px-5 py-2 font-heading font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 size={20} aria-hidden="true" />
            Slett klasse
          </button>
        )}
      </div>

      <label className="mb-6 block">
        <span className="mb-2 block font-heading text-lg font-semibold text-ink">
          Klassenavn
        </span>
        <input
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => renameClass(activeClassId, nameDraft)}
          className="min-h-touch w-full rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink"
        />
      </label>

      <label className="mb-2 block">
        <span className="mb-2 block font-heading text-lg font-semibold text-ink">
          Lim inn elevnavn (ett navn per linje)
        </span>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          placeholder={"Ola Nordmann\nKari Nordmann\n..."}
          className="w-full rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-3 font-body text-lg text-ink"
        />
      </label>
      <button
        type="button"
        onClick={handleSaveNames}
        disabled={draft.trim().length === 0}
        className="mb-8 min-h-touch cursor-pointer rounded-xl2 bg-primary px-6 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        Legg til elever
      </button>

      <h3 className="mb-3 font-heading text-xl font-semibold text-ink">
        Elever ({activeClass.students.length})
      </h3>
      {activeClass.students.length === 0 ? (
        <p className="text-lg text-ink/60">
          Ingen elever lagt til ennå. Lim inn navn over for å komme i gang.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {activeClass.students.map((name) => (
            <li
              key={name}
              className="flex items-center gap-2 rounded-full bg-surface border-2 border-ink/10 px-4 py-2 font-body text-lg text-ink shadow-clay"
            >
              {name}
              <button
                type="button"
                onClick={() => handleRemoveStudent(name)}
                aria-label={`Fjern ${name}`}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ClassList;
