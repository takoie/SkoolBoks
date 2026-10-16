import React, { useState, useEffect, useRef } from "react";
import { useOrdskyStore } from "../store/useOrdskyStore";
import { NODE_COLORS } from "../utils/layoutAlgorithms";
import {
  Edit2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Tag,
  Check,
} from "lucide-react";

export default function NodeContextMenu({ position, nodeId, onClose, onStartEdit }) {
  const menuRef = useRef(null);
  const session = useOrdskyStore((s) => s.getActiveSession());
  const updateNodeWithHistory = useOrdskyStore((s) => s.updateNodeWithHistory);
  const deleteNode = useOrdskyStore((s) => s.deleteNode);
  const addChildNode = useOrdskyStore((s) => s.addChildNode);
  const setNodeTag = useOrdskyStore((s) => s.setNodeTag);

  const node = session?.nodes?.find((n) => n.id === nodeId);
  const existingTags = Array.from(
    new Set(session?.nodes?.map((n) => n.tag).filter(Boolean) || [])
  );

  const [tagInput, setTagInput] = useState(node?.tag || "");
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          onClose();
        }
      };
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };

      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, 50);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!node) return null;

  const colors = [
    { id: "primary", bg: "bg-primary" },
    { id: "sky", bg: "bg-sky-500" },
    { id: "emerald", bg: "bg-emerald-500" },
    { id: "amber", bg: "bg-amber-500" },
    { id: "violet", bg: "bg-violet-500" },
    { id: "rose", bg: "bg-rose-500" },
    { id: "teal", bg: "bg-teal-500" },
    { id: "fuchsia", bg: "bg-fuchsia-500" },
  ];

  const shapes = [
    { id: "rounded", label: "Avrundet" },
    { id: "capsule", label: "Kapsel" },
    { id: "cloud", label: "Sky" },
    { id: "underline", label: "Understrek" },
  ];

  const handleApplyTag = (tagToApply) => {
    setNodeTag(node.id, tagToApply);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute z-50 w-60 rounded-2xl bg-slate-900 text-white p-3 shadow-2xl border border-slate-700 space-y-2.5 text-xs font-heading font-semibold animate-fade-slide-up select-none"
    >
      {/* Node title */}
      <div className="px-2 py-1 text-[11px] font-bold text-slate-400 truncate border-b border-slate-800">
        Boks: <span className="text-white font-bold">{node.text}</span>
      </div>

      {/* Primary Actions */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStartEdit();
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-slate-800 text-left transition-colors"
      >
        <Edit2 size={14} className="text-primary" />
        <span>Rediger tekst</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          addChildNode(node.id);
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-slate-800 text-left transition-colors"
      >
        <Plus size={14} className="text-emerald-400" />
        <span>Legg til undernode (Tab)</span>
      </button>

      <div className="h-px bg-slate-800 my-1" />

      {/* Tema / Tag Management Section */}
      <div className="px-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Tema / Tag
          </span>
          {node.tag && (
            <button
              type="button"
              onClick={() => handleApplyTag("")}
              className="text-[10px] text-rose-400 hover:underline"
            >
              Fjern tema
            </button>
          )}
        </div>

        {/* Existing Tag Chips */}
        {existingTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {existingTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleApplyTag(t)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                  node.tag === t
                    ? "bg-amber-400 text-slate-900"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Custom Tag Input */}
        {showTagInput ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tagInput.trim()) handleApplyTag(tagInput.trim());
            }}
            className="flex items-center gap-1 pt-1"
          >
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="f.eks. Mellomkrigstid..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-white outline-none focus:border-amber-400"
              autoFocus
            />
            <button type="submit" className="rounded-lg bg-amber-400 p-1 text-slate-900 font-bold">
              <Check size={14} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowTagInput(true)}
            className="flex items-center gap-1.5 text-[11px] text-amber-300 hover:text-amber-200"
          >
            <Tag size={12} />
            <span>+ Sett nytt tema...</span>
          </button>
        )}
      </div>

      <div className="h-px bg-slate-800 my-1" />

      {/* Color Selection Palette */}
      <div className="px-2 space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Farge</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateNodeWithHistory(node.id, { color: c.id });
                onClose();
              }}
              className={`h-5 w-5 rounded-full ${c.bg} hover:scale-125 transition-transform ${
                node.color === c.id ? "ring-2 ring-white scale-110" : ""
              }`}
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-800 my-1" />

      {/* Shape Selector */}
      <div className="px-2 space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Form</span>
        <div className="grid grid-cols-2 gap-1">
          {shapes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateNodeWithHistory(node.id, { shape: s.id });
                onClose();
              }}
              className={`rounded-lg px-2 py-1 text-[11px] font-semibold text-left transition-colors ${
                node.shape === s.id
                  ? "bg-primary text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-800 my-1" />

      {/* Weight Size Controls */}
      <div className="flex items-center justify-between px-2.5 py-1">
        <span className="text-xs text-slate-300">Størrelse</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateNodeWithHistory(node.id, { weight: Math.max(1, (node.weight || 5) - 1) });
            }}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
          >
            <ChevronDown size={14} />
          </button>
          <span className="w-5 text-center font-bold text-white">{node.weight || 5}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateNodeWithHistory(node.id, { weight: Math.min(10, (node.weight || 5) + 1) });
            }}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
          >
            <ChevronUp size={14} />
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-800 my-1" />

      {/* Delete Node */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          deleteNode(node.id);
          onClose();
        }}
        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-rose-400 hover:bg-rose-950/60 text-left transition-colors"
      >
        <Trash2 size={14} />
        <span>Slett boks (Delete)</span>
      </button>
    </div>
  );
}
