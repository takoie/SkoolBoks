import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "./tauriStorage";
import {
  NORWEGIAN_ALPHABET,
  pickLetter,
  commitRound,
} from "../lib/stiansGame";
import { makeEmptyRound } from "../lib/tofakta";
import { generateWordPack } from "../lib/bombWords";

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
    phase: "setup", // setup | idle | writing | reviewing
    pointsPerRound: 1,
    bonusEnabled: false,
    bonusPoints: 1,
    timerSeconds: 60,
    roundMode: "timed", // timed | shout — decided in setup, not mid-round
    leadGroupId: null,
    review: null, // { categoryIndex, groupOrder: string[], marks: {groupId: {category: bool}} }
    scores: {}, // { groupId: { byCategory: {category: number}, bonus: number } }
  };
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      activeModule: "dashboard",
      setActiveModule: (id) => set({ activeModule: id }),

      // Dashboard layout: `order` holds visible module ids in display order,
      // `hidden` holds ids moved to the drawer. Ids not present in either
      // (e.g. a module added after this state was last persisted) are
      // treated as visible and appended at the end by the Dashboard, rather
      // than requiring a migration here.
      dashboard: { order: [], hidden: [] },
      isEditMode: false,
      toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode })),

      hideModule: (id) =>
        set((s) => ({
          dashboard: {
            order: s.dashboard.order.filter((m) => m !== id),
            hidden: s.dashboard.hidden.includes(id)
              ? s.dashboard.hidden
              : [...s.dashboard.hidden, id],
          },
        })),

      showModule: (id) =>
        set((s) => ({
          dashboard: {
            order: s.dashboard.order.includes(id)
              ? s.dashboard.order
              : [...s.dashboard.order, id],
            hidden: s.dashboard.hidden.filter((m) => m !== id),
          },
        })),

      reorderModules: (orderedIds) =>
        set((s) => ({ dashboard: { ...s.dashboard, order: orderedIds } })),

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

      // students is an array so several names can be drawn in one batch;
      // lastDrawSize remembers how many so undoLastDraw can pop the whole
      // batch instead of a single name.
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

      settings: { soundEnabled: true, theme: "dark", gjetteLanguage: "bokmal" },
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
      stiansGameHistory: [],
      // Single-level undo buffer: the stiansGame snapshot from right before
      // the most recent mark, so an accidental click (especially on the last
      // group of a category, which immediately advances or commits the
      // round) can be reverted. Cleared whenever a new round starts.
      stiansGameUndo: null,

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
      setStiansRoundMode: (mode) =>
        set((s) => ({
          stiansGame: { ...s.stiansGame, roundMode: mode },
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
          stiansGameUndo: null,
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
            stiansGameUndo: null,
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
            return {
              stiansGame: { ...g, review: { ...g.review, marks } },
              stiansGameUndo: g,
            };
          }
          const nextCategoryIndex = g.review.categoryIndex + 1;
          if (nextCategoryIndex < g.categories.length) {
            return {
              stiansGame: {
                ...g,
                review: { ...g.review, marks, categoryIndex: nextCategoryIndex },
              },
              stiansGameUndo: g,
            };
          }
          return {
            stiansGame: commitRound({ ...g, review: { ...g.review, marks } }),
            stiansGameUndo: g,
          };
        }),

      // Reverts the single most recent markStiansApproval call — including
      // one that advanced past the last group of a category (or committed
      // the whole round) — so a misclick is never unrecoverable.
      undoStiansMark: () =>
        set((s) =>
          s.stiansGameUndo
            ? { stiansGame: s.stiansGameUndo, stiansGameUndo: null }
            : {}
        ),

      // Archives the current game (if it ever left setup) into history before
      // resetting, so "+ Ny Stians game" and finished/abandoned games are
      // never silently lost — they show up in the history list instead.
      resetStiansGameFull: () =>
        set((s) => {
          const g = s.stiansGame;
          const shouldArchive = g.groups.length > 0 && g.phase !== "setup";
          if (!shouldArchive) {
            return { stiansGame: makeInitialStiansGame() };
          }
          const entry = {
            id: crypto.randomUUID(),
            endedAt: new Date().toISOString(),
            groups: g.groups,
            categories: g.categories,
            scores: g.scores,
            pointsPerRound: g.pointsPerRound,
            wasAbandoned: g.phase !== "ended",
          };
          return {
            stiansGame: makeInitialStiansGame(),
            stiansGameHistory: [entry, ...s.stiansGameHistory].slice(0, 20),
          };
        }),
      deleteStiansHistoryEntry: (id) =>
        set((s) => ({
          stiansGameHistory: s.stiansGameHistory.filter((e) => e.id !== id),
        })),

      tofaktaSessions: {},

      createTofaktaSession: (title) => {
        const id = crypto.randomUUID();
        set((s) => ({
          tofaktaSessions: {
            ...s.tofaktaSessions,
            [id]: {
              id,
              title: title.trim() || "Nytt opplegg",
              createdAt: new Date().toISOString(),
              rounds: [makeEmptyRound()],
            },
          },
        }));
        return id;
      },

      renameTofaktaSession: (sessionId, title) =>
        set((s) => {
          const trimmed = title.trim();
          if (!trimmed) return {};
          return {
            tofaktaSessions: {
              ...s.tofaktaSessions,
              [sessionId]: { ...s.tofaktaSessions[sessionId], title: trimmed },
            },
          };
        }),

      deleteTofaktaSession: (sessionId) =>
        set((s) => {
          const tofaktaSessions = { ...s.tofaktaSessions };
          delete tofaktaSessions[sessionId];
          return { tofaktaSessions };
        }),

      addTofaktaRound: (sessionId) =>
        set((s) => {
          const session = s.tofaktaSessions[sessionId];
          return {
            tofaktaSessions: {
              ...s.tofaktaSessions,
              [sessionId]: {
                ...session,
                rounds: [...session.rounds, makeEmptyRound()],
              },
            },
          };
        }),

      deleteTofaktaRound: (sessionId, roundId) =>
        set((s) => {
          const session = s.tofaktaSessions[sessionId];
          return {
            tofaktaSessions: {
              ...s.tofaktaSessions,
              [sessionId]: {
                ...session,
                rounds: session.rounds.filter((r) => r.id !== roundId),
              },
            },
          };
        }),

      updateTofaktaStatement: (sessionId, roundId, statementIndex, partial) =>
        set((s) => {
          const session = s.tofaktaSessions[sessionId];
          return {
            tofaktaSessions: {
              ...s.tofaktaSessions,
              [sessionId]: {
                ...session,
                rounds: session.rounds.map((r) =>
                  r.id !== roundId
                    ? r
                    : {
                        ...r,
                        statements: r.statements.map((st, i) =>
                          i === statementIndex ? { ...st, ...partial } : st
                        ),
                      }
                ),
              },
            },
          };
        }),

      setTofaktaLieIndex: (sessionId, roundId, lieIndex) =>
        set((s) => {
          const session = s.tofaktaSessions[sessionId];
          return {
            tofaktaSessions: {
              ...s.tofaktaSessions,
              [sessionId]: {
                ...session,
                rounds: session.rounds.map((r) =>
                  r.id === roundId ? { ...r, lieIndex } : r
                ),
              },
            },
          };
        }),

      setTofaktaRoundHeading: (sessionId, roundId, heading) =>
        set((s) => {
          const session = s.tofaktaSessions[sessionId];
          return {
            tofaktaSessions: {
              ...s.tofaktaSessions,
              [sessionId]: {
                ...session,
                rounds: session.rounds.map((r) =>
                  r.id === roundId ? { ...r, heading } : r
                ),
              },
            },
          };
        }),

      adjectiveStories: {},

      createAdjectiveStory: (title) => {
        const id = crypto.randomUUID();
        set((s) => ({
          adjectiveStories: {
            ...s.adjectiveStories,
            [id]: {
              id,
              title: title.trim() || "Ny historie",
              createdAt: new Date().toISOString(),
              text: "",
            },
          },
        }));
        return id;
      },

      updateAdjectiveStory: (id, partial) =>
        set((s) => ({
          adjectiveStories: {
            ...s.adjectiveStories,
            [id]: { ...s.adjectiveStories[id], ...partial },
          },
        })),

      deleteAdjectiveStory: (id) =>
        set((s) => {
          const adjectiveStories = { ...s.adjectiveStories };
          delete adjectiveStories[id];
          return { adjectiveStories };
        }),

      bomb: {
        minSeconds: 20,
        maxSeconds: 60,
        mode: "names", // "names" | "anonymous"
        participants: [],
        wordBank: [],
        wordImportLanguage: "bokmal", // "bokmal" | "nynorsk" | "engelsk"
        wordMinLength: 3,
        wordMaxLength: 8,
        allowMatureWords: false,
        savedWordLists: [], // [{ id, name, words: string[] }]
      },

      setBombSettings: (partial) =>
        set((s) => ({ bomb: { ...s.bomb, ...partial } })),

      setBombParticipants: (participants) =>
        set((s) => ({ bomb: { ...s.bomb, participants } })),

      importBombParticipantsFromClass: (classId) =>
        set((s) => {
          const students = s.classes[classId]?.students ?? [];
          return {
            bomb: {
              ...s.bomb,
              participants: students.map((name) => ({
                id: crypto.randomUUID(),
                name,
              })),
            },
          };
        }),

      addBombParticipant: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return {};
          return {
            bomb: {
              ...s.bomb,
              participants: [
                ...s.bomb.participants,
                { id: crypto.randomUUID(), name: trimmed },
              ],
            },
          };
        }),

      removeBombParticipant: (id) =>
        set((s) => ({
          bomb: {
            ...s.bomb,
            participants: s.bomb.participants.filter((p) => p.id !== id),
          },
        })),

      addBombWord: (word) =>
        set((s) => {
          const trimmed = word.trim();
          if (!trimmed || s.bomb.wordBank.includes(trimmed)) return {};
          return { bomb: { ...s.bomb, wordBank: [...s.bomb.wordBank, trimmed] } };
        }),

      removeBombWord: (word) =>
        set((s) => ({
          bomb: {
            ...s.bomb,
            wordBank: s.bomb.wordBank.filter((w) => w !== word),
          },
        })),

      setBombWordBank: (wordBank) =>
        set((s) => ({ bomb: { ...s.bomb, wordBank } })),

      clearBombWordBank: () =>
        set((s) => ({ bomb: { ...s.bomb, wordBank: [] } })),

      saveBombWordList: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed || s.bomb.wordBank.length === 0) return {};
          return {
            bomb: {
              ...s.bomb,
              savedWordLists: [
                ...s.bomb.savedWordLists,
                { id: crypto.randomUUID(), name: trimmed, words: s.bomb.wordBank },
              ],
            },
          };
        }),

      loadBombWordList: (id) =>
        set((s) => {
          const list = s.bomb.savedWordLists.find((l) => l.id === id);
          if (!list) return {};
          return { bomb: { ...s.bomb, wordBank: list.words } };
        }),

      deleteBombWordList: (id) =>
        set((s) => ({
          bomb: {
            ...s.bomb,
            savedWordLists: s.bomb.savedWordLists.filter((l) => l.id !== id),
          },
        })),

      importRandomWordPack: async () => {
        const s = get();
        const words = await generateWordPack(
          s.bomb.wordImportLanguage,
          50,
          s.bomb.wordBank,
          s.bomb.wordMinLength,
          s.bomb.wordMaxLength,
          s.bomb.allowMatureWords
        );
        set((s2) => ({
          bomb: { ...s2.bomb, wordBank: [...s2.bomb.wordBank, ...words] },
        }));
      },

      hangman: {
        language: "bokmal", // "bokmal" | "nynorsk" | "engelsk"
        wordMinLength: 3,
        wordMaxLength: 10,
        allowMatureWords: false,
        extraHandsFeet: false,
        extraFace: false,
      },

      setHangmanSettings: (partial) =>
        set((s) => ({ hangman: { ...s.hangman, ...partial } })),

      gangemester: {
        mode: "small", // "small" | "large" | "custom"
        customTables: [7],
        timerSeconds: 5,
        highScore: 0,
      },

      setGangemesterSettings: (partial) =>
        set((s) => ({ gangemester: { ...s.gangemester, ...partial } })),

      setGangemesterHighScore: (score) =>
        set((s) => ({
          gangemester: {
            ...s.gangemester,
            highScore: Math.max(s.gangemester.highScore, score),
          },
        })),

      // Not persisted (see partialize below) — a live competition session,
      // not something that should resume after an app restart.
      noiseMeter: { teams: [], scores: {} },

      addNoiseMeterTeam: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return {};
          return {
            noiseMeter: {
              ...s.noiseMeter,
              teams: [
                ...s.noiseMeter.teams,
                { id: crypto.randomUUID(), name: trimmed },
              ],
            },
          };
        }),

      renameNoiseMeterTeam: (id, name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return {};
          return {
            noiseMeter: {
              ...s.noiseMeter,
              teams: s.noiseMeter.teams.map((t) =>
                t.id === id ? { ...t, name: trimmed } : t
              ),
            },
          };
        }),

      removeNoiseMeterTeam: (id) =>
        set((s) => {
          const scores = { ...s.noiseMeter.scores };
          delete scores[id];
          return {
            noiseMeter: {
              ...s.noiseMeter,
              teams: s.noiseMeter.teams.filter((t) => t.id !== id),
              scores,
            },
          };
        }),

      setNoiseMeterScore: (teamId, score) =>
        set((s) => ({
          noiseMeter: {
            ...s.noiseMeter,
            scores: { ...s.noiseMeter.scores, [teamId]: score },
          },
        })),

      resetNoiseMeterScores: () =>
        set((s) => ({ noiseMeter: { ...s.noiseMeter, scores: {} } })),

      resetNoiseMeterFull: () => set({ noiseMeter: { teams: [], scores: {} } }),
    }),
    {
      name: "skoolbox-store",
      storage: createJSONStorage(() => tauriStorage),
      partialize: (s) => ({
        dashboard: s.dashboard,
        classes: s.classes,
        activeClassId: s.activeClassId,
        drawnStudents: s.drawnStudents,
        settings: s.settings,
        quizzes: s.quizzes,
        categoryBank: s.categoryBank,
        stiansGame: s.stiansGame,
        wheels: s.wheels,
        removedSectors: s.removedSectors,
        stiansGameHistory: s.stiansGameHistory,
        tofaktaSessions: s.tofaktaSessions,
        adjectiveStories: s.adjectiveStories,
        bomb: s.bomb,
        hangman: s.hangman,
        gangemester: s.gangemester,
      }),
      // Default merge shallow-replaces top-level keys, so a `settings`
      // object persisted before a new setting was added (e.g.
      // gjetteLanguage) would wipe out the new default entirely. Deep-merge
      // settings specifically so old saves keep picking up new defaults.
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        bomb: {
          ...currentState.bomb,
          ...(persistedState?.bomb ?? {}),
        },
        hangman: {
          ...currentState.hangman,
          ...(persistedState?.hangman ?? {}),
        },
        gangemester: {
          ...currentState.gangemester,
          ...(persistedState?.gangemester ?? {}),
        },
        settings: {
          ...currentState.settings,
          ...(persistedState?.settings ?? {}),
        },
      }),
    }
  )
);
