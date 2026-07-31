import { Play, Trash2, Plus } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

function WheelList({ onOpen }) {
  const wheels = useAppStore((s) => s.wheels);
  const createWheel = useAppStore((s) => s.createWheel);
  const deleteWheel = useAppStore((s) => s.deleteWheel);

  const list = Object.values(wheels);

  function handleNewWheel() {
    const name = `Hjul ${list.length + 1}`;
    const id = createWheel(name);
    onOpen(id);
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
              <div>
                <p className="font-heading text-xl font-semibold text-ink">
                  {wheel.name}
                </p>
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
    </div>
  );
}

export default WheelList;
