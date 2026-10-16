import { useEffect, useRef, useState } from "react";
import {
  Volume2,
  Plus,
  X,
  Play,
  Trophy,
  RotateCcw,
  Settings,
  MicOff,
  Timer,
  Flame,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { playSound } from "../../lib/sound";
import {
  ROUND_SECONDS,
  COUNTDOWN_STEPS,
  levelFromTimeDomainData,
  rankTeams,
} from "../../lib/noiseMeter";

function micErrorMessage(err) {
  if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
    return "Mikrofontilgang ble avslått. Gi appen tilgang til mikrofonen i systeminnstillingene og prøv igjen.";
  }
  if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
    return "Fant ingen mikrofon på denne enheten.";
  }
  return "Klarte ikke å starte mikrofonen. Prøv igjen.";
}

function NoiseMeterArena() {
  const noiseMeter = useAppStore((s) => s.noiseMeter);
  const addNoiseMeterTeam = useAppStore((s) => s.addNoiseMeterTeam);
  const removeNoiseMeterTeam = useAppStore((s) => s.removeNoiseMeterTeam);
  const setNoiseMeterScore = useAppStore((s) => s.setNoiseMeterScore);
  const resetNoiseMeterScores = useAppStore((s) => s.resetNoiseMeterScores);
  const resetNoiseMeterFull = useAppStore((s) => s.resetNoiseMeterFull);
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  // setup | mic-error | ready | countdown | measuring | result | scoreboard
  const [phase, setPhase] = useState("setup");
  const [teamNameInput, setTeamNameInput] = useState("");
  const [micError, setMicError] = useState(null);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [countdownStep, setCountdownStep] = useState(0);

  // Måle-tilstander
  const [liveMetrics, setLiveMetrics] = useState({ score: 0, db: 30, label: "Stille 🤫" });
  const [runningAvgDb, setRunningAvgDb] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState(ROUND_SECONDS);
  const [lastResult, setLastResult] = useState({ avgDb: 0, peakDb: 0, avgScore: 0 });

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafIdRef = useRef(null);

  const sumDbRef = useRef(0);
  const sumScoreRef = useRef(0);
  const countRef = useRef(0);
  const peakDbRef = useRef(0);

  const teams = noiseMeter.teams;
  const currentTeam = teams[currentTeamIndex] ?? null;

  function teardownAudio() {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  }

  useEffect(() => teardownAudio, []);

  async function startCompetition() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      streamRef.current = stream;
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.fftSize);

      setCurrentTeamIndex(0);
      setPhase("ready");
    } catch (err) {
      setMicError(micErrorMessage(err));
      setPhase("mic-error");
    }
  }

  function beginCountdown() {
    setCountdownStep(0);
    setPhase("countdown");
  }

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdownStep >= COUNTDOWN_STEPS.length) {
      beginMeasuring();
      return;
    }
    playSound("tick", soundEnabled);
    const id = setTimeout(
      () => setCountdownStep((n) => n + 1),
      COUNTDOWN_STEPS[countdownStep].durationMs
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdownStep]);

  function beginMeasuring() {
    sumDbRef.current = 0;
    sumScoreRef.current = 0;
    countRef.current = 0;
    peakDbRef.current = 0;
    setLiveMetrics({ score: 0, db: 30, label: "Stille 🤫" });
    setRunningAvgDb(30);
    setRemainingSeconds(ROUND_SECONDS);
    setPhase("measuring");

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const startedAt = performance.now();

    function tick(now) {
      if (!analyser || !dataArray) return;
      analyser.getByteTimeDomainData(dataArray);
      const metrics = levelFromTimeDomainData(dataArray);

      sumDbRef.current += metrics.db;
      sumScoreRef.current += metrics.score;
      countRef.current += 1;
      if (metrics.db > peakDbRef.current) {
        peakDbRef.current = metrics.db;
      }

      const elapsedMs = now - startedAt;
      const totalMs = ROUND_SECONDS * 1000;
      const secondsLeft = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));
      setRemainingSeconds(secondsLeft);

      const currentAvgDb = Math.round(sumDbRef.current / countRef.current);
      setRunningAvgDb(currentAvgDb);
      setLiveMetrics(metrics);

      if (elapsedMs < totalMs) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        finishMeasuring();
      }
    }
    rafIdRef.current = requestAnimationFrame(tick);
  }

  function finishMeasuring() {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;

    const count = countRef.current || 1;
    const avgDb = Math.round(sumDbRef.current / count);
    const avgScore = Math.round(sumScoreRef.current / count);
    const peakDb = peakDbRef.current || avgDb;

    const result = { avgDb, peakDb, avgScore };
    setNoiseMeterScore(currentTeam.id, result);
    setLastResult(result);
    playSound("tada", soundEnabled);
    setPhase("result");
  }

  function goToNextTeam() {
    const nextIndex = currentTeamIndex + 1;
    if (nextIndex < teams.length) {
      setCurrentTeamIndex(nextIndex);
      setPhase("ready");
    } else {
      setPhase("scoreboard");
    }
  }

  function playAgain() {
    resetNoiseMeterScores();
    setCurrentTeamIndex(0);
    setPhase("ready");
  }

  function backToSetup() {
    teardownAudio();
    setPhase("setup");
  }

  function newSetup() {
    teardownAudio();
    resetNoiseMeterFull();
    setPhase("setup");
  }

  function handleAddTeam(e) {
    e.preventDefault();
    addNoiseMeterTeam(teamNameInput);
    setTeamNameInput("");
  }

  const ranked = phase === "scoreboard" ? rankTeams(teams, noiseMeter.scores) : [];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold text-ink">
          <Volume2 size={26} aria-hidden="true" className="text-primary" />
          Støymeter
        </h2>
        {["ready", "countdown", "measuring", "result"].includes(phase) && (
          <button
            type="button"
            onClick={backToSetup}
            className="font-body text-sm text-ink/50 underline decoration-dotted hover:text-ink"
          >
            Avbryt konkurranse
          </button>
        )}
      </div>

      {phase === "setup" && (
        <SetupScreen
          teams={teams}
          teamNameInput={teamNameInput}
          setTeamNameInput={setTeamNameInput}
          onAddTeam={handleAddTeam}
          onRemoveTeam={removeNoiseMeterTeam}
          onStart={startCompetition}
        />
      )}

      {phase === "mic-error" && (
        <div className="flex w-full flex-col items-center gap-5 rounded-xl2 border-2 border-destructive/30 bg-destructive/5 p-8 text-center shadow-clay">
          <MicOff size={40} aria-hidden="true" className="text-destructive" />
          <p className="font-body text-base text-ink">{micError}</p>
          <button
            type="button"
            onClick={startCompetition}
            className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
          >
            Prøv igjen
          </button>
          <button
            type="button"
            onClick={() => setPhase("setup")}
            className="font-body text-sm text-ink/50 underline decoration-dotted hover:text-ink"
          >
            Tilbake til lagoppsett
          </button>
        </div>
      )}

      {phase === "ready" && currentTeam && (
        <div className="flex w-full flex-col items-center gap-6 rounded-xl2 border-2 border-ink/10 bg-surface p-10 text-center shadow-clay">
          <p className="font-body text-base text-ink/70">Neste lag</p>
          <p className="font-heading text-4xl font-bold text-ink">{currentTeam.name}</p>
          <button
            type="button"
            onClick={beginCountdown}
            className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary px-8 py-4 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
          >
            <Play size={22} aria-hidden="true" />
            Klar? Start!
          </button>
        </div>
      )}

      {phase === "countdown" && currentTeam && (
        <div className="flex w-full flex-col items-center gap-6 rounded-xl2 border-2 border-ink/10 bg-surface p-10 text-center shadow-clay">
          <p className="font-body text-lg text-ink/70">{currentTeam.name}</p>
          <p
            key={countdownStep}
            className={`animate-pop-in font-heading font-bold ${
              countdownStep === COUNTDOWN_STEPS.length - 1
                ? "text-7xl text-destructive"
                : "text-6xl text-ink"
            }`}
          >
            {COUNTDOWN_STEPS[countdownStep]?.label}
          </p>
        </div>
      )}

      {phase === "measuring" && currentTeam && (
        <div className="flex w-full flex-col items-center gap-6 rounded-xl2 border-2 border-destructive/40 bg-destructive/5 p-8 shadow-clay">
          {/* Header & 6-sekunders nedtellingsklokke */}
          <div className="flex w-full items-center justify-between">
            <div>
              <p className="font-heading text-2xl font-bold text-ink">{currentTeam.name}</p>
              <p className="font-body text-xs text-ink/60">Bråk løs! Måler snitt-støy i 6 sekunder</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl2 bg-destructive/15 px-4 py-2 text-destructive border-2 border-destructive/30 animate-pulse">
              <Timer size={24} />
              <span className="font-heading text-2xl font-bold">{remainingSeconds}s</span>
            </div>
          </div>

          {/* Visuell lydmåler / nivålinje */}
          <div className="h-14 w-full overflow-hidden rounded-xl2 border-2 border-ink/10 bg-ink/5 relative">
            <div
              className="h-full rounded-xl2 bg-gradient-to-r from-primary via-accent-gold to-destructive transition-[width] duration-75 ease-out"
              style={{ width: `${liveMetrics.score}%` }}
            />
          </div>

          {/* Sanntids dB-tall & statusbeskrivelse */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-6xl font-extrabold text-destructive">{liveMetrics.db}</span>
              <span className="font-heading text-2xl font-bold text-destructive/80">dB</span>
            </div>
            <p className="font-body text-base font-semibold text-ink/80">{liveMetrics.label}</p>
          </div>

          {/* Underveis-statistikk */}
          <div className="grid w-full grid-cols-2 gap-4 rounded-xl2 bg-surface p-4 border-2 border-ink/10 text-center shadow-sm">
            <div>
              <p className="font-body text-xs text-ink/60 uppercase tracking-wider font-semibold">Snitt hittil (Vinnerkrav)</p>
              <p className="font-heading text-2xl font-bold text-primary">{runningAvgDb} dB</p>
            </div>
            <div>
              <p className="font-body text-xs text-ink/60 uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
                <Flame size={14} className="text-destructive" /> Maks-topp
              </p>
              <p className="font-heading text-2xl font-bold text-ink">{peakDbRef.current || liveMetrics.db} dB</p>
            </div>
          </div>
        </div>
      )}

      {phase === "result" && currentTeam && (
        <div className="flex w-full flex-col items-center gap-6 rounded-xl2 border-2 border-ink/10 bg-surface p-10 text-center shadow-clay animate-modal-in">
          <p className="font-body text-base font-medium text-ink/70">Resultat for {currentTeam.name}</p>

          <div className="flex flex-col items-center gap-1 rounded-xl2 bg-primary/10 border-2 border-primary/30 px-8 py-6 w-full">
            <p className="font-body text-xs uppercase tracking-wider font-bold text-primary">Gjennomsnittlig støynivå (Vinnermål)</p>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-6xl font-extrabold text-primary">{lastResult.avgDb}</span>
              <span className="font-heading text-3xl font-bold text-primary/80">dB</span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full rounded-xl2 border-2 border-ink/10 px-6 py-3 bg-ink/5 font-body">
            <span className="text-ink/70 text-sm font-medium">Høyeste enkeltnotering (Maks)</span>
            <span className="font-heading text-lg font-bold text-ink">{lastResult.peakDb} dB</span>
          </div>

          <button
            type="button"
            onClick={goToNextTeam}
            className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary px-8 py-4 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] w-full"
          >
            {currentTeamIndex + 1 < teams.length ? "Neste lag →" : "Se resultater 🏆"}
          </button>
        </div>
      )}

      {phase === "scoreboard" && (
        <div className="flex w-full flex-col items-center gap-5 rounded-xl2 border-2 border-ink/10 bg-surface p-8 shadow-clay animate-modal-in">
          <Trophy size={48} aria-hidden="true" className="text-accent-gold-ink" />
          <div className="text-center">
            <p className="font-heading text-2xl font-bold text-ink">Endelige resultater</p>
            <p className="font-body text-xs text-ink/60">Rangert etter gjennomsnittlig støynivå (dB) over 6 sekunder</p>
          </div>

          <div className="flex w-full flex-col gap-3">
            {ranked.map((team) => (
              <div
                key={team.id}
                className={`flex items-center justify-between rounded-xl2 border-2 px-5 py-4 ${
                  team.rank === 1
                    ? "border-accent-gold bg-accent-gold/20 shadow-sm"
                    : "border-ink/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-heading text-xl font-bold text-ink/40 w-6">#{team.rank}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-lg font-bold text-ink">{team.name}</span>
                      {team.rank === 1 && (
                        <Trophy size={20} aria-hidden="true" className="text-accent-gold-ink" />
                      )}
                    </div>
                    <span className="font-body text-xs text-ink/60">Maks-topp: {team.peakDb} dB</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-2xl font-extrabold text-primary">{team.avgDb}</span>
                    <span className="font-heading text-sm font-bold text-primary/80">dB</span>
                  </div>
                  <span className="font-body text-[10px] uppercase font-bold text-primary/70">Snitt-støy</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={playAgain}
              className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary px-6 py-3 font-heading text-lg font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97]"
            >
              <RotateCcw size={20} aria-hidden="true" />
              Spill igjen
            </button>
            <button
              type="button"
              onClick={newSetup}
              className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 border-2 border-ink/10 px-6 py-3 font-heading text-lg font-semibold text-ink transition-colors hover:bg-ink/5"
            >
              <Settings size={20} aria-hidden="true" />
              Nytt lagoppsett
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SetupScreen({ teams, teamNameInput, setTeamNameInput, onAddTeam, onRemoveTeam, onStart }) {
  const canStart = teams.length >= 2;

  return (
    <div className="flex w-full flex-col gap-6 rounded-xl2 border-2 border-ink/10 bg-surface p-6 shadow-clay">
      <div>
        <p className="mb-2 font-heading text-base font-semibold text-ink">Lag</p>
        <form onSubmit={onAddTeam} className="flex gap-2">
          <input
            type="text"
            value={teamNameInput}
            onChange={(e) => setTeamNameInput(e.target.value)}
            placeholder="Navn på lag"
            autoComplete="off"
            aria-label="Navn på lag"
            className="min-h-touch flex-1 rounded-xl2 border-2 border-ink/10 bg-surface px-4 py-2 font-body text-base text-ink"
          />
          <button
            type="submit"
            disabled={!teamNameInput.trim()}
            className="flex min-h-touch cursor-pointer items-center justify-center gap-1 rounded-xl2 bg-primary px-4 py-2 font-heading font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={20} aria-hidden="true" />
            Legg til
          </button>
        </form>
      </div>

      {teams.length > 0 && (
        <div className="flex flex-col gap-2">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between rounded-xl2 border-2 border-ink/10 px-4 py-2"
            >
              <span className="font-body text-base text-ink">{team.name}</span>
              <button
                type="button"
                onClick={() => onRemoveTeam(team.id)}
                aria-label={`Fjern ${team.name}`}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={!canStart}
        className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl2 bg-primary px-8 py-4 font-heading text-xl font-semibold text-white transition-all duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start konkurranse
      </button>
      {!canStart && (
        <p className="text-center font-body text-sm text-ink/50">
          Legg til minst 2 lag for å starte.
        </p>
      )}
    </div>
  );
}

export default NoiseMeterArena;
