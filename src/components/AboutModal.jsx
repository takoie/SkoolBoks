import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Info, ShieldCheck, X, Settings, Lock } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAppStore } from "../store/useAppStore";

import AboutTabInfo from "./about/AboutTabInfo";
import AboutTabSettings from "./about/AboutTabSettings";
import AboutTabPrivacy from "./about/AboutTabPrivacy";
import AboutTabLicenses from "./about/AboutTabLicenses";

const LICENSES = [
  {
    category: "Kjerne og rammeverk",
    items: [
      {
        name: "React og React DOM",
        version: "^19.1.0",
        license: "MIT",
        description: "Deklarativt UI-bibliotek for effektiv komponentbasert bygging.",
      },
      {
        name: "Tauri Framework og tillegg",
        version: "^2.0.0",
        license: "MIT / Apache-2.0",
        description: "Sikkert og raskt skrivebordsrammeverk med utvidelser for filsystem, utklippstavle og oppdateringer.",
      },
      {
        name: "Vite",
        version: "^7.0.4",
        license: "MIT",
        description: "Rask og moderne frontend-bygger for web og apper.",
      },
      {
        name: "Zustand",
        version: "^5.0.14",
        license: "MIT",
        description: "Enkel og rask tilstandshåndtering for React.",
      },
    ],
  },
  {
    category: "Brukergrensesnitt og animasjon",
    items: [
      {
        name: "Lucide React",
        version: "^1.27.0",
        license: "ISC",
        description: "Moderne og rene vektorikoner for grensesnittet.",
      },
      {
        name: "Font Awesome Free",
        version: "^7.3.1",
        license: "CC BY 4.0 / SIL OFL 1.1 / MIT",
        description: "Ikonsett og grafikk til spill og aktiviteter.",
      },
      {
        name: "Framer Motion",
        version: "^12.43.0",
        license: "MIT",
        description: "Sømløs animasjonsmotor for flytende interaksjoner.",
      },
      {
        name: "dnd-kit",
        version: "^6.3.1 / ^10.0.0",
        license: "MIT",
        description: "Dra-og-slipp-verktøy for navnelister og omorganisering.",
      },
      {
        name: "Canvas Confetti",
        version: "^1.9.4",
        license: "MIT",
        description: "Konfettianimasjoner for feiring og premier.",
      },
      {
        name: "Tailwind CSS",
        version: "^4.3.3",
        license: "MIT",
        description: "Utility-first CSS-rammeverk for styling.",
      },
    ],
  },
  {
    category: "Fonter og typografi",
    items: [
      {
        name: "Figtree Font",
        version: "^5.3.0 (via Fontsource)",
        license: "SIL Open Font License 1.1",
        description: "Ren og lesevennlig sans-serif-skrifttype for brødtekst.",
      },
      {
        name: "Bricolage Grotesque Font",
        version: "^5.3.0 (via Fontsource)",
        license: "SIL Open Font License 1.1",
        description: "Skrifttype med personlighet og god lesbarhet for overskrifter.",
      },
    ],
  },
];

export default function AboutModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("about");
  const modalRef = useRef(null);

  useEffect(() => {
    const previousActiveElement = document.activeElement;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const elements = Array.from(
          modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );
        if (elements.length === 0) return;

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [onClose]);

  const securitySettings = useAppStore((s) => s.securitySettings);
  const enablePinCode = useAppStore((s) => s.enablePinCode);
  const disablePinCode = useAppStore((s) => s.disablePinCode);
  const lockApp = useAppStore((s) => s.lockApp);

  const [pinInput, setPinInput] = useState("");
  const [pinFeedback, setPinFeedback] = useState("");

  const handleOpenLink = async (url) => {
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
        className="relative flex h-[90vh] max-h-[700px] w-full max-w-4xl flex-col rounded-xl2 bg-surface p-6 sm:p-8 shadow-clay animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-primary/10 hover:text-primary active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Lukk"
        >
          <X size={22} aria-hidden="true" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 flex shrink-0 flex-col gap-4 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Info size={24} aria-hidden="true" />
            </div>
            <div>
              <h2 id="about-modal-title" className="font-heading text-2xl font-bold text-ink">
                Om SkoolBoks
              </h2>
              <p className="font-body text-sm font-medium text-ink-muted">Versjon 0.5.0</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-canvas p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("about")}
              className={`flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 font-heading text-sm sm:text-base font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "about"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Info size={18} aria-hidden="true" className="shrink-0" />
              Om programmet
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 font-heading text-sm sm:text-base font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "settings"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Settings size={18} aria-hidden="true" className="shrink-0" />
              Innstillinger
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("privacy")}
              className={`flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 font-heading text-sm sm:text-base font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "privacy"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Lock size={18} aria-hidden="true" className="shrink-0" />
              Personvern og GDPR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("licenses")}
              className={`flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 font-heading text-sm sm:text-base font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "licenses"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <ShieldCheck size={18} aria-hidden="true" className="shrink-0" />
              Lisenser
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === "about" && <AboutTabInfo />}
          {activeTab === "settings" && (
            <AboutTabSettings
              securitySettings={securitySettings}
              enablePinCode={enablePinCode}
              disablePinCode={disablePinCode}
              lockApp={lockApp}
              onClose={onClose}
              pinInput={pinInput}
              setPinInput={setPinInput}
              pinFeedback={pinFeedback}
              setPinFeedback={setPinFeedback}
            />
          )}
          {activeTab === "privacy" && (
            <AboutTabPrivacy handleOpenLink={handleOpenLink} />
          )}
          {activeTab === "licenses" && (
            <AboutTabLicenses LICENSES={LICENSES} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
