import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { tauriStorage } from "./tauriStorage";

import { createDashboardSlice, normalizeDashboardState } from "./slices/createDashboardSlice";
import { createClassSlice } from "./slices/createClassSlice";
import { createSettingsSlice } from "./slices/createSettingsSlice";
import { createWheelSlice } from "./slices/createWheelSlice";
import { createDilemmaSlice } from "./slices/createDilemmaSlice";
import { createUkasSlice } from "./slices/createUkasSlice";
import { createQuizSlice } from "./slices/createQuizSlice";
import { createGameModulesSlice } from "./slices/createGameModulesSlice";
import { createNotaterSlice } from "./slices/createNotaterSlice";

export { normalizeDashboardState };

export const useAppStore = create(
  persist(
    (set, get) => ({
      ...createDashboardSlice(set, get),
      ...createClassSlice(set, get),
      ...createSettingsSlice(set, get),
      ...createWheelSlice(set, get),
      ...createDilemmaSlice(set, get),
      ...createUkasSlice(set, get),
      ...createQuizSlice(set, get),
      ...createGameModulesSlice(set, get),
      ...createNotaterSlice(set, get),
    }),
    {
      name: "skoolboks-store",
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
        mafiaSession: s.mafiaSession,
        byebyeCustomRules: s.byebyeCustomRules,
        oktSessions: s.oktSessions,
        ukasPlans: s.ukasPlans,
        dilemmaSessions: s.dilemmaSessions,
        hasSeenOnboarding: s.hasSeenOnboarding,
        personalNotes: s.personalNotes,
        classBoards: s.classBoards,
        activeBoardId: s.activeBoardId,
        noteCategories: s.noteCategories,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        personalNotes: Array.isArray(persistedState?.personalNotes)
          ? persistedState.personalNotes
          : currentState.personalNotes,
        classBoards:
          persistedState?.classBoards &&
          Object.keys(persistedState.classBoards).length > 0
            ? persistedState.classBoards
            : currentState.classBoards,
        noteCategories: Array.isArray(persistedState?.noteCategories)
          ? persistedState.noteCategories
          : currentState.noteCategories,
        activeBoardId: persistedState?.activeBoardId ?? currentState.activeBoardId,
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
        mafiaSession: {
          ...currentState.mafiaSession,
          ...(persistedState?.mafiaSession ?? {}),
        },
        settings: {
          ...currentState.settings,
          ...(persistedState?.settings ?? {}),
        },
        securitySettings: {
          ...currentState.securitySettings,
          ...(persistedState?.securitySettings ?? {}),
        },
        isAppUnlocked: persistedState?.securitySettings?.pinEnabled
          ? false
          : true,
        byebyeCustomRules:
          persistedState?.byebyeCustomRules ?? currentState.byebyeCustomRules,
        oktSessions: Array.isArray(persistedState?.oktSessions)
          ? persistedState.oktSessions
          : currentState.oktSessions,
        ukasPlans: persistedState?.ukasPlans ?? currentState.ukasPlans,
        dilemmaSessions:
          persistedState?.dilemmaSessions &&
          Object.keys(persistedState.dilemmaSessions).length > 0
            ? persistedState.dilemmaSessions
            : currentState.dilemmaSessions,
        hasSeenOnboarding: persistedState?.hasSeenOnboarding ?? false,
      }),
    }
  )
);
