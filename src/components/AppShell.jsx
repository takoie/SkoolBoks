import { Home, Volume2, VolumeX } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

function AppShell({ children }) {
  const activeModule = useAppStore((s) => s.activeModule);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const activeClass = useAppStore(
    (s) => s.classes[s.activeClassId] ?? { name: "Ingen klasse valgt", students: [] }
  );
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
  const setSettings = useAppStore((s) => s.setSettings);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex min-h-touch items-center justify-between gap-4 border-b-2 border-ink/10 bg-surface px-6 py-3">
        <div className="flex items-center gap-4">
          {activeModule !== "dashboard" && (
            <button
              type="button"
              onClick={() => setActiveModule("dashboard")}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
              aria-label="Tilbake til dashbord"
            >
              <Home size={26} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="rounded-full bg-primary/10 px-4 py-2 font-body text-base font-semibold text-primary">
            {activeClass.name} · {activeClass.students.length} elever
          </span>
          <button
            type="button"
            onClick={() => setSettings({ soundEnabled: !soundEnabled })}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/10"
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

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}

export default AppShell;
