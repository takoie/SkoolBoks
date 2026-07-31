import { Home, Volume2, VolumeX } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

function AppShell({ children }) {
  const activeModule = useAppStore((s) => s.activeModule);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const classes = useAppStore((s) => s.classes);
  const activeClassId = useAppStore((s) => s.activeClassId);
  const setActiveClassId = useAppStore((s) => s.setActiveClassId);
  const classSwitchGuard = useAppStore((s) => s.classSwitchGuard);
  const activeClass = useAppStore(
    (s) => s.classes[s.activeClassId] ?? { name: "Ingen klasse valgt", students: [] }
  );
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const setSettings = useAppStore((s) => s.setSettings);

  function handleClassChange(id) {
    if (id === activeClassId) return;
    if (classSwitchGuard && !window.confirm(classSwitchGuard.message)) return;
    setActiveClassId(id);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <header className="flex min-h-touch items-center justify-between gap-4 border-b-2 border-ink/10 bg-surface px-6 py-3">
        <div className="flex items-center gap-4">
          {activeModule !== "dashboard" && (
            <button
              type="button"
              onClick={() => setActiveModule("dashboard")}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-primary transition-all duration-150 hover:bg-primary/10 active:scale-90"
              aria-label="Tilbake til dashbord"
            >
              <Home size={26} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="sr-only">Bytt klasse</span>
            <select
              value={activeClassId ?? ""}
              onChange={(e) => handleClassChange(e.target.value)}
              aria-label="Bytt klasse"
              className="min-h-touch cursor-pointer rounded-full border-2 border-primary/20 bg-primary/10 px-4 py-2 font-body text-base font-semibold text-primary"
            >
              {Object.entries(classes).map(([id, c]) => (
                <option key={id} value={id}>
                  {c.name} · {c.students.length} elever
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setSettings({ soundEnabled: !soundEnabled })}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-all duration-150 hover:bg-ink/10 active:scale-90"
            aria-label={soundEnabled ? "Skru av lyd" : "Skru på lyd"}
          >
            {soundEnabled ? (
              <Volume2 size={24} aria-hidden="true" />
            ) : (
              <VolumeX size={24} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div key={activeModule} className="animate-fade-slide-up">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AppShell;
