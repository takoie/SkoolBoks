import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useOrdskyStore } from "../store/useOrdskyStore";
import { Tag, X, Trash2, Plus, Check } from "lucide-react";

export default function ThemeManagerModal({ isOpen, onClose }) {
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("amber");

  const session = useOrdskyStore((s) => s.getActiveSession());
  const setTagColor = useOrdskyStore((s) => s.setTagColor);
  const deleteTag = useOrdskyStore((s) => s.deleteTag);
  const setNodeTag = useOrdskyStore((s) => s.setNodeTag);
  const selectedNodeIds = useOrdskyStore((s) => s.selectedNodeIds);

  if (!isOpen || !session) return null;

  const nodes = session.nodes || [];
  const tagCounts = {};
  nodes.forEach((n) => {
    if (n.tag) {
      tagCounts[n.tag] = (tagCounts[n.tag] || 0) + 1;
    }
  });

  // Combine tags from tagColors and nodes
  const allTagNames = Array.from(
    new Set([...Object.keys(session.tagColors || {}), ...Object.keys(tagCounts)])
  );

  const colors = [
    { id: "sky", label: "Himmelblå", bg: "bg-sky-500" },
    { id: "emerald", label: "Smaragdgrønn", bg: "bg-emerald-500" },
    { id: "amber", label: "Gull / Amber", bg: "bg-amber-500" },
    { id: "violet", label: "Lilla", bg: "bg-violet-500" },
    { id: "rose", label: "Rosa / Rød", bg: "bg-rose-500" },
    { id: "teal", label: "Teal", bg: "bg-teal-500" },
    { id: "fuchsia", label: "Fuchsia", bg: "bg-fuchsia-500" },
    { id: "primary", label: "Indigoblå", bg: "bg-primary" },
  ];

  const handleCreateTag = (e) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    // Set theme color
    setTagColor(trimmed, selectedColor);

    // If a node is currently selected on canvas, assign tag to it immediately
    if (selectedNodeIds.length > 0) {
      selectedNodeIds.forEach((id) => setNodeTag(id, trimmed));
    }

    setNewTagName("");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in pointer-events-auto select-none"
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-fade-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Tag size={20} />
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
              Tema-organisering
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Create New Theme Form Input */}
        <form onSubmit={handleCreateTag} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50 dark:bg-slate-950 space-y-3">
          <span className="font-heading text-xs font-bold text-slate-900 dark:text-white block">
            + Opprett nytt tema
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="f.eks. Mellomkrigstid, Norsk, Fotosyntese..."
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!newTagName.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-primary-dark disabled:opacity-40"
            >
              <Plus size={16} />
              <span>Opprett</span>
            </button>
          </div>

          {/* Color Selection for New Theme */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-500">Border-farge:</span>
            <div className="flex items-center gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => setSelectedColor(c.id)}
                  className={`h-5 w-5 rounded-full ${c.bg} hover:scale-125 transition-transform ${
                    selectedColor === c.id ? "ring-2 ring-slate-900 dark:ring-white scale-110" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </form>

        {/* List of active topic themes */}
        <div className="space-y-2">
          <span className="font-heading text-xs font-bold text-slate-700 dark:text-slate-300">
            Aktive temaer ({allTagNames.length})
          </span>

          {allTagNames.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Ingen temaer ennå. Skriv inn et navn ovenfor og trykk Opprett!
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allTagNames.map((tagName) => {
                const currentColor = session.tagColors?.[tagName] || "amber";
                const count = tagCounts[tagName] || 0;
                return (
                  <div
                    key={tagName}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded-full ${
                          colors.find((c) => c.id === currentColor)?.bg || "bg-amber-500"
                        }`}
                      />
                      <div>
                        <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white">
                          {tagName}
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {count} {count === 1 ? "boks" : "bokser"} har dette temaet
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Border Color selector buttons */}
                      <div className="flex items-center gap-1">
                        {colors.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            title={c.label}
                            onClick={() => setTagColor(tagName, c.id)}
                            className={`h-4 w-4 rounded-full ${c.bg} hover:scale-125 transition-transform ${
                              currentColor === c.id ? "ring-2 ring-slate-900 dark:ring-white scale-110" : ""
                            }`}
                          />
                        ))}
                      </div>

                      {/* Delete theme */}
                      <button
                        type="button"
                        onClick={() => deleteTag(tagName)}
                        title="Slett tema"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Close Footer */}
        <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-dark active:scale-95 transition-all"
          >
            Ferdig
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
