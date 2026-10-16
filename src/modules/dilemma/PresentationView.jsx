import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Maximize2, Minimize2, X, RefreshCw } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { imageSrc } from "../../lib/tofakta";

function PresentationView({ sessionId, onBack }) {
  const session = useAppStore((s) => s.dilemmaSessions[sessionId]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const dilemmas = session?.dilemmas || [];
  const currentDilemma = dilemmas[currentIndex];

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "Escape" && !document.fullscreenElement) {
        onBack();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, dilemmas.length]);

  function handleNext() {
    if (currentIndex < dilemmas.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  if (!session || dilemmas.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-xl text-ink/70">Ingen dilemmaer funnet i denne økten.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-xl bg-primary px-4 py-2 font-heading font-semibold text-white"
        >
          Gå tilbake
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-950 text-white select-none">
      {/* Top Banner - Header & Question */}
      <div className="relative z-10 flex flex-col items-center justify-between border-b border-white/10 bg-slate-900/90 px-6 py-4 backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 font-heading text-sm font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} aria-hidden="true" />
            Avslutt visning
          </button>

          <div className="text-center">
            <span className="rounded-full bg-primary/20 px-3 py-1 font-heading text-xs font-bold uppercase tracking-wider text-primary-light">
              {session.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-semibold text-white/70">
              Dilemma {currentIndex + 1} av {dilemmas.length}
            </span>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Fullskjerm"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        {/* Big Dilemma Question */}
        <h1 className="mt-3 text-center font-heading text-3xl md:text-4xl font-extrabold text-white tracking-wide">
          {currentDilemma.title}
        </h1>
      </div>

      {/* Main Split Screen: Left vs Right */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/20">
        {/* Left Side - Alternativ A */}
        <div className="relative flex flex-col items-center justify-between bg-gradient-to-br from-cyan-950 via-sky-900 to-blue-950 p-6 md:p-12 text-center transition-all duration-300">
          {/* Top Indicator Badge */}
          <div className="flex items-center gap-3 rounded-full bg-cyan-500/20 px-6 py-2 border border-cyan-400/40 text-cyan-300 backdrop-blur-sm animate-pulse">
            <ArrowLeft size={24} className="text-cyan-400" />
            <span className="font-heading text-lg font-black uppercase tracking-widest">
              GÅ TIL VENSTRE
            </span>
          </div>

          {/* Option Content */}
          <div className="my-auto flex flex-col items-center gap-6 max-w-xl">
            {currentDilemma.leftOption.icon && (
              <span className="text-7xl md:text-8xl filter drop-shadow-lg transform transition-transform hover:scale-110">
                {currentDilemma.leftOption.icon}
              </span>
            )}

            {currentDilemma.leftOption.imagePath && (
              <img
                src={imageSrc(currentDilemma.leftOption.imagePath)}
                alt="Venstre alternativ"
                className="max-h-64 rounded-2xl object-cover shadow-2xl border-4 border-cyan-400/30"
              />
            )}

            <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-cyan-50 leading-tight drop-shadow-md">
              {currentDilemma.leftOption.text || "Alternativ A"}
            </h2>
          </div>

          <div className="text-cyan-400/60 font-heading text-sm font-semibold uppercase tracking-wider">
            Alternativ A
          </div>
        </div>

        {/* Right Side - Alternativ B */}
        <div className="relative flex flex-col items-center justify-between bg-gradient-to-br from-amber-950 via-orange-900 to-rose-950 p-6 md:p-12 text-center transition-all duration-300">
          {/* Top Indicator Badge */}
          <div className="flex items-center gap-3 rounded-full bg-amber-500/20 px-6 py-2 border border-amber-400/40 text-amber-300 backdrop-blur-sm animate-pulse">
            <span className="font-heading text-lg font-black uppercase tracking-widest">
              GÅ TIL HØYRE
            </span>
            <ArrowRight size={24} className="text-amber-400" />
          </div>

          {/* Option Content */}
          <div className="my-auto flex flex-col items-center gap-6 max-w-xl">
            {currentDilemma.rightOption.icon && (
              <span className="text-7xl md:text-8xl filter drop-shadow-lg transform transition-transform hover:scale-110">
                {currentDilemma.rightOption.icon}
              </span>
            )}

            {currentDilemma.rightOption.imagePath && (
              <img
                src={imageSrc(currentDilemma.rightOption.imagePath)}
                alt="Høyre alternativ"
                className="max-h-64 rounded-2xl object-cover shadow-2xl border-4 border-amber-400/30"
              />
            )}

            <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-amber-50 leading-tight drop-shadow-md">
              {currentDilemma.rightOption.text || "Alternativ B"}
            </h2>
          </div>

          <div className="text-amber-400/60 font-heading text-sm font-semibold uppercase tracking-wider">
            Alternativ B
          </div>
        </div>
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 bg-slate-900/90 px-6 py-4 backdrop-blur-md">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-heading font-bold text-white transition-all hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={24} />
          <span>Forrige</span>
        </button>

        {/* Progress dots or indicators */}
        <div className="hidden sm:flex items-center gap-2">
          {dilemmas.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-3 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-8 bg-primary"
                  : "w-3 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Gå til dilemma ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === dilemmas.length - 1}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-heading font-bold text-white transition-all hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
        >
          <span>Neste dilemma</span>
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

export default PresentationView;
