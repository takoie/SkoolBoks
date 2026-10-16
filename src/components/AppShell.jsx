import { useState, useEffect } from "react";
import { Home, Users, Volume2, VolumeX, Info, HelpCircle, StickyNote } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import Select from "./Select";
import AboutModal from "./AboutModal";
import PinUnlockModal from "./PinUnlockModal";
import OnboardingWizard from "./OnboardingWizard";
import Logo from "./Logo";

function AppShell({ children }) {
  const [showInfo, setShowInfo] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isHydrated, setIsHydrated] = useState(
    () => useAppStore.persist?.hasHydrated?.() ?? false
  );

  const isAppUnlocked = useAppStore((s) => s.isAppUnlocked);
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
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

  useEffect(() => {
    if (useAppStore.persist?.hasHydrated?.()) {
      setIsHydrated(true);
    }
    const unsubFinish = useAppStore.persist?.onFinishHydration?.(() => {
      setIsHydrated(true);
    });

    return () => {
      unsubFinish?.();
    };
  }, []);

  useEffect(() => {
    if (isHydrated) {
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    }
  }, [isHydrated, hasSeenOnboarding]);

  function handleClassChange(id) {
    if (id === activeClassId) return;
    if (classSwitchGuard && !window.confirm(classSwitchGuard.message)) return;
    setActiveClassId(id);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <header className="relative z-10 flex items-center justify-between gap-4 border-b-2 border-border-subtle bg-surface px-5 py-3 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.18)]">
        <div className="flex flex-1 basis-0 items-center justify-start gap-3">
          {activeModule !== "dashboard" && (
            <button
              type="button"
              onClick={() => setActiveModule("dashboard")}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-primary transition-all duration-150 hover:bg-primary/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Tilbake til dashbord"
            >
              <Home size={24} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveModule("classlist")}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-5 font-heading font-semibold text-sm sm:text-base text-primary transition-colors hover:bg-primary/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Users size={20} aria-hidden="true" />
            Navnelister
          </button>
        </div>

        <div className="flex shrink-0 items-center justify-center">
          <Logo />
        </div>

        <div className="flex flex-1 basis-0 items-center justify-end gap-2 sm:gap-3">
          <Select
            value={activeClassId ?? ""}
            onChange={handleClassChange}
            ariaLabel="Bytt klasse"
            options={Object.entries(classes).map(([id, c]) => ({
              value: id,
              label: `${c.name} · ${c.students.length} navn`,
            }))}
            className="h-11 rounded-full border-2 border-primary/20 bg-primary/10 px-4 font-body text-sm sm:text-base font-semibold text-primary"
          />
          <button
            type="button"
            onClick={() => setSettings({ soundEnabled: !soundEnabled })}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-all duration-150 hover:bg-primary/10 hover:text-primary active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={soundEnabled ? "Skru av lyd" : "Skru på lyd"}
          >
            {soundEnabled ? (
              <Volume2 size={22} aria-hidden="true" />
            ) : (
              <VolumeX size={22} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-all duration-150 hover:bg-primary/10 hover:text-primary active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Om SkoolBoks"
          >
            <Info size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-all duration-150 hover:bg-primary/10 hover:text-primary active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Omvisning / Hjelp"
          >
            <HelpCircle size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      {showInfo && <AboutModal onClose={() => setShowInfo(false)} />}
      {showOnboarding && (
        <OnboardingWizard onClose={() => setShowOnboarding(false)} />
      )}
      {!isAppUnlocked && <PinUnlockModal />}

      <main className="flex-1 overflow-y-auto p-8">
        <div key={activeModule} className="animate-fade-slide-up">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AppShell;
