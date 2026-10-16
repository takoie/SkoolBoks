import { useState } from "react";
import { VenetianMask, ScrollText, ArrowLeft } from "lucide-react";
import { checkVictoryCondition, assignRoles, ROLE_DETAILS } from "../../lib/mafia";
import { useAppStore } from "../../store/useAppStore";
import MafiaSetup from "./MafiaSetup";
import MafiaNight from "./MafiaNight";
import MafiaDay from "./MafiaDay";
import MafiaVictory from "./MafiaVictory";
import MafiaGamemasterModal from "./MafiaGamemasterModal";

function MafiaArena() {
  const mafiaSession = useAppStore((s) => s.mafiaSession);
  const setMafiaSession = useAppStore((s) => s.setMafiaSession);
  const resetMafiaSession = useAppStore((s) => s.resetMafiaSession);

  const { gameState, players, roundNumber, gameConfig, nightResult, gameLog, winner } = mafiaSession;

  const [isGamemasterOpen, setIsGamemasterOpen] = useState(false);

  function handleStartGame({
    players: assignedPlayers,
    roleDistribution,
    discussionMinutes,
    revealRoleOnDeath,
    isNightOneRegistration,
  }) {
    setMafiaSession({
      gameState: "night",
      players: assignedPlayers,
      roundNumber: 1,
      gameConfig: {
        discussionMinutes,
        revealRoleOnDeath,
        roleDistribution,
        isNightOneRegistration,
      },
      nightResult: null,
      winner: null,
      gameLog: [
        {
          title: "Spill startet",
          description: `Spillet startet med ${assignedPlayers.length} spillere. Rollefordeling: ${roleDistribution.mafia} Mafia, ${roleDistribution.doctor} Lege, ${roleDistribution.detective} Detektiv, ${roleDistribution.civilian} Sivile.`,
        },
      ],
    });
  }

  function handleRegisterRoles(updatedPlayers) {
    setMafiaSession({
      players: updatedPlayers,
      gameConfig: {
        ...gameConfig,
        isNightOneRegistration: false,
      },
    });
  }

  function handleCompleteNight({ mafiaTargetId, doctorTargetId, detectiveTargetId }) {
    const targetPlayer = players.find((p) => p.id === mafiaTargetId);
    const doctorPlayer = players.find((p) => p.id === doctorTargetId);
    const isSaved = mafiaTargetId && mafiaTargetId === doctorTargetId;

    let killedPlayer = null;
    let updatedPlayers = [...players];

    if (!isSaved && targetPlayer) {
      killedPlayer = targetPlayer;
      updatedPlayers = updatedPlayers.map((p) =>
        p.id === targetPlayer.id ? { ...p, alive: false } : p
      );
    }

    const nightLogDesc = isSaved
      ? `Mafiaen angrep ${targetPlayer?.name}, men Legen (${doctorPlayer?.name}) reddet offeret!`
      : targetPlayer
      ? `Mafiaen angrep og eliminerte ${targetPlayer.name}.`
      : "Ingen ble angrepet i natt.";

    const newLog = [
      { title: `Natt ${roundNumber}`, description: nightLogDesc },
      ...(gameLog || []),
    ];

    const winCheck = checkVictoryCondition(updatedPlayers);

    setMafiaSession({
      players: updatedPlayers,
      nightResult: { killedPlayer, isSavedByDoctor: isSaved },
      gameLog: newLog,
      winner: winCheck,
      gameState: winCheck ? "victory" : "day",
    });
  }

  function handleEliminatePlayer(eliminatedId) {
    const eliminated = players.find((p) => p.id === eliminatedId);
    if (!eliminated) return;

    const updatedPlayers = players.map((p) =>
      p.id === eliminatedId ? { ...p, alive: false } : p
    );

    const logMsg = gameConfig.revealRoleOnDeath
      ? `${eliminated.name} ble stemt ut i avstemningen. Rollen var ${ROLE_DETAILS[eliminated.role]?.name}.`
      : `${eliminated.name} ble stemt ut i avstemningen.`;

    const newLog = [
      { title: `Dag ${roundNumber}`, description: logMsg },
      ...(gameLog || []),
    ];

    const winCheck = checkVictoryCondition(updatedPlayers);

    setMafiaSession({
      players: updatedPlayers,
      gameLog: newLog,
      winner: winCheck,
      gameState: winCheck ? "victory" : "night",
      roundNumber: winCheck ? roundNumber : roundNumber + 1,
    });
  }

  function handleProceedNoElimination() {
    const newLog = [
      { title: `Dag ${roundNumber}`, description: "Det ble uavgjort. Ingen røk ut i dagens avstemning." },
      ...(gameLog || []),
    ];

    setMafiaSession({
      gameLog: newLog,
      gameState: "night",
      roundNumber: roundNumber + 1,
    });
  }

  function handleRestartSamePlayers() {
    const newDeck = assignRoles(
      players.map((p) => ({ id: p.id, name: p.name })),
      gameConfig.roleDistribution
    );

    setMafiaSession({
      players: newDeck,
      roundNumber: 1,
      winner: null,
      nightResult: null,
      gameState: "night",
      gameLog: [
        {
          title: "Ny omgang startet",
          description: "Spillet ble startet på nytt med samme spillere.",
        },
      ],
    });
  }

  function handleNewSetup() {
    resetMafiaSession();
  }

  return (
    <div className="flex h-full w-full flex-col gap-3">
      {/* Header bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <VenetianMask size={24} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-ink">Mafia</h1>
            <p className="font-body text-xs text-ink/70">
              Gruppespillet om hemmelige roller, nattlige aksjoner og livlige diskusjoner.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameState !== "setup" && (
            <>
              <button
                type="button"
                onClick={() => setIsGamemasterOpen(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl2 border-2 border-primary/30 bg-primary/10 px-4 py-2 font-heading font-semibold text-primary hover:bg-primary/20"
              >
                <ScrollText size={18} /> Spilleder-oversikt
              </button>

              <button
                type="button"
                onClick={handleNewSetup}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-heading font-semibold text-ink hover:bg-ink/5"
              >
                <ArrowLeft size={18} /> Avslutt / Nytt oppsett
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main View Router */}
      <div className="flex-1 overflow-hidden">
        {gameState === "setup" && (
          <MafiaSetup
            onStartGame={handleStartGame}
            savedConfig={{
              players,
              discussionMinutes: gameConfig.discussionMinutes,
              revealRoleOnDeath: gameConfig.revealRoleOnDeath,
              roleDistribution: gameConfig.roleDistribution,
            }}
          />
        )}

        {gameState === "night" && (
          <MafiaNight
            players={players}
            roundNumber={roundNumber}
            isNightOneRegistration={gameConfig.isNightOneRegistration}
            roleDistribution={gameConfig.roleDistribution}
            onCompleteNight={handleCompleteNight}
            onRegisterRoles={handleRegisterRoles}
          />
        )}

        {gameState === "day" && (
          <MafiaDay
            players={players}
            roundNumber={roundNumber}
            nightResult={nightResult}
            discussionMinutes={gameConfig.discussionMinutes}
            revealRoleOnDeath={gameConfig.revealRoleOnDeath}
            onEliminatePlayer={handleEliminatePlayer}
            onProceedNoElimination={handleProceedNoElimination}
          />
        )}

        {gameState === "victory" && (
          <MafiaVictory
            winner={winner}
            players={players}
            roundNumber={roundNumber}
            gameLog={gameLog}
            onRestartSamePlayers={handleRestartSamePlayers}
            onNewSetup={handleNewSetup}
          />
        )}
      </div>

      {/* Gamemaster Cheat Sheet Modal */}
      <MafiaGamemasterModal
        isOpen={isGamemasterOpen}
        onClose={() => setIsGamemasterOpen(false)}
        players={players}
        gameLog={gameLog}
        roundNumber={roundNumber}
      />
    </div>
  );
}

export default MafiaArena;
