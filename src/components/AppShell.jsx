import { useState } from "react";
import { createPortal } from "react-dom";
import { Home, Users, Volume2, VolumeX, Info, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import Select from "./Select";

function AppShell({ children }) {
  const [showInfo, setShowInfo] = useState(false);
  const [showVipps, setShowVipps] = useState(false);
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
      <header className="relative z-10 flex min-h-touch items-center justify-between gap-4 border-b-2 border-ink/10 bg-surface px-6 py-3 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.18)]">
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3">
          <img src="/skoolbox-icon.png" alt="" className="h-9 w-9" aria-hidden="true" />
          <span className="font-heading text-2xl font-semibold tracking-wide text-ink">
            SkoolBox
          </span>
        </div>

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
          <button
            type="button"
            onClick={() => setActiveModule("classlist")}
            className="flex min-h-touch cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-4 py-2 font-heading font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <Users size={20} aria-hidden="true" />
            Navnelister
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={activeClassId ?? ""}
            onChange={handleClassChange}
            ariaLabel="Bytt klasse"
            options={Object.entries(classes).map(([id, c]) => ({
              value: id,
              label: `${c.name} · ${c.students.length} navn`,
            }))}
            className="min-h-touch rounded-full border-2 border-primary/20 bg-primary/10 px-4 py-2 font-body text-base font-semibold text-primary"
          />
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
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-ink/70 transition-all duration-150 hover:bg-ink/10 active:scale-90"
            aria-label="Om SkoolBox"
          >
            <Info size={24} aria-hidden="true" />
          </button>
        </div>
      </header>

      {showInfo &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
            onClick={() => setShowInfo(false)}
          >
            <div
              className="relative w-full max-w-md rounded-xl2 bg-surface p-8 shadow-clay animate-modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10"
                aria-label="Lukk"
              >
                <X size={18} aria-hidden="true" />
              </button>

              <div className="mb-4 flex items-center gap-3">
                <img src="/skoolbox-icon.png" alt="" className="h-9 w-9" aria-hidden="true" />
                <span className="font-heading text-xl font-semibold text-ink">Om SkoolBox</span>
              </div>

              <div className="flex flex-col gap-3 font-body text-base text-ink/80">
                <p>
                  SkoolBox er laget for å samle nyttige verktøy, aktiviteter og
                  undervisningsopplegg på ett og samme sted, så alt du trenger i
                  klasserommet er lett tilgjengelig.
                </p>
                <p>Laget av Stian Taknæs.</p>
                <p>
                  Har du lyst på flere moduler, eller sitter du med en idé? Send den
                  gjerne til{" "}
                  <a href="mailto:stian@taknes.no" className="font-semibold text-primary underline">
                    stian@taknes.no
                  </a>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowVipps(true)}
                className="mt-6 flex min-h-touch w-full cursor-pointer items-center justify-center gap-3 rounded-xl2 bg-[#ff5b24] px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:brightness-95 active:scale-[0.97]"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-heading text-base font-bold text-[#ff5b24]"
                  aria-hidden="true"
                >
                  V
                </span>
                Setter du pris på SkoolBox?
              </button>
            </div>
          </div>,
          document.body
        )}

      {showVipps &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 animate-fade-in"
            onClick={() => setShowVipps(false)}
          >
            <div
              className="w-full max-w-sm rounded-xl2 bg-surface p-8 text-center shadow-clay animate-modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff5b24] font-heading text-2xl font-bold text-white"
                aria-hidden="true"
              >
                V
              </span>
              <p className="mb-2 font-body text-base text-ink/70">Spons en lunsj på Vipps</p>
              <p className="mb-6 font-heading text-4xl font-bold tracking-wide text-ink">
                970 33 580
              </p>
              <button
                type="button"
                onClick={() => setShowVipps(false)}
                className="flex min-h-touch w-full cursor-pointer items-center justify-center rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-all duration-150 hover:bg-ink/5 active:scale-[0.97]"
              >
                Lukk
              </button>
            </div>
          </div>,
          document.body
        )}

      <main className="flex-1 overflow-y-auto p-8">
        <div key={activeModule} className="animate-fade-slide-up">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AppShell;
