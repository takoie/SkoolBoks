import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function ClassListEditor({ classId, onBack }) {
  const classes = useAppStore((s) => s.classes);
  const renameClass = useAppStore((s) => s.renameClass);
  const setStudents = useAppStore((s) => s.setStudents);
  const resetDrawn = useAppStore((s) => s.resetDrawn);

  const activeClass = classes[classId] ?? { name: "", students: [] };
  const [draft, setDraft] = useState("");
  const [nameDraft, setNameDraft] = useState(activeClass.name);

  useEffect(() => {
    setNameDraft(activeClass.name);
    setDraft("");
  }, [classId, activeClass.name]);

  function handleSaveNames() {
    const names = draft
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setStudents(classId, [...activeClass.students, ...names]);
    resetDrawn(classId);
    setDraft("");
  }

  function handleRemoveStudent(name) {
    setStudents(
      classId,
      activeClass.students.filter((s) => s !== name)
    );
    resetDrawn(classId);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex cursor-pointer items-center gap-2 font-heading font-semibold text-primary transition-colors hover:text-primary-hover"
      >
        <ArrowLeft size={20} aria-hidden="true" />
        Tilbake til navnelister
      </button>

      <h2 className="mb-6 font-heading text-3xl font-semibold text-ink">
        Rediger navneliste
      </h2>

      <label className="mb-6 block">
        <span className="mb-2 block font-heading text-lg font-semibold text-ink">
          Navn på listen
        </span>
        <input
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => renameClass(classId, nameDraft)}
          className="min-h-touch w-full rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink"
        />
      </label>

      <label className="mb-2 block">
        <span className="mb-2 block font-heading text-lg font-semibold text-ink">
          Lim inn navn (ett navn per linje)
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
        className="mb-8 flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-6 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={20} aria-hidden="true" />
        Legg til navn
      </button>

      <h3 className="mb-3 font-heading text-xl font-semibold text-ink">
        Navn ({activeClass.students.length})
      </h3>
      {activeClass.students.length === 0 ? (
        <p className="text-lg text-ink/60">
          Ingen navn lagt til ennå. Lim inn navn over for å komme i gang.
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

export default ClassListEditor;
