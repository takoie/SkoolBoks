import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useOrdskyStore } from "../store/useOrdskyStore";
import {
  parseWordList,
  layoutCloud,
  layoutCircle,
  layoutGrid,
  layoutTree,
} from "../utils/layoutAlgorithms";
import { X, FileText, Sparkles, Cloud, Grid, Circle, GitFork } from "lucide-react";

export default function ImportWordsModal({ isOpen, onClose }) {
  const [inputText, setInputText] = useState("");
  const [layoutChoice, setLayoutChoice] = useState("cloud");
  const [replaceExisting, setReplaceExisting] = useState(true);

  const importNodesAndLayout = useOrdskyStore((s) => s.importNodesAndLayout);
  const session = useOrdskyStore((s) => s.getActiveSession());
  const addNode = useOrdskyStore((s) => s.addNode);

  if (!isOpen) return null;

  const parsedNodes = parseWordList(inputText);

  const handleImport = () => {
    if (parsedNodes.length === 0) return;

    let finalNodes = parsedNodes;
    if (layoutChoice === "cloud") finalNodes = layoutCloud(parsedNodes);
    else if (layoutChoice === "circle") finalNodes = layoutCircle(parsedNodes);
    else if (layoutChoice === "grid") finalNodes = layoutGrid(parsedNodes);
    else if (layoutChoice === "tree") finalNodes = layoutTree(parsedNodes);

    if (replaceExisting) {
      importNodesAndLayout(finalNodes, layoutChoice, []);
    } else {
      // Append to current canvas offset
      const currentNodes = session?.nodes || [];
      const offsetY = currentNodes.length > 0 ? Math.max(...currentNodes.map((n) => n.y)) + 200 : 0;
      const shiftedNew = finalNodes.map((n) => ({ ...n, y: n.y + offsetY }));
      shiftedNew.forEach((n) => addNode(n));
    }

    setInputText("");
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in pointer-events-auto select-none">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-fade-slide-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                Importer ordliste
              </h2>
              <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                Lim inn tekst, linjeskift eller kommaseparerte ord
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Textarea */}
        <div>
          <label className="block font-heading text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Ordliste (f.eks. fra elevinnspill, chat eller tekst)
          </label>
          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Lim inn ord her, f.eks:&#10;Fotosyntese&#10;Klorofyll, Sollys, Vann, Oksygen&#10;Fotosyntese"
            className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 font-body text-xs text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
          />
          {parsedNodes.length > 0 && (
            <p className="mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Gjenkjente {parsedNodes.length} unike begreper
            </p>
          )}
        </div>

        {/* Layout Choice */}
        <div>
          <label className="block font-heading text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Velg startoppstilling (Layout)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "cloud", label: "Sentral klynge", icon: Cloud, color: "text-sky-500" },
              { id: "tree", label: "Tre-struktur", icon: GitFork, color: "text-emerald-500" },
              { id: "circle", label: "Sirkel", icon: Circle, color: "text-violet-500" },
              { id: "grid", label: "Rutenett", icon: Grid, color: "text-amber-500" },
            ].map((layout) => {
              const Icon = layout.icon;
              return (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => setLayoutChoice(layout.id)}
                  className={`flex items-center gap-2.5 rounded-2xl border-2 p-3 text-left transition-all ${
                    layoutChoice === layout.id
                      ? "border-primary bg-primary/5 text-primary shadow-xs"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <Icon size={18} className={layout.color} />
                  <span className="font-heading text-xs font-bold">{layout.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Replace vs Append Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="replaceExisting"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
            className="h-4 w-4 rounded-md border-slate-300 text-primary focus:ring-primary"
          />
          <label htmlFor="replaceExisting" className="font-body text-xs text-slate-600 dark:text-slate-400">
            Erstatt eksisterende tavle (eller legg til på gjeldende)
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 font-heading text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Avbryt
          </button>
          <button
            type="button"
            disabled={parsedNodes.length === 0}
            onClick={handleImport}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-heading text-xs font-bold text-white shadow-md hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-40"
          >
            <Sparkles size={16} />
            <span>Generer på tavlen ({parsedNodes.length})</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
