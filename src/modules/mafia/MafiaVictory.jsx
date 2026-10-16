import { useEffect } from "react";
import { Trophy, VenetianMask, Shield, Search, User, RotateCcw, Sparkles, ScrollText } from "lucide-react";
import { ROLE_DETAILS, ROLES } from "../../lib/mafia";
import { playSound } from "../../lib/sound";
import { useAppStore } from "../../store/useAppStore";

function MafiaVictory({ winner, players, roundNumber, gameLog, onRestartSamePlayers, onNewSetup }) {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  useEffect(() => {
    if (winner === "civilians") {
      playSound("tada", soundEnabled);
    } else {
      playSound("elimination", soundEnabled);
    }
  }, [winner, soundEnabled]);

  const roleIcons = {
    [ROLES.MAFIA]: VenetianMask,
    [ROLES.DOCTOR]: Shield,
    [ROLES.DETECTIVE]: Search,
    [ROLES.CIVILIAN]: User,
  };

  const isCivilians = winner === "civilians";

  return (
    <div className="flex h-[calc(100vh-140px)] w-full flex-col justify-between overflow-hidden animate-fade-in gap-4">
      {/* Banner */}
      <div
        className={`relative overflow-hidden rounded-xl2 border-2 p-6 text-center text-white shadow-2xl ${
          isCivilians
            ? "border-emerald-500/50 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700"
            : "border-red-500/50 bg-gradient-to-r from-red-950 via-slate-900 to-red-900"
        }`}
      >
        <div className="absolute top-2 right-4 opacity-15">
          <Trophy size={100} />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white border border-white/30 shadow-lg animate-pop-in">
            {isCivilians ? <Trophy size={36} /> : <VenetianMask size={36} />}
          </div>

          <span className="font-heading text-xs font-bold uppercase tracking-wider text-white/80 mb-1">
            Spillet er over — Runde {roundNumber}
          </span>

          <h2 className="font-heading text-2xl font-black mb-2">
            {isCivilians
              ? "De sivile har eliminert all mafia! Byen er trygg, og de godhjertede vinner! 🎉"
              : "Mafiaen har overtatt flertallet i byen. Ondskapen har seiret! 🐺"}
          </h2>

          <p className="font-body text-xs text-white/80 max-w-xl">
            {isCivilians
              ? "Godt samarbeid og god detektivvirksomhet berget byen fra mafiaens klør."
              : "Mafiaen klarte å manipulere og holde seg skjult gjennom natt og dag."}
          </p>
        </div>
      </div>

      {/* Role Breakdown Grid */}
      <div className="flex-1 rounded-xl2 border-2 border-ink/10 bg-surface p-5 shadow-clay overflow-hidden flex flex-col">
        <h3 className="font-heading text-lg font-bold text-ink border-b border-ink/10 pb-2 mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          Rolleoversikt for alle spillere
        </h3>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 max-h-[300px] overflow-y-auto pr-1 my-auto">
          {players.map((p) => {
            const roleInfo = ROLE_DETAILS[p.role] || ROLE_DETAILS[ROLES.CIVILIAN];
            const IconComp = roleIcons[p.role] || User;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                  p.alive
                    ? "border-ink/10 bg-canvas"
                    : "border-ink/5 bg-ink/5 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${roleInfo.badgeClass}`}
                  >
                    <IconComp size={16} />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-ink text-sm block">
                      {p.name}
                    </span>
                    <span className="font-body text-xs text-ink/60">
                      {p.alive ? "Overlevde" : "Eliminert"}
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded-lg px-2 py-0.5 font-heading text-xs font-bold ${roleInfo.badgeClass}`}
                >
                  {roleInfo.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restart Options */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={onRestartSamePlayers}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary px-8 py-3.5 font-heading text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <RotateCcw size={18} /> Spill på nytt med samme spillere
        </button>

        <button
          type="button"
          onClick={onNewSetup}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl2 border-2 border-ink/10 bg-surface px-8 py-3.5 font-heading text-base font-bold text-ink shadow-clay transition-transform hover:bg-ink/5"
        >
          Nytt oppsett og spillere
        </button>
      </div>
    </div>
  );
}

export default MafiaVictory;
