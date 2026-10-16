const DEFAULT_CLASS_ID = "default";

export const createClassSlice = (set) => ({
  classes: {
    [DEFAULT_CLASS_ID]: { name: "Min klasse", students: [] },
  },
  activeClassId: DEFAULT_CLASS_ID,
  drawnStudents: {},
  lastDrawSize: {},

  setActiveClassId: (id) => set({ activeClassId: id }),

  classSwitchGuard: null,
  setClassSwitchGuard: (guard) => set({ classSwitchGuard: guard }),

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
    set((s) => ({
      drawnStudents: { ...s.drawnStudents, [classId]: [] },
      lastDrawSize: { ...s.lastDrawSize, [classId]: 0 },
    })),

  markDrawn: (classId, students) =>
    set((s) => ({
      drawnStudents: {
        ...s.drawnStudents,
        [classId]: [...(s.drawnStudents[classId] ?? []), ...students],
      },
      lastDrawSize: { ...s.lastDrawSize, [classId]: students.length },
    })),

  undoLastDraw: (classId) =>
    set((s) => {
      const n = s.lastDrawSize[classId] ?? 0;
      if (n === 0) return {};
      return {
        drawnStudents: {
          ...s.drawnStudents,
          [classId]: (s.drawnStudents[classId] ?? []).slice(0, -n),
        },
        lastDrawSize: { ...s.lastDrawSize, [classId]: 0 },
      };
    }),
});
