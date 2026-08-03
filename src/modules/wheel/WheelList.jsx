import { useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Play, Trash2, Plus } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function WheelList({ onOpen }) {
  const wheels = useAppStore((s) => s.wheels);
  const createWheel = useAppStore((s) => s.createWheel);
  const renameWheel = useAppStore((s) => s.renameWheel);
  const deleteWheel = useAppStore((s) => s.deleteWheel);

  const list = Object.values(wheels);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");

  function handleNewWheel() {
    setNewName(`Hjul ${list.length + 1}`);
    setShowCreate(true);
  }

  function confirmCreate() {
    const name = newName.trim() || `Hjul ${list.length + 1}`;
    const id = createWheel(name);
    setShowCreate(false);
    onOpen(id);
  }

  function startRename(wheel) {
    setRenamingId(wheel.id);
    setRenameDraft(wheel.name);
  }

  function commitRename() {
    if (renamingId) renameWheel(renamingId, renameDraft);
    setRenamingId(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-ink">Hjul</h2>
        <button
          type="button"
          onClick={handleNewWheel}
          className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-5 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={20} aria-hidden="true" />
          Nytt hjul
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-lg text-ink/60">
          Ingen hjul laget ennå. Klikk «Nytt hjul» for å komme i gang.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((wheel) => (
            <li
              key={wheel.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay"
            >
              <div className="min-w-0 flex-1">
                {renamingId === wheel.id ? (
                  <input
                    type="text"
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="w-full max-w-xs rounded-xl2 border-2 border-ink/10 bg-surface px-3 py-1 font-heading text-xl font-semibold text-ink"
                  />
                ) : (
                  <p className="font-heading text-xl font-semibold text-ink">
                    {wheel.name}
                  </p>
                )}
                <p className="text-base text-ink/60">
                  {wheel.sectors.length} sektorer
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(wheel.id)}
                  className="flex min-h-touch cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-4 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <Play size={18} aria-hidden="true" />
                  Åpne
                </button>
                <button
                  type="button"
                  onClick={() => startRename(wheel)}
                  aria-label={`Gi nytt navn til ${wheel.name}`}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10 hover:text-ink"
                >
                  <Pencil size={20} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteWheel(wheel.id)}
                  aria-label={`Slett ${wheel.name}`}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showCreate &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
            onClick={() => setShowCreate(false)}
          >
            <div
              className="w-full max-w-md rounded-xl2 bg-surface p-8 shadow-clay animate-modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 font-heading text-xl font-semibold text-ink">
                Navn på hjulet
              </h3>
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmCreate()}
                className="min-h-touch w-full rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-lg text-ink"
              />
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={confirmCreate}
                  className="flex min-h-touch flex-1 cursor-pointer items-center justify-center rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
                >
                  Opprett
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex min-h-touch flex-1 cursor-pointer items-center justify-center rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-all duration-150 hover:bg-ink/5 active:scale-[0.97]"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default WheelList;
