import { PRESET_DILEMMA_SESSIONS } from "../../lib/dilemmaTypes";

export const createDilemmaSlice = (set) => ({
  dilemmaSessions: PRESET_DILEMMA_SESSIONS.reduce((acc, sess) => {
    acc[sess.id] = sess;
    return acc;
  }, {}),

  createDilemmaSession: (title, description, dilemmas) => {
    const id = crypto.randomUUID();
    const session = {
      id,
      title: title || "Ny dilemma-økt",
      description: description || "",
      dilemmas: dilemmas || [
        {
          id: crypto.randomUUID(),
          title: "Ville du helst...",
          leftOption: { text: "Alternativ A", icon: "👈", imagePath: "" },
          rightOption: { text: "Alternativ B", icon: "👉", imagePath: "" },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({
      dilemmaSessions: {
        ...s.dilemmaSessions,
        [id]: session,
      },
    }));
    return id;
  },

  updateDilemmaSession: (id, updates) =>
    set((s) => {
      const existing = s.dilemmaSessions[id];
      if (!existing) return {};
      return {
        dilemmaSessions: {
          ...s.dilemmaSessions,
          [id]: {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }),

  deleteDilemmaSession: (id) =>
    set((s) => {
      const next = { ...s.dilemmaSessions };
      delete next[id];
      return { dilemmaSessions: next };
    }),

  importDilemmaSession: (sessionData) =>
    set((s) => {
      const id = sessionData.id || crypto.randomUUID();
      const newSession = {
        ...sessionData,
        id,
        updatedAt: new Date().toISOString(),
      };
      return {
        dilemmaSessions: {
          ...s.dilemmaSessions,
          [id]: newSession,
        },
      };
    }),

  duplicateDilemmaSession: (id) =>
    set((s) => {
      const original = s.dilemmaSessions[id];
      if (!original) return {};
      const newId = crypto.randomUUID();
      const copy = {
        ...original,
        id: newId,
        title: `${original.title} (kopi)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        dilemmaSessions: {
          ...s.dilemmaSessions,
          [newId]: copy,
        },
      };
    }),
});
