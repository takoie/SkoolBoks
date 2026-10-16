import { useState } from "react";
import { X, Eye, EyeOff, Shield, Search, VenetianMask, User, ScrollText, AlertCircle } from "lucide-react";
import { ROLE_DETAILS, ROLES } from "../../lib/mafia";

function MafiaGamemasterModal({ isOpen, onClose, players, gameLog, roundNumber }) {
  const [showRoles, setShowRoles] = useState(false);

  if (!isOpen) return null;

  const roleIcons = {
    [ROLES.MAFIA]: VenetianMask,
    [ROLES.DOCTOR]: Shield,
    [ROLES.DETECTIVE]: Search,
    [ROLES.CIVILIAN]: User,
  };

  const livingPlayers = players.filter((p) => p.alive);
  const deadPlayers = players.filter((p) => !p.alive);

  const livingMafia = livingPlayers.filter((p) => p.role === ROLES.MAFIA).length;
  const livingCivilians = livingPlayers.filter((p) => p.role !== ROLES.MAFIA).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl2 border-2 border-ink/20 bg-surface p-6 shadow-2xl animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ScrollText size={22} />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-ink">Spillederens jukselapp</h3>
              <p className="font-body text-xs text-ink/70">
                Hemmelig oversikt for læreren/spillederen — Runde {roundNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-ink/10 text-ink/70 hover:bg-ink/5 hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status bar */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center">
            <span className="block font-heading text-xs font-semibold text-red-600 dark:text-red-400">
              Levende Mafia
            </span>
            <span className="font-heading text-2xl font-bold text-red-700 dark:text-red-300">
              {livingMafia}
            </span>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-center">
            <span className="block font-heading text-xs font-semibold text-blue-600 dark:text-blue-400">
              Levende Sivile
            </span>
            <span className="font-heading text-2xl font-bold text-blue-700 dark:text-blue-300">
              {livingCivilians}
            </span>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
            <span className="block font-heading text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Totalt i live
            </span>
            <span className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {livingPlayers.length}
            </span>
          </div>
          <div className="rounded-xl border border-ink/10 bg-ink/5 p-3 text-center">
            <span className="block font-heading text-xs font-semibold text-ink/70">
              Eliminert
            </span>
            <span className="font-heading text-2xl font-bold text-ink">
              {deadPlayers.length}
            </span>
          </div>
        </div>

        {/* Toggle secret role visibility */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-ink/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink/80">
            <AlertCircle size={16} className="text-amber-500" />
            Skjul roller om elever ser på skjermen.
          </div>
          <button
            type="button"
            onClick={() => setShowRoles((v) => !v)}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink/10 bg-surface px-3 py-1.5 font-heading text-xs font-bold text-ink shadow-xs hover:bg-ink/5"
          >
            {showRoles ? (
              <>
                <EyeOff size={16} /> Skjul roller
              </>
            ) : (
              <>
                <Eye size={16} /> Vis roller
              </>
            )}
          </button>
        </div>

        {/* Content scroll area */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <h4 className="font-heading text-sm font-bold text-ink mb-2">Spillere ({players.length})</h4>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => {
              const roleInfo = ROLE_DETAILS[p.role] || ROLE_DETAILS[ROLES.CIVILIAN];
              const IconComp = roleIcons[p.role] || User;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-opacity ${
                    p.alive
                      ? "border-ink/10 bg-surface"
                      : "border-ink/5 bg-ink/5 opacity-60 line-through"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        p.alive ? roleInfo.badgeClass : "bg-ink/10 text-ink/40"
                      }`}
                    >
                      <IconComp size={16} />
                    </div>
                    <div>
                      <span className="font-heading text-sm font-semibold text-ink">
                        {p.name}
                      </span>
                      {!p.alive && (
                        <span className="ml-2 text-xs text-red-500 font-semibold">(Ute)</span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`rounded-md px-2 py-1 font-heading text-xs font-bold ${
                      showRoles
                        ? roleInfo.badgeClass
                        : "bg-ink/10 text-ink/40"
                    }`}
                  >
                    {showRoles ? roleInfo.name : "••••••"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Event History log */}
          {gameLog && gameLog.length > 0 && (
            <div className="mt-6">
              <h4 className="font-heading text-sm font-bold text-ink mb-2">Hendelseslogg</h4>
              <div className="flex flex-col gap-2 rounded-xl border border-ink/10 bg-ink/5 p-3 text-xs">
                {gameLog.map((log, idx) => (
                  <div key={idx} className="border-b border-ink/5 pb-1 last:border-0 last:pb-0">
                    <span className="font-bold text-primary">{log.title}:</span>{" "}
                    <span className="text-ink/80">{log.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-ink/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-ink/10 bg-surface px-5 py-2 font-heading font-semibold text-ink shadow-xs hover:bg-ink/5"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
}

export default MafiaGamemasterModal;
