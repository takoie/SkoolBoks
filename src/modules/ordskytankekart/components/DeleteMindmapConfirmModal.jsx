import React from "react";
import { createPortal } from "react-dom";
import { Trash2, AlertTriangle } from "lucide-react";

export default function DeleteMindmapConfirmModal({ mindmapTitle, isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirmClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in pointer-events-auto select-none"
      onClick={handleBackdropClick}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-modal-in text-center"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Trash Alert Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 font-bold shadow-xs">
          <AlertTriangle size={28} />
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
            Slette tankekart?
          </h3>
          <p className="font-body text-xs text-slate-600 dark:text-slate-400">
            Er du sikker på at du vil slette tankekartet{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              "{mindmapTitle || "Dette tankekartet"}"
            </span>
            ? Det kan ikke angres.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 font-heading text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className="w-full rounded-2xl bg-rose-500 px-4 py-2.5 font-heading text-xs font-bold text-white shadow-md hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 size={15} />
            <span>Slett tankekart</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
