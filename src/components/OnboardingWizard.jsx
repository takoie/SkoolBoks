import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  GraduationCap,
  Users,
  Grid3x3,
  Share2,
  Rocket,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";

const ONBOARDING_STEPS = [
  {
    title: "Velkommen til SkoolBoks",
    subtitle: "Kompakt verktøykasse for undervisningsopplegg og klasseromsaktiviteter.",
    icon: GraduationCap,
    accentColor: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/10 text-primary",
    content: (
      <div className="space-y-4 text-left">
        <div className="space-y-2">
          <p className="text-base text-ink font-bold leading-snug">
            SkoolBoks hjelper deg å planlegge, organisere og gjennomføre varierte undervisningsopplegg.
          </p>
          <p className="text-sm text-ink font-medium leading-snug">
            Alt fra interaktive samhandlingsøkter til faglige spill og elevtrekking samlet på én plass.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface p-3 text-xs font-bold text-ink border-2 border-ink/10 shadow-xs">
            <Sparkles size={18} className="text-primary shrink-0" />
            <span>Undervisningsopplegg</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-surface p-3 text-xs font-bold text-ink border-2 border-ink/10 shadow-xs">
            <Sparkles size={18} className="text-primary shrink-0" />
            <span>Klasseromsaktiviteter</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-surface p-3 text-xs font-bold text-ink border-2 border-ink/10 shadow-xs">
            <Sparkles size={18} className="text-primary shrink-0" />
            <span>Faglige spill og quizer</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-surface p-3 text-xs font-bold text-ink border-2 border-ink/10 shadow-xs">
            <Sparkles size={18} className="text-primary shrink-0" />
            <span>Elevtrekking og timer</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Klasser og navnelister",
    subtitle: "Bytt klasser sømløst og opprett tilpassede elevlister.",
    icon: Users,
    accentColor: "from-sky-500/20 to-blue-500/5",
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    content: (
      <div className="space-y-4 text-left">
        <p className="text-base text-ink font-bold leading-relaxed">
          I <strong>toppbanneret</strong> har du alltid en rullegardinmeny der du kan bytte aktiv klasse med ett klikk.
        </p>
        <div className="rounded-xl border-2 border-sky-500/20 bg-sky-500/5 p-4 space-y-2 text-sm text-ink">
          <p className="font-heading font-bold text-ink text-base">👥 Knappen «Navnelister»:</p>
          <p className="text-ink font-semibold leading-relaxed">
            Klikk på <strong>Navnelister</strong> i banneret for å legge til nye klasser eller importere og redigere elevnavn.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Moduler og dashbord",
    subtitle: "Organiser verktøyene i dine egne skuffer og kategorier.",
    icon: Grid3x3,
    accentColor: "from-amber-500/20 to-orange-500/5",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    content: (
      <div className="space-y-4 text-left">
        <p className="text-base text-ink font-bold leading-relaxed">
          SkoolBoks inneholder verktøy som <em>Jeopardy, Dilemma, Nedtelling, Gangemester, 2+1 fake, Adjektivfortelling, Hjul</em> og flere.
        </p>
        <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-4 space-y-2 text-sm text-ink">
          <p className="font-heading font-bold text-ink text-base">📂 Tilpass dashbordet:</p>
          <p className="text-ink font-semibold leading-relaxed">
            Du kan opprette egne <strong>kategoriskuffer</strong>, flytte moduler mellom dem og skjule moduler du sjelden bruker.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Deling og kollegasamarbeid",
    subtitle: "Del ferdige opplegg og økter med lærerkolleger.",
    icon: Share2,
    accentColor: "from-emerald-500/20 to-teal-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    content: (
      <div className="space-y-4 text-left">
        <p className="text-base text-ink font-bold leading-relaxed">
          Flere moduler har en egen <strong>«Del / Eksporter»</strong>-knapp.
        </p>
        <div className="rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2 text-sm text-ink">
          <p className="font-heading font-bold text-ink text-base">🔑 Delingskoder:</p>
          <p className="text-ink font-semibold leading-relaxed">
            Generer en delingskode og send den til en kollega. Kollegaen kan lime koden rett inn via <strong>«Importer»</strong> for å hente inn opplegget til sin SkoolBoks!
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Du er klar til å starte!",
    subtitle: "Utforsk og gjør undervisningen mer engasjerende.",
    icon: Rocket,
    accentColor: "from-purple-500/20 to-fuchsia-500/5",
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    content: (
      <div className="space-y-4 text-left">
        <div className="flex items-center gap-3.5 rounded-xl bg-purple-500/5 border-2 border-purple-500/20 p-4">
          <CheckCircle2 size={28} className="text-purple-600 dark:text-purple-400 shrink-0" />
          <p className="text-sm text-ink font-semibold leading-relaxed">
            Du kan når som helst åpne denne guiden igjen ved å klikke på <strong>spørsmålstegn-ikonet (?)</strong> i toppbanneret.
          </p>
        </div>
      </div>
    ),
  },
];

export default function OnboardingWizard({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);

  const step = ONBOARDING_STEPS[currentStep];
  const IconComponent = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        handleComplete();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  function handleComplete() {
    setHasSeenOnboarding(true);
    onClose();
  }

  function handleNext() {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm animate-fade-in"
      onClick={handleComplete}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-surface shadow-2xl animate-modal-in border-2 border-ink/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Accent Bar */}
        <div className={`bg-gradient-to-r ${step.accentColor} p-8 border-b border-ink/10 relative`}>
          <button
            type="button"
            onClick={handleComplete}
            aria-label="Lukk omvisning"
            className="absolute right-5 top-5 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface text-ink/70 border border-ink/20 transition-colors hover:bg-ink/10 hover:text-ink shadow-xs"
          >
            <X size={22} aria-hidden="true" />
          </button>

          <div className="flex items-center gap-5">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${step.iconBg} shrink-0`}>
              <IconComponent size={32} aria-hidden="true" />
            </div>
            <div>
              <span className="font-heading text-xs font-black uppercase tracking-widest text-primary">
                Steg {currentStep + 1} av {ONBOARDING_STEPS.length}
              </span>
              <h2 className="font-heading text-3xl font-black text-ink leading-tight">
                {step.title}
              </h2>
            </div>
          </div>

          <p className="mt-2.5 font-heading text-sm font-semibold text-ink/80">
            {step.subtitle}
          </p>
        </div>

        {/* Step Content */}
        <div className="p-8">
          {step.content}
        </div>

        {/* Step Indicators & Controls Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink/10 bg-background p-6">
          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                aria-label={`Gå til steg ${idx + 1}`}
                className={`h-3 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? "w-7 bg-primary shadow-xs"
                    : "w-3 bg-ink/20 border border-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex cursor-pointer items-center gap-1 rounded-xl border-2 border-ink/20 bg-surface px-3.5 py-2 font-heading text-xs font-bold text-ink hover:bg-ink/5 transition-colors shadow-xs"
              >
                <ChevronLeft size={16} />
                <span>Forrige</span>
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                onClick={handleComplete}
                className="rounded-xl border border-ink/20 bg-surface px-3 py-2 font-heading text-xs font-bold text-ink/80 hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
              >
                Hopp over
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 font-heading text-xs font-black text-white transition-colors hover:bg-primary-hover shadow-md"
            >
              <span>{isLastStep ? "Start å utforske SkoolBoks" : "Neste"}</span>
              {!isLastStep && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
