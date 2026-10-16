import {
  NORWEGIAN_ALPHABET,
  pickLetter,
  commitRound,
} from "../../lib/stiansGame";
import { makeEmptyRound } from "../../lib/tofakta";
import { generateWordPack } from "../../lib/bombWords";
import { PRESET_SESSIONS } from "../../modules/oktplan/oktConstants";

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
    phase: "setup",
    pointsPerRound: 1,
    bonusEnabled: false,
    bonusPoints: 1,
    timerSeconds: 60,
    roundMode: "timed",
    leadGroupId: null,
    review: null,
    scores: {},
  };
}

function makeInitialMafiaSession() {
  return {
    gameState: "setup",
    players: [],
    roundNumber: 1,
    gameConfig: {
      discussionMinutes: 3,
      revealRoleOnDeath: true,
      roleDistribution: null,
    },
    nightResult: null,
    gameLog: [],
    winner: null,
  };
}

export const createGameModulesSlice = (set, get) => ({
  // Stians Game
  stiansGame: makeInitialStiansGame(),
  stiansGameHistory: [],
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

  undoStiansMark: () =>
    set((s) =>
      s.stiansGameUndo
        ? { stiansGame: s.stiansGameUndo, stiansGameUndo: null }
        : {}
    ),

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

  // Tofakta (2+1)
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

  // Adjective Stories
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

  // Bomb
  bomb: {
    minSeconds: 20,
    maxSeconds: 60,
    mode: "names",
    participants: [],
    wordBank: [],
    wordImportLanguage: "bokmal",
    wordMinLength: 3,
    wordMaxLength: 8,
    allowMatureWords: false,
    savedWordLists: [],
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

  // Hangman
  hangman: {
    language: "bokmal",
    wordMinLength: 3,
    wordMaxLength: 10,
    allowMatureWords: false,
    extraHandsFeet: false,
    extraFace: false,
  },

  setHangmanSettings: (partial) =>
    set((s) => ({ hangman: { ...s.hangman, ...partial } })),

  // Gangemester
  gangemester: {
    mode: "small",
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

  // Noise Meter
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

  // Mafia
  mafiaSession: makeInitialMafiaSession(),
  setMafiaSession: (partial) =>
    set((s) => ({ mafiaSession: { ...s.mafiaSession, ...partial } })),
  resetMafiaSession: () => set({ mafiaSession: makeInitialMafiaSession() }),

  // ByeBye Rules
  byebyeCustomRules: [
    "De som sitter helt stille med strake rygger!",
    "De som har ryddet under pulten sin!",
    "De som har plukket opp alt søppel fra sin plass!",
    "De som har hjulpet en medelev med å rydde i dag!",
    "De som har stilt opp stolen sin ordentlig!",
  ],
  addByebyeCustomRule: (rule) =>
    set((s) => {
      const trimmed = rule.trim();
      if (!trimmed || s.byebyeCustomRules.includes(trimmed)) return {};
      return { byebyeCustomRules: [...s.byebyeCustomRules, trimmed] };
    }),
  removeByebyeCustomRule: (index) =>
    set((s) => ({
      byebyeCustomRules: s.byebyeCustomRules.filter((_, i) => i !== index),
    })),
  resetByebyeCustomRules: () =>
    set({
      byebyeCustomRules: [
        "De som sitter helt stille med strake rygger!",
        "De som har ryddet under pulten sin!",
        "De som har plukket opp alt søppel fra sin plass!",
        "De som har hjulpet en medelev med å rydde i dag!",
        "De som har stilt opp stolen sin ordentlig!",
      ],
    }),

  // Økt plans
  oktSessions: PRESET_SESSIONS,
  addOktSession: (session) =>
    set((s) => ({
      oktSessions: [session, ...s.oktSessions],
    })),
  updateOktSession: (id, updatedSession) =>
    set((s) => ({
      oktSessions: s.oktSessions.map((session) =>
        session.id === id ? { ...session, ...updatedSession } : session
      ),
    })),
  deleteOktSession: (id) =>
    set((s) => ({
      oktSessions: s.oktSessions.filter((session) => session.id !== id),
    })),
  resetOktPresets: () =>
    set((s) => {
      const existingIds = new Set(s.oktSessions.map((x) => x.id));
      const missingPresets = PRESET_SESSIONS.filter((p) => !existingIds.has(p.id));
      return {
        oktSessions: [...missingPresets, ...s.oktSessions],
      };
    }),
});
