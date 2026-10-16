export const createQuizSlice = (set) => ({
  quizzes: {},
  categoryBank: [],

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

  addCategoryToBank: (name) =>
    set((s) => {
      const trimmed = name.trim();
      if (!trimmed || s.categoryBank.includes(trimmed)) return {};
      return { categoryBank: [...s.categoryBank, trimmed] };
    }),

  removeCategoryFromBank: (name) =>
    set((s) => ({
      categoryBank: s.categoryBank.filter((c) => c !== name),
      stiansGame: {
        ...s.stiansGame,
        categories: s.stiansGame.categories.filter((c) => c !== name),
      },
    })),
});
