import { PRESET_PERSONAL_NOTES, PRESET_BOARDS, DEFAULT_TAGS } from "../../lib/notaterTypes";

export const createNotaterSlice = (set, get) => ({
  personalNotes: PRESET_PERSONAL_NOTES,
  classBoards: PRESET_BOARDS,
  activeBoardId: "board-1",
  noteCategories: DEFAULT_TAGS,

  addNoteCategory: (categoryName) => {
    const trimmed = (categoryName || "").trim();
    if (!trimmed) return;
    set((s) => {
      const existing = s.noteCategories || DEFAULT_TAGS;
      if (existing.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return {};
      return { noteCategories: [...existing, trimmed] };
    });
  },

  deleteNoteCategory: (categoryName) => {
    set((s) => ({
      noteCategories: (s.noteCategories || DEFAULT_TAGS).filter(
        (c) => c.toLowerCase() !== (categoryName || "").toLowerCase()
      ),
    }));
  },

  // --- Mine Notater (Personlige) ---
  addPersonalNote: (noteData) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newNote = {
      id,
      title: noteData?.title || "Nytt notat",
      content: noteData?.content || "",
      color: noteData?.color || "yellow",
      category: noteData?.category || "Viktig",
      isLocked: Boolean(noteData?.isLocked),
      passwordHash: noteData?.passwordHash || "",
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({
      personalNotes: [newNote, ...(s.personalNotes || [])],
    }));
    return id;
  },

  updatePersonalNote: (id, updates) => {
    set((s) => ({
      personalNotes: (s.personalNotes || []).map((n) =>
        n.id === id
          ? {
              ...n,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : n
      ),
    }));
  },

  deletePersonalNote: (id) => {
    set((s) => ({
      personalNotes: (s.personalNotes || []).filter((n) => n.id !== id),
    }));
  },

  reorderPersonalNotes: (newNotes) => {
    set({ personalNotes: newNotes });
  },

  setNotePassword: (id, password) => {
    set((s) => ({
      personalNotes: (s.personalNotes || []).map((n) =>
        n.id === id
          ? {
              ...n,
              isLocked: Boolean(password),
              passwordHash: password || "",
              updatedAt: new Date().toISOString(),
            }
          : n
      ),
    }));
  },

  // --- Klassetavler ---
  setActiveBoardId: (boardId) => {
    set({ activeBoardId: boardId });
  },

  createClassBoard: (title, theme = "chalkboard") => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newBoard = {
      id,
      title: title || "Ny klassetavle",
      theme,
      notesArray: [],
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({
      classBoards: {
        ...s.classBoards,
        [id]: newBoard,
      },
      activeBoardId: id,
    }));
    return id;
  },

  updateClassBoard: (id, updates) => {
    set((s) => {
      const existing = s.classBoards?.[id];
      if (!existing) return {};
      return {
        classBoards: {
          ...s.classBoards,
          [id]: {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },

  deleteClassBoard: (id) => {
    set((s) => {
      const nextBoards = { ...s.classBoards };
      delete nextBoards[id];
      const remainingIds = Object.keys(nextBoards);
      const nextActiveId =
        s.activeBoardId === id
          ? remainingIds.length > 0
            ? remainingIds[0]
            : null
          : s.activeBoardId;

      return {
        classBoards: nextBoards,
        activeBoardId: nextActiveId,
      };
    });
  },

  addBoardNote: (boardId, noteData) => {
    const noteId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newNote = {
      id: noteId,
      title: noteData?.title || "Ny lapp",
      content: noteData?.content || "",
      color: noteData?.color || "yellow",
      category: noteData?.category || "",
      positionX: noteData?.positionX ?? 100,
      positionY: noteData?.positionY ?? 100,
      width: noteData?.width ?? 240,
      height: noteData?.height ?? 200,
      rotation: noteData?.rotation ?? (Math.floor(Math.random() * 7) - 3),
      createdAt: now,
      updatedAt: now,
    };

    set((s) => {
      const board = s.classBoards?.[boardId];
      if (!board) return {};
      return {
        classBoards: {
          ...s.classBoards,
          [boardId]: {
            ...board,
            notesArray: [...(board.notesArray || []), newNote],
            updatedAt: now,
          },
        },
      };
    });
    return noteId;
  },

  updateBoardNote: (boardId, noteId, updates) => {
    set((s) => {
      const board = s.classBoards?.[boardId];
      if (!board) return {};
      const updatedNotes = (board.notesArray || []).map((n) =>
        n.id === noteId
          ? {
              ...n,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : n
      );
      return {
        classBoards: {
          ...s.classBoards,
          [boardId]: {
            ...board,
            notesArray: updatedNotes,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },

  deleteBoardNote: (boardId, noteId) => {
    set((s) => {
      const board = s.classBoards?.[boardId];
      if (!board) return {};
      return {
        classBoards: {
          ...s.classBoards,
          [boardId]: {
            ...board,
            notesArray: (board.notesArray || []).filter((n) => n.id !== noteId),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },
});
