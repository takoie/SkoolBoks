import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Plus,
  Search,
  FileText,
  AlertCircle,
  X,
  Tag,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import PasswordModal from "./components/PasswordModal";
import PersonalNoteCard from "./components/PersonalNoteCard";
import FocusNoteModal from "./components/FocusNoteModal";

export default function MineNotaterView() {
  const personalNotes = useAppStore((s) => s.personalNotes || []);
  const noteCategories = useAppStore((s) => s.noteCategories || []);
  const addNoteCategory = useAppStore((s) => s.addNoteCategory);
  const deleteNoteCategory = useAppStore((s) => s.deleteNoteCategory);

  const addPersonalNote = useAppStore((s) => s.addPersonalNote);
  const updatePersonalNote = useAppStore((s) => s.updatePersonalNote);
  const deletePersonalNote = useAppStore((s) => s.deletePersonalNote);
  const reorderPersonalNotes = useAppStore((s) => s.reorderPersonalNotes);
  const setNotePassword = useAppStore((s) => s.setNotePassword);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("alle");
  const [activeDragId, setActiveDragId] = useState(null);
  const [focusedNoteId, setFocusedNoteId] = useState(null);

  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (newCategoryInput.trim()) {
      addNoteCategory(newCategoryInput.trim());
      setSelectedTagFilter(newCategoryInput.trim());
      setNewCategoryInput("");
      setIsAddingCategory(false);
    }
  };
  
  // Password modal states
  const [passwordModal, setPasswordModal] = useState(null); // { mode: 'set'|'unlock', noteId: string }
  const [unlockedNotes, setUnlockedNotes] = useState({}); // map noteId -> true if unlocked

  // Delete confirmation modal state
  const [deleteConfirmNote, setDeleteConfirmNote] = useState(null);

  // DnD Sensors - distance 3px threshold for fast crisp pickup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const handleCreateNote = (color = "yellow") => {
    addPersonalNote({
      title: "Nytt notat",
      content: "",
      color,
      category: selectedTagFilter !== "alle" ? selectedTagFilter : "Viktig",
    });
  };

  const handleDeleteRequest = (note) => {
    if (note.content && note.content.trim().length > 0) {
      setDeleteConfirmNote(note);
    } else {
      deletePersonalNote(note.id);
    }
  };

  const confirmDeleteNote = () => {
    if (deleteConfirmNote) {
      deletePersonalNote(deleteConfirmNote.id);
      setDeleteConfirmNote(null);
    }
  };

  const handleToggleLock = (note) => {
    if (note.isLocked) {
      if (unlockedNotes[note.id]) {
        setUnlockedNotes((prev) => ({ ...prev, [note.id]: false }));
      } else {
        setPasswordModal({ mode: "unlock", noteId: note.id });
      }
    } else {
      setPasswordModal({ mode: "set", noteId: note.id });
    }
  };

  const handleRemovePassword = (note) => {
    setNotePassword(note.id, "");
    setUnlockedNotes((prev) => ({ ...prev, [note.id]: false }));
  };

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = personalNotes.findIndex((n) => n.id === active.id);
    const newIndex = personalNotes.findIndex((n) => n.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(personalNotes, oldIndex, newIndex);
      reorderPersonalNotes(reordered);
    }
  };

  const handleMoveNote = (noteId, direction) => {
    const currentIndex = personalNotes.findIndex((n) => n.id === noteId);
    if (currentIndex === -1) return;
    const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= personalNotes.length) return;
    const reordered = arrayMove(personalNotes, currentIndex, targetIndex);
    reorderPersonalNotes(reordered);
  };

  const filteredNotes = personalNotes.filter((note) => {
    const matchesSearch =
      (note.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.category || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      selectedTagFilter === "alle" ||
      (note.category || "").toLowerCase() === selectedTagFilter.toLowerCase();

    return matchesSearch && matchesTag;
  });

  const activeDragNote = personalNotes.find((n) => n.id === activeDragId);

  return (
    <div className="space-y-6">
      {/* Search, Filter and Actions Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border-2 border-border-subtle bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk i notater..."
              className="w-full rounded-full border border-border-subtle bg-canvas pl-10 pr-4 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          {/* Category filter pills with custom add/delete */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedTagFilter("alle")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors shrink-0 ${
                selectedTagFilter === "alle"
                  ? "bg-primary text-white"
                  : "bg-canvas text-ink-muted hover:bg-primary/10 hover:text-primary"
              }`}
            >
              Alle ({personalNotes.length})
            </button>

            {noteCategories.map((tag) => {
              const count = personalNotes.filter(
                (n) => (n.category || "").toLowerCase() === tag.toLowerCase()
              ).length;
              const isSelected =
                selectedTagFilter.toLowerCase() === tag.toLowerCase();

              return (
                <div
                  key={tag}
                  className={`group relative flex items-center rounded-full text-xs font-semibold transition-colors shrink-0 ${
                    isSelected
                      ? "bg-primary text-white"
                      : "bg-canvas text-ink-muted hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTagFilter(tag)}
                    className="px-3 py-1"
                  >
                    {tag} {count > 0 && `(${count})`}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNoteCategory(tag);
                      if (selectedTagFilter.toLowerCase() === tag.toLowerCase()) {
                        setSelectedTagFilter("alle");
                      }
                    }}
                    className="mr-1 flex h-4 w-4 items-center justify-center rounded-full opacity-60 hover:bg-black/20 hover:opacity-100"
                    title={`Slett kategorien "${tag}"`}
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}

            {/* Add new category inline */}
            {isAddingCategory ? (
              <form onSubmit={handleAddCategorySubmit} className="flex items-center">
                <input
                  type="text"
                  spellCheck={false}
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="Kategorinavn..."
                  autoFocus
                  onBlur={() => {
                    if (!newCategoryInput.trim()) setIsAddingCategory(false);
                  }}
                  className="w-28 rounded-full border border-primary bg-canvas px-3 py-1 text-xs text-ink focus:outline-none"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-1 rounded-full border border-dashed border-border-subtle bg-canvas/50 px-2.5 py-1 text-xs font-semibold text-ink-muted transition-colors hover:border-primary hover:text-primary shrink-0"
                title="Opprett ny kategori"
              >
                <Plus size={12} />
                Ny kategori
              </button>
            )}
          </div>
        </div>

        {/* Create note button */}
        <button
          type="button"
          onClick={() => handleCreateNote("yellow")}
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 font-heading text-sm font-bold text-white shadow-sm transition-transform hover:bg-primary-hover active:scale-95 shrink-0"
        >
          <Plus size={18} />
          Nytt notat
        </button>
      </div>

      {/* Sticky Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-subtle bg-surface/50 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <FileText size={24} />
          </div>
          <h3 className="font-heading text-base font-bold text-ink mb-1">
            Ingen notater funnet
          </h3>
          <p className="font-body text-xs text-ink-muted max-w-sm mb-4">
            {searchQuery || selectedTagFilter !== "alle"
              ? "Ingen notater matchet søket eller filteret ditt."
              : "Opprett ditt første personlige sticky note for å komme i gang!"}
          </p>
          <button
            type="button"
            onClick={() => handleCreateNote("yellow")}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-contrast shadow-sm hover:bg-primary-hover active:scale-95"
          >
            <Plus size={16} />
            Opprett notat nå
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredNotes.map((n) => n.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredNotes.map((note, index) => (
                <PersonalNoteCard
                  key={note.id}
                  note={note}
                  isUnlocked={!note.isLocked || unlockedNotes[note.id]}
                  onUpdate={(updates) => updatePersonalNote(note.id, updates)}
                  onDeleteRequest={handleDeleteRequest}
                  onToggleLock={handleToggleLock}
                  onRemovePassword={handleRemovePassword}
                  onUnlockPrompt={(noteId) =>
                    setPasswordModal({ mode: "unlock", noteId })
                  }
                  onMoveLeft={() => handleMoveNote(note.id, "left")}
                  onMoveRight={() => handleMoveNote(note.id, "right")}
                  canMoveLeft={index > 0}
                  canMoveRight={index < filteredNotes.length - 1}
                  onFocusNote={(id) => setFocusedNoteId(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Password Modal */}
      {passwordModal && (
        <PasswordModal
          mode={passwordModal.mode}
          title={
            passwordModal.mode === "set"
              ? "Beskytt med passord"
              : "Lås opp notat"
          }
          onClose={() => setPasswordModal(null)}
          onConfirm={(password) => {
            const targetNote = personalNotes.find(
              (n) => n.id === passwordModal.noteId
            );
            if (!targetNote) return false;

            if (passwordModal.mode === "set") {
              setNotePassword(targetNote.id, password);
              setUnlockedNotes((prev) => ({ ...prev, [targetNote.id]: true }));
              setPasswordModal(null);
              return true;
            } else {
              if (targetNote.passwordHash === password) {
                setUnlockedNotes((prev) => ({
                  ...prev,
                  [targetNote.id]: true,
                }));
                setPasswordModal(null);
                return true;
              } else {
                return false;
              }
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border-2 border-border-subtle bg-surface p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <AlertCircle size={24} />
              <h3 className="font-heading text-base font-bold text-ink">
                Slett notat?
              </h3>
            </div>
            <p className="font-body text-xs text-ink-muted mb-4">
              Notatet "<strong>{deleteConfirmNote.title || "Uten tittel"}</strong>" inneholder tekst. Er du sikker på at du vil slette det?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmNote(null)}
                className="rounded-full px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-canvas"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={confirmDeleteNote}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 active:scale-95"
              >
                Ja, slett notatet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focus Note Modal (Vis kun ett notat om gangen) */}
      {focusedNoteId && (
        <FocusNoteModal
          notes={filteredNotes}
          initialNoteId={focusedNoteId}
          isUnlockedMap={unlockedNotes}
          onClose={() => setFocusedNoteId(null)}
          onUpdateNote={(id, updates) => updatePersonalNote(id, updates)}
        />
      )}
    </div>
  );
}
