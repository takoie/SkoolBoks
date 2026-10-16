import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function parseNames(text) {
  return text
    .split(/[\n;]/)
    .map((n) => n.trim())
    .filter(Boolean);
}

function ClassListEditor({ classId, onBack }) {
  const classes = useAppStore((s) => s.classes);
  const renameClass = useAppStore((s) => s.renameClass);
  const setStudents = useAppStore((s) => s.setStudents);
  const resetDrawn = useAppStore((s) => s.resetDrawn);

  const activeClass = classes[classId] ?? { name: "", students: [] };
  const [draft, setDraft] = useState("");
  const [nameDraft, setNameDraft] = useState(activeClass.name);
  const inputRef = useRef(null);

  useEffect(() => {
    setNameDraft(activeClass.name);
    setDraft("");
  }, [classId, activeClass.name]);

  // Takes one name (Enter) or many (pasted lines) and skips ones already in
  // the list - names double as React keys and removal targets.
  function addNames(text) {
    const known = new Set(activeClass.students.map((s) => s.toLowerCase()));
    const fresh = [];
    for (const name of parseNames(text)) {
      const key = name.toLowerCase();
      if (known.has(key)) continue;
      known.add(key);
      fresh.push(name);
    }
    if (fresh.length > 0) {
      setStudents(classId, [...activeClass.students, ...fresh]);
      resetDrawn(classId);
    }
    setDraft("");
    inputRef.current?.focus();
  }

  function handleRemoveStudent(name) {
    setStudents(
      classId,
      activeClass.students.filter((s) => s !== name)
    );
    resetDrawn(classId);
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text");
    if (!/[\n;]/.test(text)) return;
    e.preventDefault();
    addNames(text);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex cursor-pointer items-center gap-2 font-heading font-semibold text-primary transition-colors hover:text-primary-hover"
      >
        <ArrowLeft size={20} aria-hidden="true" />
        Navnelister
      </button>

      <input
        type="text"
        value={nameDraft}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={() => renameClass(classId, nameDraft)}
        aria-label="Navn på listen"
        className="mb-8 w-full rounded-xl2 border border-transparent bg-transparent px-2 py-1 font-heading text-3xl font-semibold text-ink transition-colors hover:border-ink/10 focus:border-primary focus:bg-surface focus:outline-none"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addNames(draft);
        }}
        className="mb-2 flex gap-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={handlePaste}
          placeholder="Skriv et navn og trykk Enter"
          aria-label="Legg til navn"
          className="min-h-touch min-w-0 flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={draft.trim().length === 0}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-6 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={20} aria-hidden="true" />
          Legg til
        </button>
      </form>
      <p className="mb-8 text-sm text-ink/60">
        Har du en hel liste? Lim den inn her, ett navn per linje.
      </p>

      <h3 className="mb-3 font-heading text-xl font-semibold text-ink">
        Navn ({activeClass.students.length})
      </h3>
      {activeClass.students.length === 0 ? (
        <p className="text-lg text-ink/60">Ingen navn ennå.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {activeClass.students.map((name) => (
            <li
              key={name}
              className="flex items-center gap-1 rounded-full border border-ink/10 bg-surface py-1 pl-4 pr-1 font-body text-lg text-ink"
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
