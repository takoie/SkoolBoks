export const createSettingsSlice = (set, get) => ({
  settings: { soundEnabled: true, theme: "light", gjetteLanguage: "bokmal" },
  setSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),

  hasSeenOnboarding: false,
  setHasSeenOnboarding: (val) => set({ hasSeenOnboarding: Boolean(val) }),

  securitySettings: {
    pinEnabled: false,
    pinCode: "",
  },
  isAppUnlocked: true,

  enablePinCode: (pinCode) =>
    set(() => ({
      securitySettings: { pinEnabled: true, pinCode },
      isAppUnlocked: true,
    })),

  disablePinCode: () =>
    set(() => ({
      securitySettings: { pinEnabled: false, pinCode: "" },
      isAppUnlocked: true,
    })),

  unlockApp: (pin) => {
    const state = get();
    if (state.securitySettings.pinCode === pin) {
      set({ isAppUnlocked: true });
      return true;
    }
    return false;
  },

  lockApp: () => set({ isAppUnlocked: false }),
});
