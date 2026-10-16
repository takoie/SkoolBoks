import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useOrdskyStore } from "./store/useOrdskyStore";
import OverviewView from "./components/OverviewView";
import CanvasViewport from "./components/CanvasViewport";
import CanvasToolbar from "./components/CanvasToolbar";
import ImportWordsModal from "./components/ImportWordsModal";
import SessionManagerModal from "./components/SessionManagerModal";
import { GitFork, Presentation, LayoutGrid, Minimize2 } from "lucide-react";

export default function OrdskyTankekartArena() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isTavleModus, setIsTavleModus] = useState(false);

  const viewportRef = useRef(null);
  const activeTab = useOrdskyStore((s) => s.activeTab);
  const setActiveTab = useOrdskyStore((s) => s.setActiveTab);

  // Toggle true full screen Tavlemodus
  const handleToggleTavleModus = () => {
    const nextState = !isTavleModus;
    setIsTavleModus(nextState);

    if (nextState) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isTavleModus) {
        setIsTavleModus(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isTavleModus]);

  // Full-screen Tavlemodus rendered via Portal directly on document.body
  const renderTavleModusPortal = () => {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col w-screen h-screen bg-slate-950 text-white overflow-hidden animate-fade-in select-none">
        {/* Floating Classroom Toolbar */}
        <CanvasToolbar
          viewportRef={viewportRef}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenSessions={() => setIsSessionsOpen(true)}
          isTavleModus={true}
          onToggleTavleModus={handleToggleTavleModus}
        />

        {/* Pan and Zoom Canvas Viewport */}
        <div className="relative flex-1 w-full h-full">
          <CanvasViewport viewportRef={viewportRef} />
        </div>

        {/* Exit Tavlemodus Button overlay */}
        <button
          type="button"
          onClick={handleToggleTavleModus}
          className="absolute bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900/90 text-white px-5 py-3 text-xs font-bold shadow-2xl border border-white/20 hover:bg-slate-800 backdrop-blur-md transition-all active:scale-95"
        >
          <Minimize2 size={18} />
          <span>Avslutt tavlemodus</span>
        </button>

        {/* Modals inside Portal */}
        <ImportWordsModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
        <SessionManagerModal isOpen={isSessionsOpen} onClose={() => setIsSessionsOpen(false)} />
      </div>,
      document.body
    );
  };

  return (
    <div className="relative flex flex-col transition-all duration-200 w-full h-[calc(100vh-175px)] rounded-3xl overflow-hidden border-2 border-border-subtle bg-surface shadow-lg">
      {/* SkoolBoks Standard Light/Dark Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 border-border-subtle px-5 py-2.5 bg-surface z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white shadow-xs">
            <GitFork size={20} />
          </div>
          <div>
            <h1 className="font-heading text-base font-bold text-ink">
              Tankekart
            </h1>
            <p className="font-body text-[11px] text-slate-500 dark:text-slate-400">
              Visuelt tankekart og interaktiv tavle for klasserommet
            </p>
          </div>
        </div>

        {/* Top Tab Selector Toggle */}
        <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-canvas p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-heading text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <LayoutGrid size={15} />
            Mine tankekart
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tavle")}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-heading text-xs font-bold transition-all ${
              activeTab === "tavle"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <Presentation size={15} />
            Tavle og redigering
          </button>
        </div>
      </div>

      {/* Main Tab Content Views */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-canvas">
        {activeTab === "overview" ? (
          <div className="h-full overflow-y-auto p-4 sm:p-6 animate-fade-slide-up bg-canvas">
            <OverviewView onOpenImport={() => setIsImportOpen(true)} />
          </div>
        ) : (
          <div className="relative h-full w-full overflow-hidden animate-fade-in">
            {/* Floating Classroom Toolbar */}
            <CanvasToolbar
              viewportRef={viewportRef}
              onOpenImport={() => setIsImportOpen(true)}
              onOpenSessions={() => setIsSessionsOpen(true)}
              isTavleModus={false}
              onToggleTavleModus={handleToggleTavleModus}
            />

            {/* Pan and Zoom Canvas Viewport */}
            <CanvasViewport viewportRef={viewportRef} />
          </div>
        )}
      </div>

      {/* Render full screen Portal when Tavlemodus is active */}
      {isTavleModus && renderTavleModusPortal()}

      {/* Normal Modals */}
      {!isTavleModus && (
        <>
          <ImportWordsModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
          <SessionManagerModal isOpen={isSessionsOpen} onClose={() => setIsSessionsOpen(false)} />
        </>
      )}
    </div>
  );
}
