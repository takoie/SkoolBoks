import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "./tauriStorage";
import {
  NORWEGIAN_ALPHABET,
  pickLetter,
  pickRerollLetter,
  commitRound,
} from "../lib/stiansGame";

const DEFAULT_CLASS_ID = "default";

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  const safe = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(min, Math.min(max, safe));
}

function makeInitialStiansGame() {
  return {
    groups: [],
    categories: [],
    usedLetters: [],
    currentLetter: null,
    phase: "setup", // setup | idle | writing | reviewing | ended
    pointsPerRound: 1,
    bonusEnabled: false,
    bonusPoints: 1,
    timerSeconds: 60,
    leadGroupId: null,
    review: null, // { categoryIndex, groupOrder: string[], marks: {groupId: {category: bool}} }
    scores: {}, // { groupId: { byCategory: {category: number}, bonus: number } }
  };
}

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
        set((s) => ({ drawnStudents: { ...s.drawnStudents, [classId]: [] } })),

      markDrawn: (classId, student) =>
        set((s) => ({
          drawnStudents: {
            ...s.drawnStudents,
            [classId]: [...(s.drawnStudents[classId] ?? []), student],
          },
        })),

      undoLastDraw: (classId) =>
        set((s) => ({
          drawnStudents: {
            ...s.drawnStudents,
            [classId]: (s.drawnStudents[classId] ?? []).slice(0, -1),
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

      wheels: {},

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

      removedSectors: {},

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

      categoryBank: [],
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

      stiansGame: makeInitialStiansGame(),

      addStiansGroup: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return {};
          return {
            stiansGame: {
              ...s.stiansGame,
              groups: [
                ...s.stiansGame.groups,
                { id: crypto.randomUUID(), name: trimmed },
              ],
            },
          };
        }),
      renameStiansGroup: (id, name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return {};
          return {
            stiansGame: {
              ...s.stiansGame,
              groups: s.stiansGame.groups.map((g) =>
                g.id === id ? { ...g, name: trimmed } : g
              ),
            },
          };
        }),
      removeStiansGroup: (id) =>
        set((s) => {
          const scores = { ...s.stiansGame.scores };
          delete scores[id];
          return {
            stiansGame: {
              ...s.stiansGame,
              groups: s.stiansGame.groups.filter((g) => g.id !== id),
              scores,
            },
          };
        }),

      setStiansCategories: (categories) =>
        set((s) => ({
          stiansGame: { ...s.stiansGame, categories: [...new Set(categories)] },
        })),

      startStiansGame: () =>
        set((s) => ({ stiansGame: { ...s.stiansGame, phase: "idle" } })),

      setStiansPointsPerRound: (n) =>
        set((s) => ({
          stiansGame: {
            ...s.stiansGame,
            pointsPerRound: clampNumber(n, 1, Infinity, 1),
          },
        })),
      setStiansBonusEnabled: (enabled) =>
        set((s) => ({
          stiansGame: { ...s.stiansGame, bonusEnabled: enabled },
        })),
      setStiansBonusPoints: (n) =>
        set((s) => ({
          stiansGame: {
            ...s.stiansGame,
            bonusPoints: clampNumber(n, 1, Infinity, 1),
          },
        })),
      setStiansTimerSeconds: (n) =>
        set((s) => ({
          stiansGame: {
            ...s.stiansGame,
            timerSeconds: clampNumber(n, 5, 600, 60),
          },
        })),

      drawStiansLetter: () =>
        set((s) => {
          const allUsed =
            s.stiansGame.usedLetters.length >= NORWEGIAN_ALPHABET.length;
          const usedLetters = allUsed ? [] : s.stiansGame.usedLetters;
          const letter = pickLetter(usedLetters);
          return {
            stiansGame: {
              ...s.stiansGame,
              currentLetter: letter,
              usedLetters: [...usedLetters, letter],
            },
          };
        }),
      rerollStiansLetter: () =>
        set((s) => {
          const { usedLetters, currentLetter } = s.stiansGame;
          const usedWithoutCurrent = usedLetters.filter(
            (l) => l !== currentLetter
          );
          const letter = pickRerollLetter(usedWithoutCurrent, currentLetter);
          return {
            stiansGame: {
              ...s.stiansGame,
              currentLetter: letter,
              usedLetters: [...usedWithoutCurrent, letter],
            },
          };
        }),
      setStiansManualLetter: (letter) =>
        set((s) => {
          const upper = letter.trim().toLocaleUpperCase("no");
          if (!NORWEGIAN_ALPHABET.includes(upper)) return {};
          const usedLetters = s.stiansGame.usedLetters.includes(upper)
            ? s.stiansGame.usedLetters
            : [...s.stiansGame.usedLetters, upper];
          return {
            stiansGame: { ...s.stiansGame, currentLetter: upper, usedLetters },
          };
        }),

      startStiansWriting: () =>
        set((s) => ({
          stiansGame: { ...s.stiansGame, phase: "writing", leadGroupId: null },
        })),

      stopStiansWriting: (groupId = null) =>
        set((s) => {
          if (s.stiansGame.groups.length === 0 || s.stiansGame.categories.length === 0)
            return {};
          const allGroupIds = s.stiansGame.groups.map((g) => g.id);
          const order = groupId
            ? [groupId, ...allGroupIds.filter((id) => id !== groupId)]
            : allGroupIds;
          return {
            stiansGame: {
              ...s.stiansGame,
              phase: "reviewing",
              leadGroupId: groupId,
              review: { categoryIndex: 0, groupOrder: order, marks: {} },
            },
          };
        }),

      // mark is a point multiplier: 1 = godkjent, 0.5 = halv uttelling,
      // 0 = ikke godkjent, -1 = minuspoeng. Any group can be marked at any
      // time (no forced turn order), so groupId is explicit rather than
      // inferred from whose "turn" it is.
      markStiansApproval: (groupId, mark) =>
        set((s) => {
          const g = s.stiansGame;
          if (!g.review) return {};
          const category = g.categories[g.review.categoryIndex];
          const marks = {
            ...g.review.marks,
            [groupId]: {
              ...g.review.marks[groupId],
              [category]: mark,
            },
          };
          const allMarked = g.review.groupOrder.every(
            (id) => marks[id]?.[category] !== undefined
          );
          if (!allMarked) {
            return { stiansGame: { ...g, review: { ...g.review, marks } } };
          }
          const nextCategoryIndex = g.review.categoryIndex + 1;
          if (nextCategoryIndex < g.categories.length) {
            return {
              stiansGame: {
                ...g,
                review: { ...g.review, marks, categoryIndex: nextCategoryIndex },
              },
            };
          }
          return {
            stiansGame: commitRound({ ...g, review: { ...g.review, marks } }),
          };
        }),

      endStiansGame: () =>
        set((s) => ({ stiansGame: { ...s.stiansGame, phase: "ended" } })),
      resetStiansGameScores: () =>
        set((s) => ({
          stiansGame: {
            ...s.stiansGame,
            scores: {},
            usedLetters: [],
            currentLetter: null,
            phase: "idle",
            review: null,
            leadGroupId: null,
          },
        })),
      resetStiansGameFull: () =>
        set(() => ({ stiansGame: makeInitialStiansGame() })),
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
        categoryBank: s.categoryBank,
        stiansGame: s.stiansGame,
        wheels: s.wheels,
        removedSectors: s.removedSectors,
      }),
    }
  )
);
