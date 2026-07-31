import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "./tauriStorage";

const DEFAULT_CLASS_ID = "default";

export const useAppStore = create(
  persist(
    (set) => ({
      activeModule: "dashboard",
      setActiveModule: (id) => set({ activeModule: id }),

      classes: {
        [DEFAULT_CLASS_ID]: { name: "Min klasse", students: [] },
      },
      activeClassId: DEFAULT_CLASS_ID,
      drawnStudents: {},

      setActiveClassId: (id) => set({ activeClassId: id }),

      createClass: (name) => {
        const id = crypto.randomUUID();
        set((s) => ({
          classes: { ...s.classes, [id]: { name, students: [] } },
          activeClassId: id,
        }));
        return id;
      },

      renameClass: (id, name) =>
        set((s) => ({
          classes: { ...s.classes, [id]: { ...s.classes[id], name } },
        })),

      deleteClass: (id) =>
        set((s) => {
          const classes = { ...s.classes };
          delete classes[id];
          const remainingIds = Object.keys(classes);
          const activeClassId =
            s.activeClassId === id ? (remainingIds[0] ?? null) : s.activeClassId;
          return { classes, activeClassId };
        }),

      setStudents: (classId, students) =>
        set((s) => ({
          classes: { ...s.classes, [classId]: { ...s.classes[classId], students } },
        })),

      resetDrawn: (classId) =>
        set((s) => ({ drawnStudents: { ...s.drawnStudents, [classId]: [] } })),

      markDrawn: (classId, student) =>
        set((s) => ({
          drawnStudents: {
            ...s.drawnStudents,
            [classId]: [...(s.drawnStudents[classId] ?? []), student],
          },
        })),

      settings: { soundEnabled: true, theme: "dark" },
      setSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      quizzes: {},

      createQuiz: (name) => {
        const id = crypto.randomUUID();
        set((s) => ({
          quizzes: {
            ...s.quizzes,
            [id]: {
              id,
              name,
              categories: [
                { id: crypto.randomUUID(), name: "Kategori 1" },
                { id: crypto.randomUUID(), name: "Kategori 2" },
              ],
              points: [
                { id: crypto.randomUUID(), value: 100 },
                { id: crypto.randomUUID(), value: 200 },
                { id: crypto.randomUUID(), value: 300 },
              ],
              cells: {},
            },
          },
        }));
        return id;
      },

      updateQuiz: (id, partial) =>
        set((s) => ({
          quizzes: { ...s.quizzes, [id]: { ...s.quizzes[id], ...partial } },
        })),

      deleteQuiz: (id) =>
        set((s) => {
          const quizzes = { ...s.quizzes };
          delete quizzes[id];
          return { quizzes };
        }),
    }),
    {
      name: "skoolbox-store",
      storage: createJSONStorage(() => tauriStorage),
      partialize: (s) => ({
        classes: s.classes,
        activeClassId: s.activeClassId,
        drawnStudents: s.drawnStudents,
        settings: s.settings,
        quizzes: s.quizzes,
      }),
    }
  )
);
