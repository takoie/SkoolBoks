import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useOrdskyStore } from "../store/useOrdskyStore";
import DeleteMindmapConfirmModal from "./DeleteMindmapConfirmModal";
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  GitFork,
} from "lucide-react";

export default function SessionManagerModal({ isOpen, onClose }) {
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Naturfag");
  const [editingId, setEditingId] = useState(null);
  const [editTitleText, setEditTitleText] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const sessions = useOrdskyStore((s) => s.sessions);
  const activeSessionId = useOrdskyStore((s) => s.activeSessionId);
  const createSession = useOrdskyStore((s) => s.createSession);
  const switchSession = useOrdskyStore((s) => s.switchSession);
  const deleteSession = useOrdskyStore((s) => s.deleteSession);
  const duplicateSession = useOrdskyStore((s) => s.duplicateSession);
  const updateSessionTitle = useOrdskyStore((s) => s.updateSessionTitle);

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createSession(newTitle.trim(), newCategory);
    setNewTitle("");
    onClose();
  };

  const handleStartRename = (session) => {
    setEditingId(session.id);
    setEditTitleText(session.title);
  };

  const handleSaveRename = (id) => {
    if (editTitleText.trim()) {
      updateSessionTitle(editTitleText.trim());
    }
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete.id);
      setSessionToDelete(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in pointer-events-auto select-none">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-fade-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
              <FolderOpen size={22} />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                Mine lagrede økter
              </h2>
              <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                Opprett, åpne eller administrer ordskyer og tankekart
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

        {/* Create New Session Input Form */}
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Tittel på nytt kart..."
            className="flex-1 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 font-body text-xs text-slate-900 dark:text-white outline-none focus:border-primary"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 font-body text-xs text-slate-900 dark:text-white outline-none"
          >
            <option value="Naturfag">Naturfag</option>
            <option value="Norsk">Norsk</option>
            <option value="Samfunnsfag">Samfunnsfag</option>
            <option value="Engelsk">Engelsk</option>
            <option value="Generelt">Generelt</option>
          </select>
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 font-heading text-xs font-bold text-white shadow-md hover:bg-primary-dark transition-all disabled:opacity-40"
          >
            <Plus size={16} />
            <span>Ny</span>
          </button>
        </form>

        {/* Saved Sessions List */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            const isEditing = editingId === s.id;

            return (
              <div
                key={s.id}
                className={`flex items-center justify-between rounded-2xl p-3 border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <GitFork size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          className="rounded-lg border border-primary bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(s.id)}
                          className="text-emerald-500 hover:text-emerald-600 p-1"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white truncate">
                        {s.title}
                      </h4>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{s.category || "Generelt"}</span>
                      <span>•</span>
                      <span>{s.nodes?.length || 0} ord/begreper</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        switchSession(s.id);
                        onClose();
                      }}
                      className="rounded-xl bg-primary text-white px-3 py-1.5 text-xs font-bold hover:bg-primary-dark transition-all"
                    >
                      Åpne
                    </button>
                  )}

                  <button
                    type="button"
                    title="Endre tittel"
                    onClick={() => handleStartRename(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    type="button"
                    title="Dupliser"
                    onClick={() => duplicateSession(s.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    <Copy size={14} />
                  </button>

                  <button
                    type="button"
                    title="Slett økt"
                    onClick={() => setSessionToDelete(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-rose-500 text-slate-500 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Mindmap Confirmation Modal */}
      <DeleteMindmapConfirmModal
        mindmapTitle={sessionToDelete?.title}
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>,
    document.body
  );
}
