export function normalizeDashboardState(dashboard, allModuleIds = []) {
  const DEFAULT_CAT_ID = "default";
  const DEFAULT_CAT_NAME = "Hovedmoduler";

  if (!dashboard || typeof dashboard !== "object") {
    return {
      categories: [
        {
          id: DEFAULT_CAT_ID,
          name: DEFAULT_CAT_NAME,
          moduleIds: [...allModuleIds],
        },
      ],
      hidden: [],
    };
  }

  let categories = Array.isArray(dashboard.categories)
    ? dashboard.categories.map((c) => ({
        id: c.id || crypto.randomUUID(),
        name: c.name || "Kategori",
        moduleIds: Array.isArray(c.moduleIds) ? [...c.moduleIds] : [],
      }))
    : null;

  let hidden = Array.isArray(dashboard.hidden) ? [...dashboard.hidden] : [];

  if (!categories) {
    const order = Array.isArray(dashboard.order) ? dashboard.order : [];
    categories = [
      {
        id: DEFAULT_CAT_ID,
        name: DEFAULT_CAT_NAME,
        moduleIds: [...order],
      },
    ];
  }

  if (categories.length === 0) {
    categories = [
      { id: DEFAULT_CAT_ID, name: DEFAULT_CAT_NAME, moduleIds: [] },
    ];
  }

  if (allModuleIds.length > 0) {
    const assignedIds = new Set();
    categories.forEach((cat) => {
      cat.moduleIds.forEach((id) => assignedIds.add(id));
    });
    hidden.forEach((id) => assignedIds.add(id));

    const unassignedIds = allModuleIds.filter((id) => !assignedIds.has(id));
    if (unassignedIds.length > 0) {
      categories[0] = {
        ...categories[0],
        moduleIds: [...categories[0].moduleIds, ...unassignedIds],
      };
    }

    const validIds = new Set(allModuleIds);
    categories = categories.map((cat) => ({
      ...cat,
      moduleIds: cat.moduleIds.filter((id) => validIds.has(id)),
    }));
    hidden = hidden.filter((id) => validIds.has(id));
  }

  return { categories, hidden };
}

export const createDashboardSlice = (set, get) => ({
  activeModule: "dashboard",
  setActiveModule: (id) => set({ activeModule: id }),

  dashboard: {
    categories: [{ id: "default", name: "Hovedmoduler", moduleIds: [] }],
    hidden: [],
  },
  isEditMode: false,
  toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode })),

  addCategory: (name) =>
    set((s) => {
      const current = normalizeDashboardState(s.dashboard);
      const newCat = {
        id: crypto.randomUUID(),
        name: (name && name.trim()) || `Kategori ${current.categories.length + 1}`,
        moduleIds: [],
      };
      return {
        dashboard: {
          ...current,
          categories: [...current.categories, newCat],
        },
      };
    }),

  renameCategory: (categoryId, newName) =>
    set((s) => {
      const current = normalizeDashboardState(s.dashboard);
      return {
        dashboard: {
          ...current,
          categories: current.categories.map((c) =>
            c.id === categoryId ? { ...c, name: newName.trim() || c.name } : c
          ),
        },
      };
    }),

  deleteCategory: (categoryId) =>
    set((s) => {
      const current = normalizeDashboardState(s.dashboard);
      if (current.categories.length <= 1) return s;
      const catToDelete = current.categories.find((c) => c.id === categoryId);
      if (!catToDelete) return s;

      const remainingCategories = current.categories.filter(
        (c) => c.id !== categoryId
      );
      if (catToDelete.moduleIds.length > 0) {
        remainingCategories[0] = {
          ...remainingCategories[0],
          moduleIds: [
            ...remainingCategories[0].moduleIds,
            ...catToDelete.moduleIds,
          ],
        };
      }

      return {
        dashboard: {
          ...current,
          categories: remainingCategories,
        },
      };
    }),

  moveCategory: (fromIndex, toIndex) =>
    set((s) => {
      const current = normalizeDashboardState(s.dashboard);
      if (
        fromIndex < 0 ||
        fromIndex >= current.categories.length ||
        toIndex < 0 ||
        toIndex >= current.categories.length
      ) {
        return s;
      }
      const categories = [...current.categories];
      const [moved] = categories.splice(fromIndex, 1);
      categories.splice(toIndex, 0, moved);
      return {
        dashboard: {
          ...current,
          categories,
        },
      };
    }),

  moveModuleToCategory: (moduleId, targetCategoryId) =>
    set((s) => {
      const current = normalizeDashboardState(s.dashboard);
      let updatedCategories = current.categories.map((c) => ({
        ...c,
        moduleIds: c.moduleIds.filter((id) => id !== moduleId),
      }));
      let updatedHidden = current.hidden.filter((id) => id !== moduleId);

      if (targetCategoryId === "hidden") {
        if (!updatedHidden.includes(moduleId)) {
          updatedHidden.push(moduleId);
        }
      } else {
        updatedCategories = updatedCategories.map((c) =>
          c.id === targetCategoryId
            ? {
                ...c,
                moduleIds: c.moduleIds.includes(moduleId)
                  ? c.moduleIds
                  : [...c.moduleIds, moduleId],
              }
            : c
        );
      }

      return {
        dashboard: {
          categories: updatedCategories,
          hidden: updatedHidden,
        },
      };
    }),

  hideModule: (id) => get().moveModuleToCategory(id, "hidden"),

  showModule: (id, targetCategoryId) =>
    set((s) => {
      const current = normalizeDashboardState(s.dashboard);
      const firstCatId =
        targetCategoryId || current.categories[0]?.id || "default";
      get().moveModuleToCategory(id, firstCatId);
      return {};
    }),

  reorderModulesInCategory: (categoryId, orderedIds) =>
    set((s) => {
      const current = normalizeDashboardState(s.dashboard);
      if (categoryId === "hidden") {
        return {
          dashboard: {
            ...current,
            hidden: orderedIds,
          },
        };
      }
      return {
        dashboard: {
          ...current,
          categories: current.categories.map((c) =>
            c.id === categoryId ? { ...c, moduleIds: orderedIds } : c
          ),
        },
      };
    }),

  reorderModules: (orderedIds) =>
    set((s) => {
      const current = normalizeDashboardState(s.dashboard);
      if (current.categories.length > 0) {
        const firstCatId = current.categories[0].id;
        get().reorderModulesInCategory(firstCatId, orderedIds);
      }
      return {};
    }),
});
