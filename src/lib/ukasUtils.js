/**
 * Helper utilities for the Ukas.. module:
 * ISO week calculations, schedule auto-assignment, blocked week skipping,
 * schedule shifting, and student group generation.
 */

// Returns the ISO 8601 week number and year for a given Date
export function getISOWeekDetails(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

export function getCurrentWeekNumber() {
  return getISOWeekDetails().week;
}

export function getCurrentYear() {
  return getISOWeekDetails().year;
}

// Total ISO weeks in a given year (52 or 53)
export function getWeeksInYear(year) {
  const d = new Date(year, 11, 31);
  const { week } = getISOWeekDetails(d);
  return week === 1 ? 52 : week;
}

/**
 * Common Norwegian school holiday presets for blocked weeks selection
 */
export const HOLIDAY_PRESETS = [
  { label: "Høstferie (Uke 40)", weeks: [40], name: "Høstferie" },
  { label: "Juleferie (Uke 51 & 52)", weeks: [51, 52], name: "Juleferie" },
  { label: "Vinterferie (Uke 8)", weeks: [8], name: "Vinterferie" },
  { label: "Påskeferie (Uke 14)", weeks: [14], name: "Påskeferie" },
];

/**
 * Parses user input strings like "40", "51-52", "8, 9, 14", or "40-42, 51"
 * into a sorted array of valid week numbers (1-53).
 */
export function parseWeekInput(input) {
  if (!input || typeof input !== "string") return [];
  const parts = input.split(/[,;\s]+/);
  const weeks = new Set();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let w = Math.max(1, start); w <= Math.min(53, end); w++) {
          weeks.add(w);
        }
      }
    } else {
      const w = parseInt(trimmed, 10);
      if (!isNaN(w) && w >= 1 && w <= 53) {
        weeks.add(w);
      }
    }
  }

  return Array.from(weeks).sort((a, b) => a - b);
}

/**
 * Calculates scheduled weeks for N groups given a start week, start year, interval,
 * and a list of blocked week numbers.
 * Auto-advances across year boundaries (e.g. week 52/53 -> year + 1, week 1).
 */
export function generateScheduleWeeks(
  count,
  startWeek = 1,
  startYear = getCurrentYear(),
  interval = 1,
  blockedWeeks = []
) {
  const blockedSet = new Set(blockedWeeks.map(Number));
  const schedule = [];

  let currentWeek = startWeek;
  let currentYear = startYear;

  for (let i = 0; i < count; i++) {
    // Find next valid week that is not blocked
    while (blockedSet.has(currentWeek)) {
      currentWeek++;
      const maxWeeks = getWeeksInYear(currentYear);
      if (currentWeek > maxWeeks) {
        currentWeek = 1;
        currentYear++;
      }
    }

    schedule.push({ week: currentWeek, year: currentYear });

    // Advance by interval for the next item
    for (let step = 0; step < interval; step++) {
      currentWeek++;
      const maxWeeks = getWeeksInYear(currentYear);
      if (currentWeek > maxWeeks) {
        currentWeek = 1;
        currentYear++;
      }
    }
  }

  return schedule;
}

/**
 * Assigns generated schedule weeks to an array of group objects.
 */
export function applyScheduleToGroups(
  groups,
  startWeek = 1,
  startYear = getCurrentYear(),
  interval = 1,
  blockedWeeks = []
) {
  if (!groups || groups.length === 0) return [];
  const schedule = generateScheduleWeeks(
    groups.length,
    startWeek,
    startYear,
    interval,
    blockedWeeks
  );

  return groups.map((g, idx) => ({
    ...g,
    assignedWeek: schedule[idx].week,
    assignedYear: schedule[idx].year,
  }));
}

/**
 * Shifts the schedule for uncompleted groups starting from a specific target week or index.
 * Essentially pushes all remaining (uncompleted) groups 1 slot (interval) forward.
 */
export function shiftRemainingSchedule(
  groups,
  fromGroupId = null,
  startWeek = 1,
  startYear = getCurrentYear(),
  interval = 1,
  blockedWeeks = []
) {
  if (!groups || groups.length === 0) return [];

  // Find index to shift from (either explicit group ID or first non-completed group)
  let shiftFromIdx = -1;
  if (fromGroupId) {
    shiftFromIdx = groups.findIndex((g) => g.id === fromGroupId);
  }
  if (shiftFromIdx === -1) {
    shiftFromIdx = groups.findIndex((g) => g.status !== "completed");
  }

  if (shiftFromIdx === -1) {
    // All completed, nothing to shift
    return groups;
  }

  // Get current assigned week of the shift starting group, or calculate next available week + 1
  const startTargetWeek = (groups[shiftFromIdx].assignedWeek ?? startWeek) + 1;
  const startTargetYear = groups[shiftFromIdx].assignedYear ?? startYear;

  // Generate a schedule of weeks for the remaining groups starting 1 week later
  const remainingCount = groups.length - shiftFromIdx;
  const newSchedule = generateScheduleWeeks(
    remainingCount,
    startTargetWeek,
    startTargetYear,
    interval,
    blockedWeeks
  );

  return groups.map((g, idx) => {
    if (idx < shiftFromIdx) return g; // unchanged completed or prior groups
    const schedIdx = idx - shiftFromIdx;
    return {
      ...g,
      assignedWeek: newSchedule[schedIdx].week,
      assignedYear: newSchedule[schedIdx].year,
    };
  });
}

/**
 * Shifts the schedule for uncompleted groups 1 week backward.
 */
export function shiftBackRemainingSchedule(
  groups,
  fromGroupId = null,
  startWeek = 1,
  startYear = getCurrentYear(),
  interval = 1,
  blockedWeeks = []
) {
  if (!groups || groups.length === 0) return [];

  let shiftFromIdx = -1;
  if (fromGroupId) {
    shiftFromIdx = groups.findIndex((g) => g.id === fromGroupId);
  }
  if (shiftFromIdx === -1) {
    shiftFromIdx = groups.findIndex((g) => g.status !== "completed");
  }

  if (shiftFromIdx === -1) return groups;

  const currentAssignedWeek = groups[shiftFromIdx].assignedWeek ?? startWeek;
  const currentAssignedYear = groups[shiftFromIdx].assignedYear ?? startYear;

  let targetWeek = currentAssignedWeek - 1;
  let targetYear = currentAssignedYear;
  if (targetWeek < 1) {
    targetYear--;
    targetWeek = getWeeksInYear(targetYear);
  }

  if (
    shiftFromIdx === 0 &&
    (targetYear < startYear || (targetYear === startYear && targetWeek < startWeek))
  ) {
    targetWeek = startWeek;
    targetYear = startYear;
  }

  const remainingCount = groups.length - shiftFromIdx;
  const newSchedule = generateScheduleWeeks(
    remainingCount,
    targetWeek,
    targetYear,
    interval,
    blockedWeeks
  );

  return groups.map((g, idx) => {
    if (idx < shiftFromIdx) return g;
    const schedIdx = idx - shiftFromIdx;
    return {
      ...g,
      assignedWeek: newSchedule[schedIdx].week,
      assignedYear: newSchedule[schedIdx].year,
    };
  });
}

/**
 * Chunks a student name array into group objects with groupSize students per group.
 */
export function chunkStudentsIntoGroups(students, groupSize = 1) {
  if (!students || students.length === 0) return [];
  const size = Math.max(1, Math.min(4, groupSize));
  const groups = [];

  for (let i = 0; i < students.length; i += size) {
    const groupStudents = students.slice(i, i + size);
    const groupNum = Math.floor(i / size) + 1;
    groups.push({
      id: crypto.randomUUID(),
      name: groupStudents.length === 1 ? groupStudents[0] : `Gruppe ${groupNum}`,
      students: groupStudents,
      assignedWeek: null,
      assignedYear: null,
      status: "planned", // "planned" | "current" | "completed"
    });
  }

  return groups;
}

/**
 * Shuffles an array randomly (Fisher-Yates)
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Serializes a Ukas plan object into an exportable string.
 * Formats: "token" (Base64 encoded with SKOOLBOKS_UKAS: prefix), "json", "text"
 */
export function exportUkasPlanToString(plan, format = "token") {
  if (!plan) return "";

  if (format === "text") {
    const lines = [];
    lines.push(`📌 Ukas-opplegg: ${plan.title || "Uten navn"}`);
    if (plan.subject) lines.push(`Fag/Tema: ${plan.subject}`);
    lines.push(`Startuke: Uke ${plan.startWeek || 1} (${plan.startYear || getCurrentYear()})`);
    lines.push(`Intervall: ${plan.interval || 1} uke(r)`);
    lines.push("");
    lines.push("GRUPPER OG TIDSPLAN:");
    (plan.groups || []).forEach((g, idx) => {
      const weekStr = g.assignedWeek ? `Uke ${g.assignedWeek}` : `Gruppe ${idx + 1}`;
      const studentStr = g.students && g.students.length > 0 ? ` (${g.students.join(", ")})` : "";
      lines.push(`- ${weekStr}: ${g.name}${studentStr}`);
    });
    return lines.join("\n");
  }

  const data = {
    type: "skoolboks_ukas",
    v: 1,
    title: plan.title || "Ukas-opplegg",
    subject: plan.subject || "",
    startWeek: plan.startWeek || 1,
    startYear: plan.startYear || getCurrentYear(),
    interval: plan.interval || 1,
    groupSize: plan.groupSize || 1,
    blockedWeeks: plan.blockedWeeks || [],
    groups: (plan.groups || []).map((g) => ({
      name: g.name,
      students: g.students || [],
      status: g.status || "planned",
      assignedWeek: g.assignedWeek || null,
      assignedYear: g.assignedYear || null,
    })),
  };

  const jsonStr = JSON.stringify(data);

  if (format === "json") {
    return JSON.stringify(data, null, 2);
  }

  try {
    const utf8Bytes = encodeURIComponent(jsonStr);
    const base64 = btoa(utf8Bytes);
    return `SKOOLBOKS_UKAS:${base64}`;
  } catch (e) {
    return jsonStr;
  }
}

/**
 * Parses an exported string (Token, JSON, or text lines) into a Ukas plan structure.
 */
export function parseUkasPlanString(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Check for token prefix (SKOOLBOKS_UKAS: or SKOOLBOX_UKAS:)
  if (trimmed.startsWith("SKOOLBOKS_UKAS:") || trimmed.startsWith("SKOOLBOX_UKAS:")) {
    const prefix = trimmed.startsWith("SKOOLBOKS_UKAS:") ? "SKOOLBOKS_UKAS:" : "SKOOLBOX_UKAS:";
    const content = trimmed.slice(prefix.length).trim();
    try {
      const jsonStr = decodeURIComponent(atob(content));
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.groups)) {
        return buildPlanFromParsed(parsed);
      }
    } catch {
      // ignore
    }
  }

  // 2. Try JSON parsing
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.groups)) {
        return buildPlanFromParsed(parsed);
      }
    } catch {
      // ignore
    }
  }

  // 3. Line-based text import (simple format)
  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const groups = lines.map((line, idx) => {
      let name = line;
      let students = [];
      if (line.includes(":")) {
        const parts = line.split(":");
        name = parts[0].trim();
        students = parts[1].split(",").map((s) => s.trim()).filter(Boolean);
      }
      return {
        id: crypto.randomUUID(),
        name: name || `Gruppe ${idx + 1}`,
        students,
        assignedWeek: null,
        assignedYear: null,
        status: "planned",
      };
    });

    return {
      title: "Importert Ukas-opplegg",
      subject: "",
      startWeek: getCurrentWeekNumber(),
      startYear: getCurrentYear(),
      interval: 1,
      groupSize: 1,
      blockedWeeks: [],
      groups,
    };
  }

  return null;
}

function buildPlanFromParsed(parsed) {
  const groups = (parsed.groups || []).map((g, idx) => ({
    id: crypto.randomUUID(),
    name: g.name || `Gruppe ${idx + 1}`,
    students: Array.isArray(g.students) ? g.students : [],
    assignedWeek: g.assignedWeek || null,
    assignedYear: g.assignedYear || null,
    status: g.status || "planned",
  }));

  return {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Importert Ukas-opplegg",
    subject: typeof parsed.subject === "string" ? parsed.subject.trim() : "",
    startWeek: typeof parsed.startWeek === "number" ? parsed.startWeek : getCurrentWeekNumber(),
    startYear: typeof parsed.startYear === "number" ? parsed.startYear : getCurrentYear(),
    interval: typeof parsed.interval === "number" ? parsed.interval : 1,
    groupSize: typeof parsed.groupSize === "number" ? parsed.groupSize : 1,
    blockedWeeks: Array.isArray(parsed.blockedWeeks) ? parsed.blockedWeeks : [],
    groups,
  };
}

