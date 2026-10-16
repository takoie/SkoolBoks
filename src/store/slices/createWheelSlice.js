export const createWheelSlice = (set) => ({
  wheels: {},
  removedSectors: {},

  createWheel: (name) => {
    const id = crypto.randomUUID();
    set((s) => ({
      wheels: {
        ...s.wheels,
        [id]: {
          id,
          name,
          sectors: [
            { id: crypto.randomUUID(), label: "Alternativ 1" },
            { id: crypto.randomUUID(), label: "Alternativ 2" },
          ],
          removeAfterSpin: false,
        },
      },
    }));
    return id;
  },

  renameWheel: (id, name) =>
    set((s) => {
      const trimmed = name.trim();
      if (!trimmed) return {};
      return {
        wheels: { ...s.wheels, [id]: { ...s.wheels[id], name: trimmed } },
      };
    }),

  deleteWheel: (id) =>
    set((s) => {
      const wheels = { ...s.wheels };
      delete wheels[id];
      const removedSectors = { ...s.removedSectors };
      delete removedSectors[id];
      return { wheels, removedSectors };
    }),

  setWheelSectors: (id, sectors) =>
    set((s) => ({
      wheels: { ...s.wheels, [id]: { ...s.wheels[id], sectors } },
    })),

  setWheelRemoveAfterSpin: (id, enabled) =>
    set((s) => ({
      wheels: {
        ...s.wheels,
        [id]: { ...s.wheels[id], removeAfterSpin: enabled },
      },
    })),

  importWheel: ({ name, sectors, removeAfterSpin = false }) => {
    const id = crypto.randomUUID();
    const formattedSectors = (sectors || []).map((s) => ({
      id: crypto.randomUUID(),
      label: typeof s === "string" ? s : s?.label || "",
    }));

    set((s) => ({
      wheels: {
        ...s.wheels,
        [id]: {
          id,
          name: (name || "Importert hjul").trim(),
          sectors:
            formattedSectors.length > 0
              ? formattedSectors
              : [
                  { id: crypto.randomUUID(), label: "Alternativ 1" },
                  { id: crypto.randomUUID(), label: "Alternativ 2" },
                ],
          removeAfterSpin: Boolean(removeAfterSpin),
        },
      },
    }));
    return id;
  },

  markSectorRemoved: (wheelId, sectorId) =>
    set((s) => ({
      removedSectors: {
        ...s.removedSectors,
        [wheelId]: [...(s.removedSectors[wheelId] ?? []), sectorId],
      },
    })),

  undoLastSectorRemoval: (wheelId) =>
    set((s) => ({
      removedSectors: {
        ...s.removedSectors,
        [wheelId]: (s.removedSectors[wheelId] ?? []).slice(0, -1),
      },
    })),

  resetRemovedSectors: (wheelId) =>
    set((s) => ({
      removedSectors: { ...s.removedSectors, [wheelId]: [] },
    })),
});
