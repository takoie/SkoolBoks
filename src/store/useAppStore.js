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

      settings: { soundEnabled: true },
      setSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
    }),
    {
      name: "skoolbox-store",
      storage: createJSONStorage(() => tauriStorage),
      partialize: (s) => ({
        classes: s.classes,
        activeClassId: s.activeClassId,
        drawnStudents: s.drawnStudents,
        settings: s.settings,
      }),
    }
  )
);
