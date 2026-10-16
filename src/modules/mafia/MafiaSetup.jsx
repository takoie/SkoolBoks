import { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  UserCheck,
  VenetianMask,
  Shield,
  Search,
  User,
  Play,
  Sparkles,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { getRecommendedRoles, assignRoles, ROLES, ROLE_DETAILS } from "../../lib/mafia";

function MafiaSetup({ onStartGame, savedConfig }) {
  const activeClass = useAppStore((s) => s.classes[s.activeClassId] ?? { name: "", students: [] });

  const [players, setPlayers] = useState(() => {
    if (savedConfig?.players?.length > 0) return savedConfig.players;
    if (activeClass.students.length > 0) {
      return activeClass.students.map((name) => ({
        id: crypto.randomUUID(),
        name,
        role: ROLES.CIVILIAN,
      }));
    }
    return [
      "Spiller 1",
      "Spiller 2",
      "Spiller 3",
      "Spiller 4",
      "Spiller 5",
      "Spiller 6",
      "Spiller 7",
      "Spiller 8",
    ].map((name) => ({ id: crypto.randomUUID(), name, role: ROLES.CIVILIAN }));
  });

  const [newPlayerName, setNewPlayerName] = useState("");
  const [discussionMinutes, setDiscussionMinutes] = useState(savedConfig?.discussionMinutes ?? 3);
  const [revealRoleOnDeath, setRevealRoleOnDeath] = useState(savedConfig?.revealRoleOnDeath ?? true);

  // Role distribution state
  const [roleDistribution, setRoleDistribution] = useState(() => {
    return savedConfig?.roleDistribution ?? getRecommendedRoles(players.length);
  });

  const [isCustomRoles, setIsCustomRoles] = useState(false);

  // Role assignment mode: 'nightOneReg' (Physical cards + Natt 1 registration) | 'manual' | 'random'
  const [assignmentMode, setAssignmentMode] = useState("nightOneReg");

  function handleAddPlayer(e) {
    e?.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    setPlayers((prev) => [...prev, { id: crypto.randomUUID(), name: trimmed, role: ROLES.CIVILIAN }]);
    setNewPlayerName("");
  }

  function handleRemovePlayer(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  function handleImportFromClass() {
    if (activeClass.students.length === 0) return;
    setPlayers(
      activeClass.students.map((name) => ({
        id: crypto.randomUUID(),
        name,
        role: ROLES.CIVILIAN,
      }))
    );
    setIsCustomRoles(false);
  }

  const currentCivilians = Math.max(
    0,
    players.length - (roleDistribution.mafia + roleDistribution.doctor + roleDistribution.detective)
  );

  function updateRoleCount(roleKey, delta) {
    setIsCustomRoles(true);
    setRoleDistribution((prev) => {
      const currentVal = prev[roleKey] ?? 0;
      const newVal = Math.max(0, currentVal + delta);
      return { ...prev, [roleKey]: newVal };
    });
  }

  // Cycle player role manually in 'manual' mode
  function cyclePlayerRole(id) {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const roleOrder = [ROLES.CIVILIAN, ROLES.MAFIA, ROLES.DOCTOR, ROLES.DETECTIVE];
        const nextRole = roleOrder[(roleOrder.indexOf(p.role) + 1) % roleOrder.length];
        return { ...p, role: nextRole };
      })
    );
  }

  function handleStartGameConfirmed() {
    if (players.length < 3) return;

    let finalPlayers = [...players];

    if (assignmentMode === "random") {
      finalPlayers = assignRoles(players, {
        ...roleDistribution,
        civilian: currentCivilians,
      });
    } else if (assignmentMode === "nightOneReg") {
      // Set all roles to civilian initially; roles will be registered on Natt 1
      finalPlayers = players.map((p) => ({ ...p, role: ROLES.CIVILIAN, alive: true }));
    } else {
      // Manual mode: keep assigned roles
      finalPlayers = players.map((p) => ({ ...p, alive: true }));
    }

    onStartGame({
      players: finalPlayers,
      roleDistribution: { ...roleDistribution, civilian: currentCivilians },
      discussionMinutes,
      revealRoleOnDeath,
      isNightOneRegistration: assignmentMode === "nightOneReg",
    });
  }

  return (
    <div className="flex h-[calc(100vh-140px)] w-full flex-col justify-start overflow-hidden animate-fade-in gap-3">
      {/* Header Banner */}
      <div className="shrink-0 rounded-xl2 border border-primary/20 bg-primary/5 px-6 py-2.5 shadow-clay">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md">
            <VenetianMask size={22} />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-ink leading-tight">Oppsett og admin-konfigurasjon</h2>
            <p className="font-body text-xs text-ink/70">
              Registrer spillere og velg hvordan roller skal tildeles (Fysiske kort med Natt 1-registrering eller forhåndsvalg).
            </p>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12">
        {/* Left column: Player list */}
        <div className="flex flex-col gap-3 lg:col-span-6 overflow-hidden">
          <div className="flex flex-1 flex-col rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="text-primary" size={20} />
                <h3 className="font-heading text-base font-bold text-ink">Spillere</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-heading text-xs font-bold text-primary">
                  {players.length} spillere
                </span>
              </div>

              {activeClass.students.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportFromClass}
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-heading text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <UserCheck size={14} /> Hent fra {activeClass.name}
                </button>
              )}
            </div>

            <form onSubmit={handleAddPlayer} className="flex gap-2 mb-3 shrink-0">
              <input
                type="text"
                placeholder="Navn på ny spiller..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="flex-1 rounded-xl border-2 border-ink/10 bg-canvas px-3.5 py-1.5 font-body text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newPlayerName.trim()}
                className="flex cursor-pointer items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 font-heading text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Plus size={16} /> Legg til
              </button>
            </form>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
              {players.map((p, idx) => {
                const roleInfo = ROLE_DETAILS[p.role] || ROLE_DETAILS[ROLES.CIVILIAN];

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-ink/10 bg-canvas px-3.5 py-2 transition-colors hover:border-primary/30"
                  >
                    <span className="font-heading text-sm font-semibold text-ink">
                      {idx + 1}. {p.name}
                    </span>

                    <div className="flex items-center gap-2">
                      {assignmentMode === "manual" && (
                        <button
                          type="button"
                          onClick={() => cyclePlayerRole(p.id)}
                          className={`cursor-pointer rounded-lg border px-2.5 py-0.5 font-heading text-xs font-bold transition-colors ${roleInfo.badgeClass}`}
                          title="Klikk for å endre rolle for spilleren"
                        >
                          {roleInfo.name} 🔄
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(p.id)}
                        className="cursor-pointer text-ink/40 hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Admin mode, Roles & Rules */}
        <div className="flex flex-col gap-4 lg:col-span-6 overflow-y-auto pr-1">
          {/* Assignment Mode Selector */}
          <div className="rounded-xl2 border-2 border-primary/30 bg-primary/5 p-5 shadow-clay">
            <h3 className="font-heading text-base font-bold text-ink border-b border-primary/20 pb-2 mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Slik tildeles rollene:
            </h3>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setAssignmentMode("nightOneReg")}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  assignmentMode === "nightOneReg"
                    ? "border-primary bg-surface shadow-md ring-2 ring-primary/40"
                    : "border-ink/10 bg-surface/60 hover:border-primary/30"
                }`}
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-white">
                  {assignmentMode === "nightOneReg" && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="font-heading text-sm font-bold text-ink block">
                    🃏 Fysiske kort utdelt i klassen (Registrer på Natt 1) — Anbefalt!
                  </span>
                  <p className="font-body text-xs text-ink/70">
                    Elevene får utdelt fysiske kort først. Når Natt 1 starter ber du Mafia, Lege og Detektiv åpne øynene og trykker på navnene deres på skjermen.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentMode("manual")}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  assignmentMode === "manual"
                    ? "border-primary bg-surface shadow-md ring-2 ring-primary/40"
                    : "border-ink/10 bg-surface/60 hover:border-primary/30"
                }`}
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-white">
                  {assignmentMode === "manual" && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="font-heading text-sm font-bold text-ink block">
                    ✍️ Manuell forhåndsregistrering i listen til venstre
                  </span>
                  <p className="font-body text-xs text-ink/70">
                    Klikk direkte på rolleknappen ved siden av hver elevs navn i listen til venstre for å velge hvem som er Mafia, Lege osv. før start.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentMode("random")}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  assignmentMode === "random"
                    ? "border-primary bg-surface shadow-md ring-2 ring-primary/40"
                    : "border-ink/10 bg-surface/60 hover:border-primary/30"
                }`}
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-white">
                  {assignmentMode === "random" && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <div>
                  <span className="font-heading text-sm font-bold text-ink block">
                    🎲 Tilfeldig automatisk utdeling av appen
                  </span>
                  <p className="font-body text-xs text-ink/70">
                    Appen stokker og tildeler hemmelige roller tilfeldig til elevene.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Role Counts */}
          <div className="rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-3">
              <h3 className="font-heading text-base font-bold text-ink flex items-center gap-2">
                <Settings size={18} className="text-amber-500" />
                Antall roller i spillet
              </h3>

              <button
                type="button"
                onClick={() => {
                  setIsCustomRoles(false);
                  setRoleDistribution(getRecommendedRoles(players.length));
                }}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Bruk anbefalt
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Mafia */}
              <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-600 dark:text-red-400">
                    <VenetianMask size={16} />
                  </div>
                  <span className="font-heading text-xs font-bold text-ink">Mafia</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateRoleCount("mafia", -1)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-ink/20 bg-surface font-bold text-ink hover:bg-ink/5 text-xs"
                  >
                    -
                  </button>
                  <span className="w-4 text-center font-heading text-sm font-bold text-ink">
                    {roleDistribution.mafia}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateRoleCount("mafia", 1)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-ink/20 bg-surface font-bold text-ink hover:bg-ink/5 text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Shield size={16} />
                  </div>
                  <span className="font-heading text-xs font-bold text-ink">Lege</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateRoleCount("doctor", -1)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-ink/20 bg-surface font-bold text-ink hover:bg-ink/5 text-xs"
                  >
                    -
                  </button>
                  <span className="w-4 text-center font-heading text-sm font-bold text-ink">
                    {roleDistribution.doctor}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateRoleCount("doctor", 1)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-ink/20 bg-surface font-bold text-ink hover:bg-ink/5 text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Detective */}
              <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Search size={16} />
                  </div>
                  <span className="font-heading text-xs font-bold text-ink">Detektiv</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateRoleCount("detective", -1)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-ink/20 bg-surface font-bold text-ink hover:bg-ink/5 text-xs"
                  >
                    -
                  </button>
                  <span className="w-4 text-center font-heading text-sm font-bold text-ink">
                    {roleDistribution.detective}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateRoleCount("detective", 1)}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-ink/20 bg-surface font-bold text-ink hover:bg-ink/5 text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Civilians */}
              <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    <User size={16} />
                  </div>
                  <span className="font-heading text-xs font-bold text-ink">Sivile</span>
                </div>
                <span className="mr-2 font-heading text-sm font-bold text-ink">
                  {currentCivilians}
                </span>
              </div>
            </div>
          </div>

          {/* Game Rules settings */}
          <div className="rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay">
            <h3 className="font-heading text-base font-bold text-ink border-b border-ink/10 pb-2 mb-3">
              Regler og tider
            </h3>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-xs font-semibold text-ink">
                  Diskusjonstid i dagfasen:
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 5].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDiscussionMinutes(mins)}
                      className={`cursor-pointer rounded-lg border px-2.5 py-1 font-heading text-xs font-bold transition-colors ${
                        discussionMinutes === mins
                          ? "border-primary bg-primary text-white"
                          : "border-ink/20 bg-surface text-ink hover:bg-ink/5"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-ink/10 pt-2">
                <span className="font-body text-xs font-semibold text-ink">
                  Avslør rolle ved eliminering:
                </span>
                <button
                  type="button"
                  onClick={() => setRevealRoleOnDeath((v) => !v)}
                  className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
                    revealRoleOnDeath ? "bg-primary" : "bg-ink/30"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      revealRoleOnDeath ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Start Game Button */}
          <button
            type="button"
            onClick={handleStartGameConfirmed}
            disabled={players.length < 3 || roleDistribution.mafia < 1}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-emerald-600 py-4 font-heading text-lg font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Play size={22} /> Start Natt 1 🌙
          </button>
        </div>
      </div>
    </div>
  );
}

export default MafiaSetup;
