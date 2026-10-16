import { useState, useEffect } from "react";
import { Moon, EyeOff, Shield, Search, VenetianMask, Check, Sparkles, Eye } from "lucide-react";
import { ROLES } from "../../lib/mafia";
import { playSound } from "../../lib/sound";
import { useAppStore } from "../../store/useAppStore";

function MafiaNight({
  players,
  roundNumber,
  isNightOneRegistration = false,
  roleDistribution,
  onCompleteNight,
  onRegisterRoles,
}) {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  // If night 1 registration is active, we start in 'reg-sleep' | 'reg-mafia' | 'reg-doctor' | 'reg-detective'
  const [step, setStep] = useState(() => (isNightOneRegistration ? "reg-sleep" : "sleep"));

  // Registration state for Natt 1 (Admin picking who opened eyes)
  const [registeredMafiaIds, setRegisteredMafiaIds] = useState([]);
  const [registeredDoctorId, setRegisteredDoctorId] = useState(null);
  const [registeredDetectiveId, setRegisteredDetectiveId] = useState(null);

  // Normal Night selections
  const [mafiaTargetId, setMafiaTargetId] = useState(null);
  const [doctorTargetId, setDoctorTargetId] = useState(null);
  const [detectiveTargetId, setDetectiveTargetId] = useState(null);

  // Projector-safe detective result
  const [isDetectiveResultRevealed, setIsDetectiveResultRevealed] = useState(false);

  useEffect(() => {
    playSound("nightChime", soundEnabled);
  }, []);

  const livingPlayers = players.filter((p) => p.alive);

  // Registered or active special roles
  const livingDoctor = players.find((p) => p.alive && p.role === ROLES.DOCTOR);
  const livingDetective = players.find((p) => p.alive && p.role === ROLES.DETECTIVE);

  function toggleRegisteredMafia(id) {
    setRegisteredMafiaIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  }

  function handleCompleteRegistration() {
    // Update all player roles: selected Mafia, Doctor, Detective, rest are Civilians
    const updatedPlayers = players.map((p) => {
      let assignedRole = ROLES.CIVILIAN;
      if (registeredMafiaIds.includes(p.id)) assignedRole = ROLES.MAFIA;
      else if (p.id === registeredDoctorId) assignedRole = ROLES.DOCTOR;
      else if (p.id === registeredDetectiveId) assignedRole = ROLES.DETECTIVE;

      return { ...p, role: assignedRole };
    });

    onRegisterRoles(updatedPlayers);
    setStep("mafia");
  }

  function handleNextStep() {
    setIsDetectiveResultRevealed(false);

    // Registration steps
    if (step === "reg-sleep") {
      setStep("reg-mafia");
    } else if (step === "reg-mafia") {
      if (roleDistribution?.doctor > 0) {
        setStep("reg-doctor");
      } else if (roleDistribution?.detective > 0) {
        setStep("reg-detective");
      } else {
        handleCompleteRegistration();
      }
    } else if (step === "reg-doctor") {
      if (roleDistribution?.detective > 0) {
        setStep("reg-detective");
      } else {
        handleCompleteRegistration();
      }
    } else if (step === "reg-detective") {
      handleCompleteRegistration();
    }
    // Standard night steps
    else if (step === "sleep") {
      setStep("mafia");
    } else if (step === "mafia") {
      if (!mafiaTargetId) return;
      if (livingDoctor) {
        setStep("doctor");
      } else if (livingDetective) {
        setStep("detective");
      } else {
        setStep("ready");
      }
    } else if (step === "doctor") {
      if (livingDetective) {
        setStep("detective");
      } else {
        setStep("ready");
      }
    } else if (step === "detective") {
      setStep("ready");
    }
  }

  function handleFinishNight() {
    onCompleteNight({
      mafiaTargetId,
      doctorTargetId: livingDoctor ? doctorTargetId : null,
      detectiveTargetId: livingDetective ? detectiveTargetId : null,
    });
  }

  return (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden animate-fade-in gap-3">
      {/* Top Banner */}
      <div className="relative shrink-0 overflow-hidden rounded-xl2 border border-indigo-900/60 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-6 py-2.5 text-white shadow-lg">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Moon size={22} />
            </div>
            <div>
              <span className="font-heading text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Nattfase — Runde {roundNumber} {isNightOneRegistration ? "(Rolle-registrering)" : ""}
              </span>
              <h2 className="font-heading text-lg font-bold text-white leading-tight">Byen har gått til ro</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-indigo-900/40 border border-indigo-700/50 px-3 py-1 font-heading text-xs font-semibold text-indigo-200">
            <Sparkles size={14} /> Spilleder-instruksjoner
          </div>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        {/* Registration Step 1: Soving */}
        {step === "reg-sleep" && (
          <div className="flex w-full flex-1 flex-col items-center justify-center rounded-xl2 border-2 border-indigo-900/40 bg-slate-900/95 p-8 text-center text-white shadow-xl animate-fade-slide-up">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <EyeOff size={48} />
            </div>

            <h3 className="font-heading text-3xl font-black text-indigo-100 mb-3">
              "Byen går til ro. Alle lukker øynene og gjør det helt stille."
            </h3>
            <p className="font-body text-base text-indigo-200/70 max-w-xl mb-8">
              Elevene har fått utdelt sine fysiske kort. Be alle lukke øynene før du ber Mafia, Lege og Detektiv åpne øynene for å registrere dem i appen.
            </p>

            <button
              type="button"
              onClick={handleNextStep}
              className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-indigo-600 px-10 py-4 font-heading text-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-indigo-500 active:scale-[0.98]"
            >
              Start registrering av Mafia →
            </button>
          </div>
        )}

        {/* Registration Step 2: Registrer Mafia */}
        {step === "reg-mafia" && (
          <div className="flex w-full flex-1 flex-col justify-between rounded-xl2 border-2 border-red-900/40 bg-slate-900/95 p-6 text-white shadow-xl animate-fade-slide-up">
            <div className="flex items-center gap-3 border-b border-red-900/30 pb-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                <VenetianMask size={24} />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-red-400">Registrer hvem som er Mafia</h3>
                <p className="font-body text-xs text-red-200/70">
                  Les opp: "Mafiaen/Varulvene våkner. Åpne øynene og gjør dere tilkjenne for hverandre."
                </p>
              </div>
            </div>

            <div className="my-auto py-2">
              <span className="font-heading text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider">
                Admin: Velg de {roleDistribution?.mafia ?? 2} elevene som åpner øynene som Mafia:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                {livingPlayers.map((player) => {
                  const isSelected = registeredMafiaIds.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => toggleRegisteredMafia(player.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 font-heading text-sm font-bold transition-all ${
                        isSelected
                          ? "border-red-500 bg-red-500/30 text-white shadow-md ring-2 ring-red-500/50"
                          : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-red-500/50 hover:bg-red-500/10"
                      }`}
                    >
                      <span className="truncate">{player.name}</span>
                      {isSelected && <Check size={18} className="text-red-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
              <span className="text-xs text-slate-400 italic">
                Les høyt: "Mafiaen lukker øynene og går tilbake til søvn."
              </span>
              <button
                type="button"
                disabled={registeredMafiaIds.length === 0}
                onClick={handleNextStep}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 font-heading text-base font-bold text-white shadow-md hover:bg-red-500 disabled:opacity-40"
              >
                Neste rolle →
              </button>
            </div>
          </div>
        )}

        {/* Registration Step 3: Registrer Lege */}
        {step === "reg-doctor" && (
          <div className="flex w-full flex-1 flex-col justify-between rounded-xl2 border-2 border-emerald-900/40 bg-slate-900/95 p-6 text-white shadow-xl animate-fade-slide-up">
            <div className="flex items-center gap-3 border-b border-emerald-900/30 pb-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-emerald-400">Registrer hvem som er Lege</h3>
                <p className="font-body text-xs text-emerald-200/70">
                  Les opp: "Legen våkner. Åpne øynene."
                </p>
              </div>
            </div>

            <div className="my-auto py-2">
              <span className="font-heading text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider">
                Admin: Velg eleven som åpner øynene som Lege:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                {livingPlayers.map((player) => {
                  const isSelected = registeredDoctorId === player.id;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setRegisteredDoctorId(player.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 font-heading text-sm font-bold transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/30 text-white shadow-md ring-2 ring-emerald-500/50"
                          : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                      }`}
                    >
                      <span className="truncate">{player.name}</span>
                      {isSelected && <Check size={18} className="text-emerald-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
              <span className="text-xs text-slate-400 italic">
                Les høyt: "Legen lukker øynene og går tilbake til søvn."
              </span>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 font-heading text-base font-bold text-white shadow-md hover:bg-emerald-500"
              >
                Neste rolle →
              </button>
            </div>
          </div>
        )}

        {/* Registration Step 4: Registrer Detektiv */}
        {step === "reg-detective" && (
          <div className="flex w-full flex-1 flex-col justify-between rounded-xl2 border-2 border-amber-900/40 bg-slate-900/95 p-6 text-white shadow-xl animate-fade-slide-up">
            <div className="flex items-center gap-3 border-b border-amber-900/30 pb-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Search size={24} />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-amber-400">Registrer hvem som er Detektiv</h3>
                <p className="font-body text-xs text-amber-200/70">
                  Les opp: "Detektiven våkner. Åpne øynene."
                </p>
              </div>
            </div>

            <div className="my-auto py-2">
              <span className="font-heading text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider">
                Admin: Velg eleven som åpner øynene som Detektiv:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                {livingPlayers.map((player) => {
                  const isSelected = registeredDetectiveId === player.id;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setRegisteredDetectiveId(player.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 font-heading text-sm font-bold transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/30 text-white shadow-md ring-2 ring-amber-500/50"
                          : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-amber-500/50 hover:bg-amber-500/10"
                      }`}
                    >
                      <span className="truncate">{player.name}</span>
                      {isSelected && <Check size={18} className="text-amber-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
              <span className="text-xs text-slate-400 italic">
                Les høyt: "Detektiven lukker øynene og går tilbake til søvn."
              </span>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 font-heading text-base font-bold text-white shadow-md hover:bg-amber-500"
              >
                Fullfør registrering →
              </button>
            </div>
          </div>
        )}

        {/* Standard Night Step 1: Soving */}
        {step === "sleep" && (
          <div className="flex w-full flex-1 flex-col items-center justify-center rounded-xl2 border-2 border-indigo-900/40 bg-slate-900/95 p-8 text-center text-white shadow-xl animate-fade-slide-up">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <EyeOff size={48} />
            </div>

            <h3 className="font-heading text-3xl font-black text-indigo-100 mb-3">
              "Byen går til ro. Alle lukker øynene og gjør det helt stille."
            </h3>
            <p className="font-body text-base text-indigo-200/70 max-w-xl mb-8">
              Les manuset høyt for klassen. Pass på at alle har øynene lukket og hodet nede før du fortsetter.
            </p>

            <button
              type="button"
              onClick={handleNextStep}
              className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-indigo-600 px-10 py-4 font-heading text-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-indigo-500 active:scale-[0.98]"
            >
              Start Mafiaens tur →
            </button>
          </div>
        )}

        {/* Standard Night Step 2: Mafiaens Tur */}
        {step === "mafia" && (
          <div className="flex w-full flex-1 flex-col justify-between rounded-xl2 border-2 border-red-900/40 bg-slate-900/95 p-6 text-white shadow-xl animate-fade-slide-up">
            <div className="flex items-center gap-3 border-b border-red-900/30 pb-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                <VenetianMask size={24} />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-red-400">Mafiaens tur</h3>
                <p className="font-body text-xs text-red-200/70">
                  Les opp: "Mafiaen/Varulvene våkner. Åpne øynene og gjør dere tilkjenne for hverandre. Pek lydløst på personen dere ønsker å eliminere i natt."
                </p>
              </div>
            </div>

            <div className="my-auto py-2">
              <span className="font-heading text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider">
                Registrer hvem Mafiaen peker på ({livingPlayers.length} levende):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                {livingPlayers.map((player) => {
                  const isSelected = mafiaTargetId === player.id;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setMafiaTargetId(player.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 font-heading text-sm font-bold transition-all ${
                        isSelected
                          ? "border-red-500 bg-red-500/30 text-white shadow-md ring-2 ring-red-500/50"
                          : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-red-500/50 hover:bg-red-500/10"
                      }`}
                    >
                      <span className="truncate">{player.name}</span>
                      {isSelected && <Check size={18} className="text-red-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
              <span className="text-xs text-slate-400 italic">
                Les høyt: "Mafiaen lukker øynene og går tilbake til søvn."
              </span>
              <button
                type="button"
                disabled={!mafiaTargetId}
                onClick={handleNextStep}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 font-heading text-base font-bold text-white shadow-md hover:bg-red-500 disabled:opacity-40"
              >
                Neste rolle →
              </button>
            </div>
          </div>
        )}

        {/* Standard Night Step 3: Legens Tur */}
        {step === "doctor" && (
          <div className="flex w-full flex-1 flex-col justify-between rounded-xl2 border-2 border-emerald-900/40 bg-slate-900/95 p-6 text-white shadow-xl animate-fade-slide-up">
            <div className="flex items-center gap-3 border-b border-emerald-900/30 pb-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-emerald-400">Legens tur</h3>
                <p className="font-body text-xs text-emerald-200/70">
                  Les opp: "Legen våkner. Åpne øynene. Pek på personen du ønsker å beskytte i natt."
                </p>
              </div>
            </div>

            <div className="my-auto py-2">
              <span className="font-heading text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider">
                Registrer hvem Legen beskytter ({livingPlayers.length} levende):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                {livingPlayers.map((player) => {
                  const isSelected = doctorTargetId === player.id;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => setDoctorTargetId(player.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 font-heading text-sm font-bold transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/30 text-white shadow-md ring-2 ring-emerald-500/50"
                          : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                      }`}
                    >
                      <span className="truncate">{player.name}</span>
                      {isSelected && <Check size={18} className="text-emerald-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
              <span className="text-xs text-slate-400 italic">
                Les høyt: "Legen lukker øynene og går tilbake til søvn."
              </span>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 font-heading text-base font-bold text-white shadow-md hover:bg-emerald-500"
              >
                Neste rolle →
              </button>
            </div>
          </div>
        )}

        {/* Standard Night Step 4: Detektivens Tur */}
        {step === "detective" && (
          <div className="flex w-full flex-1 flex-col justify-between rounded-xl2 border-2 border-amber-900/40 bg-slate-900/95 p-6 text-white shadow-xl animate-fade-slide-up">
            <div className="flex items-center gap-3 border-b border-amber-900/30 pb-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Search size={24} />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-amber-400">Detektivens tur</h3>
                <p className="font-body text-xs text-amber-200/70">
                  Les opp: "Detektiven våkner. Åpne øynene. Pek på personen du ønsker å undersøke."
                </p>
              </div>
            </div>

            <div className="my-auto py-2">
              <span className="font-heading text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider">
                Velg hvem Detektiven undersøker ({livingPlayers.length} levende):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5">
                {livingPlayers.map((player) => {
                  const isSelected = detectiveTargetId === player.id;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => {
                        setDetectiveTargetId(player.id);
                        setIsDetectiveResultRevealed(false);
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 font-heading text-sm font-bold transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/30 text-white shadow-md ring-2 ring-amber-500/50"
                          : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-amber-500/50 hover:bg-amber-500/10"
                      }`}
                    >
                      <span className="truncate">{player.name}</span>
                      {isSelected && <Check size={18} className="text-amber-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Detective Feedback Output */}
              {detectiveTargetId && (() => {
                const targetPlayer = players.find((p) => p.id === detectiveTargetId);
                const isMafia = targetPlayer?.role === ROLES.MAFIA;

                return (
                  <div className="mt-4 flex flex-col items-center justify-center">
                    {!isDetectiveResultRevealed ? (
                      <button
                        type="button"
                        onClick={() => setIsDetectiveResultRevealed(true)}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/20 px-6 py-3 font-heading text-sm font-bold text-amber-300 shadow-md hover:bg-amber-500/30 animate-pop-in"
                      >
                        <Eye size={18} /> Vis resultat for Detektiven (Skjult for klassen)
                      </button>
                    ) : (
                      <div
                        className={`flex flex-col items-center rounded-2xl border px-8 py-3 text-center animate-pop-in ${
                          isMafia
                            ? "border-red-500/50 bg-red-500/25 text-red-100"
                            : "border-emerald-500/50 bg-emerald-500/25 text-emerald-100"
                        }`}
                      >
                        <span className="font-heading text-xs font-semibold uppercase tracking-wider text-slate-200 mb-0.5">
                          Undersøkelse for {targetPlayer?.name}:
                        </span>
                        <span className="font-heading text-2xl font-black mb-0.5">
                          {isMafia ? "😈 Ond (Mafia)" : "😇 God (Sivil)"}
                        </span>
                        <p className="font-body text-xs text-slate-200">
                          {isMafia
                            ? "👉 Gi detektiven et nikke-tegn (ja, det er mafia)."
                            : "👉 Gi detektiven et riste-på-hodet tegn (nei, ikke mafia)."}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsDetectiveResultRevealed(false)}
                          className="mt-2 text-xs font-semibold text-slate-300 underline cursor-pointer hover:text-white"
                        >
                          Skjul resultat igjen
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
              <span className="text-xs text-slate-400 italic">
                Les høyt: "Detektiven lukker øynene og går tilbake til søvn."
              </span>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 font-heading text-base font-bold text-white shadow-md hover:bg-amber-500"
              >
                Fullfør natten →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Ready */}
        {step === "ready" && (
          <div className="flex w-full flex-1 flex-col items-center justify-center rounded-xl2 border-2 border-indigo-900/40 bg-slate-900/95 p-8 text-center text-white shadow-xl animate-fade-slide-up">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles size={48} />
            </div>

            <h3 className="font-heading text-3xl font-black text-indigo-100 mb-3">
              Nattens hendelser er registrert!
            </h3>
            <p className="font-body text-base text-indigo-200/70 max-w-xl mb-8">
              Gjør klar klassen før solen står opp og resultatene avsløres.
            </p>

            <button
              type="button"
              onClick={handleFinishNight}
              className="flex cursor-pointer items-center gap-2 rounded-xl2 bg-amber-500 px-10 py-4 font-heading text-xl font-bold text-slate-950 shadow-lg transition-transform hover:scale-[1.02] hover:bg-amber-400 active:scale-[0.98]"
            >
              Våkn opp til Dag {roundNumber} ☀️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MafiaNight;
