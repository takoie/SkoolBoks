import { useState, useEffect } from "react";
import {
  Sun,
  ShieldAlert,
  HeartHandshake,
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  Vote,
  Skull,
  Check,
} from "lucide-react";
import { ROLE_DETAILS } from "../../lib/mafia";
import { playSound } from "../../lib/sound";
import { useAppStore } from "../../store/useAppStore";

function MafiaDay({
  players,
  roundNumber,
  nightResult,
  discussionMinutes = 3,
  revealRoleOnDeath = true,
  onEliminatePlayer,
  onProceedNoElimination,
}) {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  // Day sub-steps: 'reveal' | 'discussion' | 'nomination' | 'defense' | 'countdown' | 'elimination'
  const [step, setStep] = useState("reveal");

  // Main discussion timer state
  const [timerSeconds, setTimerSeconds] = useState(discussionMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Nomination state
  const [nominatedPlayerIds, setNominatedPlayerIds] = useState([]);

  // Defense step state (stepping through candidates one by one)
  const [defenseIndex, setDefenseIndex] = useState(0);
  const [defenseSeconds, setDefenseSeconds] = useState(30);
  const [isDefenseTimerRunning, setIsDefenseTimerRunning] = useState(false);

  // 3-2-1 Voting countdown state
  const [votingCountdown, setVotingCountdown] = useState(null);

  // Elimination selection state
  const [selectedEliminationId, setSelectedEliminationId] = useState(null);

  const livingPlayers = players.filter((p) => p.alive);

  useEffect(() => {
    playSound("dayGong", soundEnabled);
  }, []);

  // Discussion timer tick
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playSound("ding", soundEnabled);
            return 0;
          }
          if (prev <= 6) playSound("tick", soundEnabled);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, soundEnabled]);

  // Defense timer tick
  useEffect(() => {
    let interval = null;
    if (isDefenseTimerRunning && defenseSeconds > 0) {
      interval = setInterval(() => {
        setDefenseSeconds((prev) => {
          if (prev <= 1) {
            setIsDefenseTimerRunning(false);
            playSound("ding", soundEnabled);
            return 0;
          }
          if (prev <= 6) playSound("tick", soundEnabled);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isDefenseTimerRunning, defenseSeconds, soundEnabled]);

  // Voting 3-2-1 countdown tick
  useEffect(() => {
    let interval = null;
    if (votingCountdown !== null && votingCountdown > 0) {
      interval = setInterval(() => {
        setVotingCountdown((prev) => {
          if (prev <= 1) {
            playSound("ding", soundEnabled);
            return 0;
          }
          playSound("tick", soundEnabled);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [votingCountdown, soundEnabled]);

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function toggleNomination(id) {
    setNominatedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  }

  function startDefenseForIndex(idx) {
    setDefenseIndex(idx);
    setDefenseSeconds(30);
    setIsDefenseTimerRunning(false);
  }

  function handleNextDefense() {
    setIsDefenseTimerRunning(false);
    if (defenseIndex + 1 < nominatedPlayerIds.length) {
      startDefenseForIndex(defenseIndex + 1);
    } else {
      setStep("countdown");
    }
  }

  function handleStartVotingCountdown() {
    setVotingCountdown(3);
    playSound("tick", soundEnabled);
  }

  function handleConfirmElimination() {
    if (selectedEliminationId === "none") {
      onProceedNoElimination();
    } else if (selectedEliminationId) {
      onEliminatePlayer(selectedEliminationId);
    }
  }

  const killedPlayer = nightResult?.killedPlayer;
  const isSavedByDoctor = nightResult?.isSavedByDoctor;

  const currentDefensePlayer =
    nominatedPlayerIds.length > 0
      ? players.find((p) => p.id === nominatedPlayerIds[defenseIndex])
      : null;

  return (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden animate-fade-in gap-3">
      {/* Stepper Header */}
      <div className="flex items-center justify-between shrink-0 rounded-xl2 border border-amber-400/40 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 px-6 py-2.5 text-slate-950 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-slate-950 border border-white/30">
            <Sun size={22} />
          </div>
          <div>
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900/80">
              Dagfase — Runde {roundNumber}
            </span>
            <h2 className="font-heading text-lg font-black text-slate-950 leading-tight">
              Solen stiger i byen
            </h2>
          </div>
        </div>

        {/* Wizard Stepper Tabs */}
        <div className="flex items-center gap-1">
          {[
            { id: "reveal", label: "1. Avsløring" },
            { id: "discussion", label: "2. Diskusjon" },
            { id: "nomination", label: "3. Nominasjon" },
            { id: "defense", label: "4. Forsvarstaler" },
            { id: "countdown", label: "5. Avstemning" },
            { id: "elimination", label: "6. Eliminering" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === "defense" && nominatedPlayerIds.length > 0) {
                  startDefenseForIndex(0);
                }
                setStep(tab.id);
              }}
              className={`cursor-pointer rounded-lg px-2.5 py-1 font-heading text-xs font-bold transition-colors ${
                step === tab.id
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-white/20 text-slate-950 hover:bg-white/35"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Full-Width Stage Container */}
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        {/* Step 1: Oppvåkning & Avsløring */}
        {step === "reveal" && (
          <div className="flex w-full flex-1 flex-col items-center justify-center text-center rounded-xl2 border-2 border-ink/10 bg-surface p-8 shadow-clay animate-fade-slide-up">
            {isSavedByDoctor ? (
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/40 animate-pop-in">
                  <HeartHandshake size={56} />
                </div>
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                  Legen reddet dagen!
                </span>
                <h3 className="font-heading text-3xl font-black text-ink mb-3">
                  "Det var et drapsforsøk i natt, men legen klarte å redde offeret. Ingen røk ut!"
                </h3>
                <p className="font-body text-base text-ink/70 max-w-lg mb-8">
                  Byen er trygg for denne gang. Ingen deltakere ble eliminert i natt.
                </p>
              </div>
            ) : killedPlayer ? (
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20 text-red-600 dark:text-red-400 border-2 border-red-500/40 animate-pop-in">
                  <ShieldAlert size={56} />
                </div>
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
                  Et tragisk drap skjedde i natt
                </span>
                <h3 className="font-heading text-3xl font-black text-ink mb-3">
                  "I løpet av natten skjedde det et drap. <span className="text-red-600 dark:text-red-400">{killedPlayer.name}</span> ble eliminert."
                </h3>
                {revealRoleOnDeath && (
                  <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 font-heading text-base font-bold text-red-700 dark:text-red-300">
                    Rolle avslørt: {ROLE_DETAILS[killedPlayer.role]?.name ?? "Ukjent"}
                  </div>
                )}
                <p className="font-body text-base text-ink/70 max-w-lg mb-8">
                  Spilleren må nå forholde seg helt stille og kan ikke lenger delta i diskusjonen.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <h3 className="font-heading text-3xl font-black text-ink mb-3">
                  Ingenting skjedde i natt.
                </h3>
                <p className="font-body text-base text-ink/70 mb-8">
                  Alle våkner trygt til en ny dag i byen.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep("discussion")}
              className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-10 py-4 font-heading text-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Diskusjonsfasen →
            </button>
          </div>
        )}

        {/* Step 2: Diskusjonsfase */}
        {step === "discussion" && (
          <div className="flex w-full flex-1 flex-col items-center justify-center text-center rounded-xl2 border-2 border-ink/10 bg-surface p-8 shadow-clay animate-fade-slide-up">
            <h3 className="font-heading text-2xl font-bold text-ink mb-2">
              Diskusjonsfase
            </h3>
            <p className="font-body text-base text-ink/70 max-w-xl mb-6">
              "Dere har {discussionMinutes} minutter til å diskutere hvem dere mistenker er Mafia. Se etter motstridende forklaringer eller mistenkelig oppførsel."
            </p>

            {/* Giant Central Projector Clock */}
            <div className="my-2 flex h-48 w-96 items-center justify-center rounded-3xl border-4 border-primary/30 bg-primary/5 shadow-inner">
              <span className="font-heading text-8xl font-black text-primary tracking-wider font-mono">
                {formatTime(timerSeconds)}
              </span>
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsTimerRunning((v) => !v)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-8 py-3.5 font-heading text-lg font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                  isTimerRunning ? "bg-amber-600" : "bg-primary"
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause size={22} /> Pause timer
                  </>
                ) : (
                  <>
                    <Play size={22} /> Start nedtelling
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(discussionMinutes * 60);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink/20 bg-surface px-5 py-3.5 font-heading text-sm font-semibold text-ink hover:bg-ink/5"
              >
                <RotateCcw size={18} /> Nullstill
              </button>
            </div>

            <div className="mt-8 flex justify-center border-t border-ink/10 pt-4 w-full">
              <button
                type="button"
                onClick={() => setStep("nomination")}
                className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-8 py-3.5 font-heading text-lg font-bold text-white shadow-lg hover:bg-primary-hover"
              >
                Gå til Nominasjon →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Nominasjonsfase */}
        {step === "nomination" && (
          <div className="flex w-full flex-1 flex-col justify-between rounded-xl2 border-2 border-ink/10 bg-surface p-6 shadow-clay animate-fade-slide-up">
            <div className="border-b border-ink/10 pb-3 shrink-0 text-center">
              <h3 className="font-heading text-xl font-bold text-ink mb-0.5">
                Nominasjon av kandidater
              </h3>
              <p className="font-body text-xs text-ink/70">
                Spillerne nominerer sine mistenkte. Velg hvilke spillere som er nominert før forsvarstalene.
              </p>
            </div>

            {/* Responsive grid filling the whole 1920px width without scrolling */}
            <div className="my-auto py-2">
              <span className="font-heading text-xs font-bold text-ink/70 mb-2 block uppercase tracking-wider">
                Velg hvem som skal nomineres ({livingPlayers.length} levende spillere):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                {livingPlayers.map((player) => {
                  const isNominated = nominatedPlayerIds.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => toggleNomination(player.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 font-heading text-sm font-bold transition-all ${
                        isNominated
                          ? "border-amber-500 bg-amber-500/20 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/40 shadow-xs"
                          : "border-ink/10 bg-canvas text-ink hover:border-amber-500/40"
                      }`}
                    >
                      <span className="truncate">{player.name}</span>
                      {isNominated && <Check size={18} className="text-amber-500 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-ink/10 pt-3 shrink-0">
              <span className="font-heading text-sm font-semibold text-ink/70">
                {nominatedPlayerIds.length} kandidat(er) nominert
              </span>

              <button
                type="button"
                onClick={() => {
                  if (nominatedPlayerIds.length > 0) {
                    startDefenseForIndex(0);
                    setStep("defense");
                  } else {
                    setStep("countdown");
                  }
                }}
                className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-8 py-3 font-heading text-lg font-bold text-white shadow-lg hover:bg-primary-hover"
              >
                {nominatedPlayerIds.length > 0
                  ? "Start forsvarstaler →"
                  : "Hopp over forsvarstaler og gå til avstemning →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Forsvarstale (Single Candidate Fullscreen View) */}
        {step === "defense" && (
          <div className="flex w-full flex-1 flex-col items-center justify-center text-center rounded-xl2 border-2 border-amber-500/40 bg-surface p-8 shadow-clay animate-fade-slide-up">
            {currentDefensePlayer ? (
              <>
                <div className="mb-2 rounded-full bg-amber-500/10 px-4 py-1 font-heading text-xs font-bold text-amber-600 dark:text-amber-400">
                  Forsvarstale {defenseIndex + 1} av {nominatedPlayerIds.length}
                </div>

                <h3 className="font-heading text-3xl font-black text-ink mb-1">
                  Forsvarstale for:{" "}
                  <span className="text-amber-600 dark:text-amber-400">
                    {currentDefensePlayer.name}
                  </span>
                </h3>
                <p className="font-body text-sm text-ink/70 mb-6">
                  Spilleren har 30 sekunder til å tale sin sak for klassen.
                </p>

                {/* Giant 30-Second Defense Clock */}
                <div className="my-2 flex h-48 w-96 items-center justify-center rounded-3xl border-4 border-amber-500/40 bg-amber-500/10 shadow-inner">
                  <span className="font-heading text-8xl font-black font-mono text-amber-600 dark:text-amber-400">
                    {defenseSeconds}s
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsDefenseTimerRunning((v) => !v)}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl px-8 py-3.5 font-heading text-lg font-bold text-slate-950 shadow-md hover:opacity-90 ${
                      isDefenseTimerRunning ? "bg-amber-600 text-white" : "bg-amber-500"
                    }`}
                  >
                    {isDefenseTimerRunning ? (
                      <>
                        <Pause size={22} /> Pause
                      </>
                    ) : (
                      <>
                        <Play size={22} /> Start 30s timer
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDefenseTimerRunning(false);
                      setDefenseSeconds(30);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink/20 bg-surface px-5 py-3.5 font-heading text-sm font-semibold text-ink hover:bg-ink/5"
                  >
                    <RotateCcw size={18} /> Restart 30s
                  </button>
                </div>

                <div className="mt-8 flex justify-center border-t border-ink/10 pt-4 w-full">
                  <button
                    type="button"
                    onClick={handleNextDefense}
                    className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-8 py-3.5 font-heading text-lg font-bold text-white shadow-lg hover:bg-primary-hover"
                  >
                    {defenseIndex + 1 < nominatedPlayerIds.length
                      ? "Neste kandidat sin forsvarstale →"
                      : "Fullfør forsvarstaler og gå til avstemning →"}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-8">
                <h3 className="font-heading text-2xl font-bold text-ink mb-4">
                  Ingen kandidater nominert
                </h3>
                <button
                  type="button"
                  onClick={() => setStep("countdown")}
                  className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-8 py-3.5 font-heading text-lg font-bold text-white shadow-lg"
                >
                  Gå direkte til avstemning →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Felles Avstemning (3-2-1 Countdown) */}
        {step === "countdown" && (
          <div className="flex w-full flex-1 flex-col items-center justify-center text-center rounded-xl2 border-2 border-ink/10 bg-surface p-8 shadow-clay animate-fade-slide-up">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Vote size={36} />
            </div>

            <h3 className="font-heading text-3xl font-black text-ink mb-2">
              Felles Avstemning
            </h3>
            <p className="font-body text-base text-ink/70 max-w-lg mb-6">
              "Alle deltakere stemmer samtidig på 3-2-1. Pek tydelig på din valgte kandidat når nedtellingen når 1."
            </p>

            {/* Giant Countdown Banner */}
            <div className="my-4 flex h-52 w-full max-w-2xl items-center justify-center rounded-3xl border-4 border-primary/30 bg-primary/5 p-6 text-center shadow-inner">
              {votingCountdown !== null ? (
                votingCountdown > 0 ? (
                  <span className="font-heading text-9xl font-black text-primary font-mono animate-wiggle">
                    {votingCountdown}...
                  </span>
                ) : (
                  <span className="font-heading text-5xl font-black text-emerald-600 dark:text-emerald-400 animate-pop-in">
                    👉 STEM NÅ! (Pek på 1)
                  </span>
                )
              ) : (
                <span className="font-heading text-2xl font-bold text-ink/60">
                  Trykk på knappen under for å starte 3-2-1 nedtelling!
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={handleStartVotingCountdown}
                className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-primary px-8 py-3.5 font-heading text-lg font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Vote size={22} /> Start nedtelling 3-2-1!
              </button>
            </div>

            <div className="mt-8 flex justify-center border-t border-ink/10 pt-4 w-full">
              <button
                type="button"
                onClick={() => setStep("elimination")}
                className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-destructive px-8 py-3.5 font-heading text-lg font-bold text-white shadow-lg"
              >
                Registrer eliminering →
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Eliminering */}
        {step === "elimination" && (
          <div className="flex w-full flex-1 flex-col justify-between rounded-xl2 border-2 border-ink/10 bg-surface p-6 shadow-clay animate-fade-slide-up">
            <div className="border-b border-ink/10 pb-3 shrink-0 text-center">
              <h3 className="font-heading text-xl font-bold text-ink mb-0.5">
                Eliminer valgt spiller
              </h3>
              <p className="font-body text-xs text-ink/70">
                Velg spilleren som fikk flest stemmer og skal elimineres fra spillet.
              </p>
            </div>

            {/* Responsive Grid filling whole width with NO scrollbar */}
            <div className="my-auto py-2">
              <span className="font-heading text-xs font-bold text-ink/70 mb-2 block uppercase tracking-wider">
                Velgvem som røk ut:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                {livingPlayers.map((player) => {
                  const isSelected = selectedEliminationId === player.id;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setSelectedEliminationId(player.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 font-heading text-sm font-bold transition-all ${
                        isSelected
                          ? "border-destructive bg-destructive/20 text-destructive ring-2 ring-destructive/40 shadow-xs"
                          : "border-ink/10 bg-canvas text-ink hover:border-destructive/40"
                      }`}
                    >
                      <span className="truncate">{player.name}</span>
                      {isSelected && <Skull size={18} className="text-destructive shrink-0 ml-1" />}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setSelectedEliminationId("none")}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 font-heading text-sm font-bold transition-all ${
                    selectedEliminationId === "none"
                      ? "border-secondary bg-secondary/20 text-secondary ring-2 ring-secondary/40 shadow-xs"
                      : "border-ink/10 bg-canvas text-ink/70 hover:border-secondary/40"
                  }`}
                >
                  <span className="truncate">Uavgjort / Ingen ut</span>
                  {selectedEliminationId === "none" && <Check size={18} className="text-secondary shrink-0 ml-1" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-ink/10 pt-3 shrink-0">
              <button
                type="button"
                disabled={!selectedEliminationId}
                onClick={handleConfirmElimination}
                className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-destructive px-8 py-3 font-heading text-lg font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
              >
                <Skull size={20} /> Bekreft eliminering og avslutt dagfasen →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MafiaDay;
