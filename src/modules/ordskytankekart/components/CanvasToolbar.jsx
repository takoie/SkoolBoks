import React, { useState } from "react";
import { useOrdskyStore } from "../store/useOrdskyStore";
import ThemeManagerModal from "./ThemeManagerModal";
import {
  layoutCloud,
  layoutCircle,
  layoutGrid,
  layoutTree,
} from "../utils/layoutAlgorithms";
import { exportToPng, exportToSvg, printCanvas } from "../utils/exportUtils";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  FileText,
  FolderOpen,
  Download,
  Printer,
  Sparkles,
  Grid,
  Circle,
  GitFork,
  Cloud,
  Undo,
  Redo,
  Trash2,
  Sun,
  Moon,
  Layout,
  Tag,
  ArrowLeft,
} from "lucide-react";

export default function CanvasToolbar({
  viewportRef,
  onOpenImport,
  onOpenSessions,
  isTavleModus,
  onToggleTavleModus,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);

  const session = useOrdskyStore((s) => s.getActiveSession());
  const canvasTheme = session?.canvasTheme || "light";
  const setCanvasTheme = useOrdskyStore((s) => s.setCanvasTheme);
  const setViewState = useOrdskyStore((s) => s.setViewState);
  const addNode = useOrdskyStore((s) => s.addNode);
  const applyLayout = useOrdskyStore((s) => s.applyLayout);
  const undo = useOrdskyStore((s) => s.undo);
  const redo = useOrdskyStore((s) => s.redo);
  const historyStack = useOrdskyStore((s) => s.historyStack);
  const redoStack = useOrdskyStore((s) => s.redoStack);
  const selectedNodeIds = useOrdskyStore((s) => s.selectedNodeIds);
  const deleteSelected = useOrdskyStore((s) => s.deleteSelected);
  const setActiveTab = useOrdskyStore((s) => s.setActiveTab);

  const title = session?.title || "Tankekart";

  const handleResetView = () => {
    setViewState({ zoom: 1, panX: 0, panY: 0 });
  };

  return (
    <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-30">
      {/* Left Toolbar Group */}
      <div className="flex items-center gap-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 p-1.5 shadow-xl backdrop-blur-md border border-slate-200/80 dark:border-slate-800 pointer-events-auto">
        {/* Tilbake til Mine tankekart (Hovedmeny) */}
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className="flex items-center gap-2 rounded-xl bg-primary text-white px-3.5 py-2 text-xs font-bold shadow-md hover:bg-primary-dark active:scale-95 transition-all"
        >
          <ArrowLeft size={16} />
          <span>Mine tankekart</span>
        </button>

        <button
          type="button"
          onClick={onOpenSessions}
          title="Bytt eller åpne lagret tankekart"
          className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <FolderOpen size={16} className="text-primary" />
          <span className="max-w-[120px] truncate">{title}</span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Legg til node */}
        <button
          type="button"
          onClick={() => addNode({ text: "Nytt begrep", x: 0, y: 0 })}
          className="flex items-center gap-1.5 rounded-xl bg-primary text-white px-3.5 py-2 text-xs font-bold shadow-md hover:bg-primary-dark active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>Legg til ord</span>
        </button>

        {/* Importer ordliste */}
        <button
          type="button"
          onClick={onOpenImport}
          className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-3.5 py-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <FileText size={16} className="text-emerald-500" />
          <span>Importer ordliste</span>
        </button>

        {/* Tema-organisering Button */}
        <button
          type="button"
          onClick={() => setIsThemeManagerOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-3.5 py-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <Tag size={16} className="text-amber-500" />
          <span>Temaer</span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Layout Preset Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowLayoutMenu(!showLayoutMenu);
              setShowThemeMenu(false);
              setShowExportMenu(false);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Sparkles size={16} className="text-amber-500" />
            <span>Organiser</span>
          </button>

          {showLayoutMenu && (
            <div
              className="absolute top-12 left-0 w-48 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-fade-slide-up"
              onClick={() => setShowLayoutMenu(false)}
            >
              <button
                type="button"
                onClick={() => applyLayout(layoutCloud, "cloud")}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Cloud size={16} className="text-sky-500" />
                Sentral klynge
              </button>
              <button
                type="button"
                onClick={() => applyLayout(layoutTree, "tree")}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <GitFork size={16} className="text-emerald-500" />
                Tre-struktur
              </button>
              <button
                type="button"
                onClick={() => applyLayout(layoutCircle, "circle")}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Circle size={16} className="text-violet-500" />
                Sirkel
              </button>
              <button
                type="button"
                onClick={() => applyLayout(layoutGrid, "grid")}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Grid size={16} className="text-amber-500" />
                Rutenett
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center Group: Undo/Redo & Delete */}
      <div className="flex items-center gap-1 rounded-2xl bg-white/95 dark:bg-slate-900/95 p-1.5 shadow-xl backdrop-blur-md border border-slate-200/80 dark:border-slate-800 pointer-events-auto">
        <button
          type="button"
          title="Angre (Ctrl+Z)"
          onClick={undo}
          disabled={historyStack.length === 0}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          title="Gjøre om (Ctrl+Y)"
          onClick={redo}
          disabled={redoStack.length === 0}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
        >
          <Redo size={16} />
        </button>

        {selectedNodeIds.length > 0 && (
          <>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <button
              type="button"
              title="Slett valgte"
              onClick={deleteSelected}
              className="flex items-center gap-1 rounded-xl bg-rose-500 text-white px-3 py-1.5 text-xs font-bold shadow-xs hover:bg-rose-600 transition-all"
            >
              <Trash2 size={14} />
              <span>Slett ({selectedNodeIds.length})</span>
            </button>
          </>
        )}
      </div>

      {/* Right Toolbar Group: Tavlebakgrunn & Zoom & Tavlemodus & Export */}
      <div className="flex items-center gap-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 p-1.5 shadow-xl backdrop-blur-md border border-slate-200/80 dark:border-slate-800 pointer-events-auto">
        {/* Tavlebakgrunn Theme Selector */}
        <div className="relative">
          <button
            type="button"
            title="Bytt tavlebakgrunn"
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowLayoutMenu(false);
              setShowExportMenu(false);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            {canvasTheme === "dark" ? (
              <Moon size={16} className="text-indigo-400" />
            ) : (
              <Sun size={16} className="text-amber-500" />
            )}
            <span>Tavle</span>
          </button>

          {showThemeMenu && (
            <div
              className="absolute top-12 right-0 w-44 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-fade-slide-up"
              onClick={() => setShowThemeMenu(false)}
            >
              <button
                type="button"
                onClick={() => setCanvasTheme("light")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                  canvasTheme === "light"
                    ? "bg-primary text-white"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Sun size={16} />
                Hvit tavle (Standard)
              </button>
              <button
                type="button"
                onClick={() => setCanvasTheme("dark")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                  canvasTheme === "dark"
                    ? "bg-primary text-white"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Moon size={16} />
                Mørk tavle
              </button>
              <button
                type="button"
                onClick={() => setCanvasTheme("dots")}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                  canvasTheme === "dots"
                    ? "bg-primary text-white"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Layout size={16} />
                Kremgul / Prikker
              </button>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Zoom ut"
            onClick={() => setViewState((vs) => ({ ...vs, zoom: Math.max(0.3, vs.zoom - 0.15) }))}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            title="Nullstill visning"
            onClick={handleResetView}
            className="flex h-9 px-2 items-center justify-center rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {Math.round((session?.viewState?.zoom || 1) * 100)}%
          </button>
          <button
            type="button"
            title="Zoom inn"
            onClick={() => setViewState((vs) => ({ ...vs, zoom: Math.min(2.5, vs.zoom + 0.15) }))}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Tavlemodus Toggle */}
        <button
          type="button"
          onClick={onToggleTavleModus}
          title="Tavlemodus"
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
            isTavleModus
              ? "bg-amber-500 text-white shadow-md"
              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Maximize2 size={16} />
          <span>Tavlemodus</span>
        </button>

        {/* Export & Print */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowExportMenu(!showExportMenu);
              setShowLayoutMenu(false);
              setShowThemeMenu(false);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Download size={16} className="text-sky-500" />
            <span>Eksport</span>
          </button>

          {showExportMenu && (
            <div
              className="absolute top-12 right-0 w-48 rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-fade-slide-up"
              onClick={() => setShowExportMenu(false)}
            >
              <button
                type="button"
                onClick={() => exportToPng(viewportRef.current, title)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Download size={16} className="text-sky-500" />
                Eksporter som PNG
              </button>
              <button
                type="button"
                onClick={() => exportToSvg(viewportRef.current, title)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Download size={16} className="text-emerald-500" />
                Eksporter som SVG
              </button>
              <button
                type="button"
                onClick={printCanvas}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Printer size={16} className="text-violet-500" />
                Utskrift (PDF)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Theme Manager Modal */}
      <ThemeManagerModal
        isOpen={isThemeManagerOpen}
        onClose={() => setIsThemeManagerOpen(false)}
      />
    </div>
  );
}
