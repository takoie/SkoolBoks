import {
  applyScheduleToGroups,
  shiftRemainingSchedule,
  shiftBackRemainingSchedule,
  chunkStudentsIntoGroups,
  shuffleArray,
  getCurrentWeekNumber,
  getCurrentYear,
} from "../../lib/ukasUtils";

export const createUkasSlice = (set) => ({
  ukasPlans: {},
  ukasPlanUndo: {},

  createUkasPlan: ({
    title,
    subject = "",
    classId = null,
    startWeek = getCurrentWeekNumber(),
    startYear = getCurrentYear(),
    interval = 1,
    groupSize = 1,
    blockedWeeks = [],
    initialStudents = [],
  }) => {
    const id = crypto.randomUUID();
    let groups = [];
    if (initialStudents && initialStudents.length > 0) {
      groups = chunkStudentsIntoGroups(initialStudents, groupSize);
    }

    const scheduledGroups = applyScheduleToGroups(
      groups,
      startWeek,
      startYear,
      interval,
      blockedWeeks
    );

    const newPlan = {
      id,
      title: title.trim() || "Ny Ukas.. aktivitet",
      subject: subject.trim(),
      classId,
      startWeek,
      startYear,
      interval,
      groupSize,
      blockedWeeks: blockedWeeks || [],
      groups: scheduledGroups,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      ukasPlans: { ...s.ukasPlans, [id]: newPlan },
    }));
    return id;
  },

  importUkasPlan: (importedPlan) => {
    const id = crypto.randomUUID();
    const scheduledGroups = applyScheduleToGroups(
      importedPlan.groups || [],
      importedPlan.startWeek || getCurrentWeekNumber(),
      importedPlan.startYear || getCurrentYear(),
      importedPlan.interval || 1,
      importedPlan.blockedWeeks || []
    );

    const newPlan = {
      id,
      title: importedPlan.title || "Importert Ukas-opplegg",
      subject: importedPlan.subject || "",
      classId: null,
      startWeek: importedPlan.startWeek || getCurrentWeekNumber(),
      startYear: importedPlan.startYear || getCurrentYear(),
      interval: importedPlan.interval || 1,
      groupSize: importedPlan.groupSize || 1,
      blockedWeeks: importedPlan.blockedWeeks || [],
      groups: scheduledGroups,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      ukasPlans: { ...s.ukasPlans, [id]: newPlan },
    }));
    return id;
  },

  updateUkasPlan: (id, partial) =>
    set((s) => {
      const existing = s.ukasPlans[id];
      if (!existing) return {};
      const updated = { ...existing, ...partial };
      const scheduled = applyScheduleToGroups(
        updated.groups,
        updated.startWeek,
        updated.startYear,
        updated.interval,
        updated.blockedWeeks
      );
      return {
        ukasPlans: {
          ...s.ukasPlans,
          [id]: { ...updated, groups: scheduled },
        },
      };
    }),

  deleteUkasPlan: (id) =>
    set((s) => {
      const ukasPlans = { ...s.ukasPlans };
      delete ukasPlans[id];
      const ukasPlanUndo = { ...s.ukasPlanUndo };
      delete ukasPlanUndo[id];
      return { ukasPlans, ukasPlanUndo };
    }),

  setUkasGroups: (planId, groups) =>
    set((s) => {
      const plan = s.ukasPlans[planId];
      if (!plan) return {};
      const scheduled = applyScheduleToGroups(
        groups,
        plan.startWeek,
        plan.startYear,
        plan.interval,
        plan.blockedWeeks
      );
      return {
        ukasPlans: {
          ...s.ukasPlans,
          [planId]: { ...plan, groups: scheduled },
        },
      };
    }),

  markUkasGroupStatus: (planId, groupId, status) =>
    set((s) => {
      const plan = s.ukasPlans[planId];
      if (!plan) return {};
      const updatedGroups = plan.groups.map((g) =>
        g.id === groupId ? { ...g, status } : g
      );
      return {
        ukasPlans: {
          ...s.ukasPlans,
          [planId]: { ...plan, groups: updatedGroups },
        },
      };
    }),

  shiftUkasPlanSchedule: (planId, fromGroupId = null) =>
    set((s) => {
      const plan = s.ukasPlans[planId];
      if (!plan) return {};
      const shiftedGroups = shiftRemainingSchedule(
        plan.groups,
        fromGroupId,
        plan.startWeek,
        plan.startYear,
        plan.interval,
        plan.blockedWeeks
      );
      return {
        ukasPlans: {
          ...s.ukasPlans,
          [planId]: { ...plan, groups: shiftedGroups },
        },
        ukasPlanUndo: {
          ...s.ukasPlanUndo,
          [planId]: plan.groups,
        },
      };
    }),

  shiftBackUkasPlanSchedule: (planId, fromGroupId = null) =>
    set((s) => {
      const plan = s.ukasPlans[planId];
      if (!plan) return {};
      const shiftedGroups = shiftBackRemainingSchedule(
        plan.groups,
        fromGroupId,
        plan.startWeek,
        plan.startYear,
        plan.interval,
        plan.blockedWeeks
      );
      return {
        ukasPlans: {
          ...s.ukasPlans,
          [planId]: { ...plan, groups: shiftedGroups },
        },
        ukasPlanUndo: {
          ...s.ukasPlanUndo,
          [planId]: plan.groups,
        },
      };
    }),

  undoUkasPlanShift: (planId) =>
    set((s) => {
      const plan = s.ukasPlans[planId];
      const previousGroups = s.ukasPlanUndo[planId];
      if (!plan || !previousGroups) return {};

      const updatedUndo = { ...s.ukasPlanUndo };
      delete updatedUndo[planId];

      return {
        ukasPlans: {
          ...s.ukasPlans,
          [planId]: { ...plan, groups: previousGroups },
        },
        ukasPlanUndo: updatedUndo,
      };
    }),

  shuffleUkasPlanGroups: (planId) =>
    set((s) => {
      const plan = s.ukasPlans[planId];
      if (!plan) return {};
      const shuffled = shuffleArray(plan.groups);
      const scheduled = applyScheduleToGroups(
        shuffled,
        plan.startWeek,
        plan.startYear,
        plan.interval,
        plan.blockedWeeks
      );
      return {
        ukasPlans: {
          ...s.ukasPlans,
          [planId]: { ...plan, groups: scheduled },
        },
      };
    }),

  reorderUkasPlanGroups: (planId, reorderedGroups) =>
    set((s) => {
      const plan = s.ukasPlans[planId];
      if (!plan) return {};
      const scheduled = applyScheduleToGroups(
        reorderedGroups,
        plan.startWeek,
        plan.startYear,
        plan.interval,
        plan.blockedWeeks
      );
      return {
        ukasPlans: {
          ...s.ukasPlans,
          [planId]: { ...plan, groups: scheduled },
        },
      };
    }),

  toggleUkasBlockedWeek: (planId, weekNumber, label = "") =>
    set((s) => {
      const plan = s.ukasPlans[planId];
      if (!plan) return {};
      const exists = plan.blockedWeeks.includes(weekNumber);

      let blockedWeeks;
      const blockedWeekLabels = { ...(plan.blockedWeekLabels || {}) };

      if (exists && !label) {
        blockedWeeks = plan.blockedWeeks.filter((w) => w !== weekNumber);
        delete blockedWeekLabels[weekNumber];
      } else {
        if (!exists) {
          blockedWeeks = [...plan.blockedWeeks, weekNumber].sort((a, b) => a - b);
        } else {
          blockedWeeks = plan.blockedWeeks;
        }
        if (label && label.trim()) {
          blockedWeekLabels[weekNumber] = label.trim();
        }
      }

      const scheduled = applyScheduleToGroups(
        plan.groups,
        plan.startWeek,
        plan.startYear,
        plan.interval,
        blockedWeeks
      );
      return {
        ukasPlans: {
          ...s.ukasPlans,
          [planId]: { ...plan, blockedWeeks, blockedWeekLabels, groups: scheduled },
        },
      };
    }),

  setUkasBlockedWeekLabel: (planId, weekNumber, label) =>
    set((s) => {
      const plan = s.ukasPlans[planId];
      if (!plan) return {};
      const blockedWeekLabels = { ...(plan.blockedWeekLabels || {}) };
      if (label && label.trim()) {
        blockedWeekLabels[weekNumber] = label.trim();
      } else {
        delete blockedWeekLabels[weekNumber];
      }
      return {
        ukasPlans: {
          ...s.ukasPlans,
          [planId]: { ...plan, blockedWeekLabels },
        },
      };
    }),

  autoGenerateUkasGroupsFromClass: (planId, classId, groupSize = 1) =>
    set((s) => {
      const plan = s.ukasPlans[planId];
      if (!plan) return {};
      const students = s.classes[classId]?.students ?? [];
      const groups = chunkStudentsIntoGroups(students, groupSize);
      const scheduled = applyScheduleToGroups(
        groups,
        plan.startWeek,
        plan.startYear,
        plan.interval,
        plan.blockedWeeks
      );
      return {
        ukasPlans: {
          ...s.ukasPlans,
          [planId]: {
            ...plan,
            classId,
            groupSize,
            groups: scheduled,
          },
        },
      };
    }),
});
