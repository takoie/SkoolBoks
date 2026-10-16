/**
 * Mafia Game Logic & Helpers for SkoolBoks
 */

export const ROLES = {
  MAFIA: "mafia",
  DOCTOR: "doctor",
  DETECTIVE: "detective",
  CIVILIAN: "civilian",
};

export const ROLE_DETAILS = {
  [ROLES.MAFIA]: {
    id: ROLES.MAFIA,
    name: "Mafia",
    team: "mafia",
    teamName: "Mafiaen",
    badgeClass: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
    color: "#ef4444",
    iconName: "VenetianMask",
    description: "Våkner om natten og velger et offer som skal elimineres.",
  },
  [ROLES.DOCTOR]: {
    id: ROLES.DOCTOR,
    name: "Lege",
    team: "civilians",
    teamName: "De Sivile",
    badgeClass: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    color: "#10b981",
    iconName: "Shield",
    description: "Våkner om natten og velger en person som skal beskyttes mot angrep.",
  },
  [ROLES.DETECTIVE]: {
    id: ROLES.DETECTIVE,
    name: "Detektiv",
    team: "civilians",
    teamName: "De Sivile",
    badgeClass: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    color: "#f59e0b",
    iconName: "Search",
    description: "Våkner om natten og undersøker om en valgt spiller er Ond (Mafia) eller God (Sivil).",
  },
  [ROLES.CIVILIAN]: {
    id: ROLES.CIVILIAN,
    name: "Sivil",
    team: "civilians",
    teamName: "De Sivile",
    badgeClass: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
    color: "#3b82f6",
    iconName: "User",
    description: "Sover om natten. Stemmer og diskuterer om dagen for å finne mafiaen.",
  },
};

/**
 * Calculates recommended role counts based on total player count.
 */
export function getRecommendedRoles(playerCount) {
  const count = Math.max(0, Number(playerCount) || 0);
  if (count < 3) {
    return { mafia: 1, doctor: 0, detective: 0, civilian: Math.max(0, count - 1) };
  }
  
  let mafia = 1;
  if (count >= 7 && count <= 11) mafia = 2;
  else if (count >= 12 && count <= 15) mafia = 3;
  else if (count >= 16) mafia = 4;

  const doctor = count >= 4 ? 1 : 0;
  const detective = count >= 5 ? 1 : 0;
  const civilian = Math.max(0, count - (mafia + doctor + detective));

  return { mafia, doctor, detective, civilian };
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
export function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Assigns roles to a list of player names/objects given a role distribution object.
 */
export function assignRoles(playerList, roleDistribution) {
  const { mafia = 0, doctor = 0, detective = 0, civilian = 0 } = roleDistribution;

  const roleDeck = [
    ...Array(mafia).fill(ROLES.MAFIA),
    ...Array(doctor).fill(ROLES.DOCTOR),
    ...Array(detective).fill(ROLES.DETECTIVE),
    ...Array(civilian).fill(ROLES.CIVILIAN),
  ];

  const shuffledRoles = shuffleArray(roleDeck);

  return playerList.map((player, index) => {
    const name = typeof player === "string" ? player : player.name;
    const id = player.id || crypto.randomUUID();
    const assignedRole = shuffledRoles[index] || ROLES.CIVILIAN;

    return {
      id,
      name,
      role: assignedRole,
      alive: true,
    };
  });
}

/**
 * Checks victory condition based on current player list.
 * Returns: 'civilians' | 'mafia' | null
 */
export function checkVictoryCondition(players) {
  const livingPlayers = players.filter((p) => p.alive);
  const livingMafia = livingPlayers.filter((p) => p.role === ROLES.MAFIA).length;
  const livingCivilians = livingPlayers.filter((p) => p.role !== ROLES.MAFIA).length;

  if (livingMafia === 0) {
    return "civilians";
  }

  if (livingMafia >= livingCivilians && livingMafia > 0) {
    return "mafia";
  }

  return null;
}
