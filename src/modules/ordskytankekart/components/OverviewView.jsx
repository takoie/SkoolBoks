import React, { useState } from "react";
import { useOrdskyStore } from "../store/useOrdskyStore";
import DeleteCategoryConfirmModal from "./DeleteCategoryConfirmModal";
import DeleteMindmapConfirmModal from "./DeleteMindmapConfirmModal";
import {
  Plus,
  FileText,
  Search,
  FolderOpen,
  GitFork,
  Copy,
  Trash2,
  Share2,
  Calendar,
  Cloud,
  Check,
  Tag,
  X,
} from "lucide-react";

export default function OverviewView({ onOpenImport }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [copiedId, setCopiedId] = useState(null);

  // New category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Deletion modal states
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const sessions = useOrdskyStore((s) => s.sessions || []);
  const activeSessionId = useOrdskyStore((s) => s.activeSessionId);
  const categories = useOrdskyStore((s) => s.categories || []);
  const addCategory = useOrdskyStore((s) => s.addCategory);
  const deleteCategory = useOrdskyStore((s) => s.deleteCategory);

  const createSession = useOrdskyStore((s) => s.createSession);
  const switchSession = useOrdskyStore((s) => s.switchSession);
  const deleteSession = useOrdskyStore((s) => s.deleteSession);
  const duplicateSession = useOrdskyStore((s) => s.duplicateSession);

  const filterCategories = ["Alle", ...categories];

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "Alle" || (s.category || "Generelt") === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleShare = (session, e) => {
    e.stopPropagation();
    try {
      const jsonString = JSON.stringify(session, null, 2);
      navigator.clipboard.writeText(jsonString);
      setCopiedId(session.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setSelectedCategory(newCatName.trim());
      setNewCatName("");
      setIsAddingCategory(false);
    }
  };

  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete);
      if (selectedCategory === categoryToDelete) setSelectedCategory("Alle");
      setCategoryToDelete(null);
    }
  };

  const handleConfirmDeleteSession = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete.id);
      setSessionToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-2">
      {/* Top Banner - Bright, crisp light mode banner with dark indigo text */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-white p-6 border-2 border-primary/20 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold">
            <GitFork size={24} />
            <h2 className="font-heading text-xl font-bold text-ink">
              Mine tankekart
            </h2>
          </div>
          <p className="font-body text-xs font-semibold text-slate-600">
            Opprett nye økter, importer ordlister eller velg en tidligere lagret tavle for undervisningen.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => createSession("Nytt tankekart", selectedCategory !== "Alle" ? selectedCategory : "Naturfag")}
            className="flex items-center gap-2 rounded-2xl bg-primary text-white px-5 py-3 font-heading text-xs font-bold shadow-md hover:bg-primary-hover active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span>Nytt tankekart</span>
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-5 py-3 font-heading text-xs font-bold shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <FileText size={18} />
            <span>Importer ordliste</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Field */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk i lagrede kart..."
              className="w-full rounded-2xl border-2 border-border-subtle bg-surface pl-10 pr-4 py-2.5 font-body text-xs text-ink outline-none focus:border-primary transition-colors shadow-xs"
            />
          </div>

          {/* Category Management Bar */}
          <div className="flex items-center gap-2">
            {isAddingCategory ? (
              <form onSubmit={handleAddCategorySubmit} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nytt fag (f.eks. Kunst)..."
                  className="rounded-xl border-2 border-primary bg-surface px-3 py-1.5 font-body text-xs text-ink outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-xl bg-primary text-white p-1.5 font-bold hover:bg-primary-hover"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-1.5 font-bold"
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-1 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 bg-surface px-3.5 py-1.5 font-heading text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-all shadow-xs"
              >
                <Tag size={14} />
                <span>+ Legg til fag</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1">
          {filterCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const isDefault = ["Alle", "Generelt"].includes(cat);

            return (
              <div
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-heading text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                  isSelected
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface border border-border-subtle text-ink hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <span>{cat}</span>

                {/* Delete custom category button */}
                {!isDefault && (
                  <button
                    type="button"
                    title={`Slett fag "${cat}"`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryToDelete(cat);
                    }}
                    className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                      isSelected
                        ? "hover:bg-white/30 text-white"
                        : "hover:bg-rose-500 hover:text-white text-slate-400"
                    }`}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-border-subtle bg-surface/50 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <GitFork size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-lg font-bold text-ink">
              Ingen tankekart ennå
            </h3>
            <p className="font-body text-xs text-slate-500 max-w-sm">
              Trykk på <span className="font-bold text-primary">+ Nytt tankekart</span> øverst for å opprette ditt første blanke tankekart uten forhåndsutfylte ord.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((s) => {
            const isActive = s.id === activeSessionId;
            const nodeCount = s.nodes?.length || 0;
            const connCount = s.connections?.length || 0;
            const updatedDate = new Date(s.updatedAt || s.createdAt).toLocaleDateString("no-NO", {
              day: "numeric",
              month: "short",
            });

            return (
              <div
                key={s.id}
                onClick={() => switchSession(s.id)}
                className={`group relative flex flex-col justify-between rounded-3xl border-2 bg-surface p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border-subtle hover:border-primary/50"
                }`}
              >
                <div className="space-y-3">
                  {/* Header Badge & Category */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-3 py-1 font-heading text-[10px] font-bold text-primary">
                      {s.category || "Generelt"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Calendar size={12} />
                      {updatedDate}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading text-base font-bold text-ink line-clamp-1 group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>

                  {/* Nodes & Connections Preview Stats */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Cloud size={14} className="text-sky-500" />
                      <span>{nodeCount} ord/begreper</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GitFork size={14} className="text-emerald-500" />
                      <span>{connCount} koblinger</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      switchSession(s.id);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-heading text-xs font-bold text-white shadow-sm hover:bg-primary-hover active:scale-95 transition-all"
                  >
                    <FolderOpen size={14} />
                    <span>Åpne på tavle</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Share JSON */}
                    <button
                      type="button"
                      title="Kopier data til utklippstavlen"
                      onClick={(e) => handleShare(s, e)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {copiedId === s.id ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      title="Kopier økt"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSession(s.id);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Copy size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      title="Slett økt"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(s);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      <DeleteCategoryConfirmModal
        categoryName={categoryToDelete}
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDeleteCategory}
      />

      {/* Delete Mindmap Confirmation Modal */}
      <DeleteMindmapConfirmModal
        mindmapTitle={sessionToDelete?.title}
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleConfirmDeleteSession}
      />
    </div>
  );
}
