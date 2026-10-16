import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Volume2,
  VolumeX,
  Edit3,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  PartyPopper,
  User,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { playSound } from "../../lib/sound";
import { fireConfetti } from "../../lib/confetti";
import { getActivity } from "./oktConstants";

export default function OktRunner({ title, intervals, onBackToBuilder }) {
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [soundActive, setSoundActive] = useState(soundEnabled);
  const [showShiftBanner, setShowShiftBanner] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentInterval = intervals[currentIndex] || intervals[0];
  const nextInterval = intervals[currentIndex + 1] || null;

  function getIntervalDurationSeconds(interval) {
    if (!interval) return 0;
    return (Number(interval.minutes) || 0) * 60 + (Number(interval.seconds) || 0);
  }

  const [timeLeft, setTimeLeft] = useState(() =>
    getIntervalDurationSeconds(currentInterval)
  );

  const timerRef = useRef(null);

  // Sync timeLeft when current index changes
  useEffect(() => {
    if (currentInterval) {
      setTimeLeft(getIntervalDurationSeconds(currentInterval));
    }
  }, [currentIndex]);

  // Main countdown effect
  useEffect(() => {
    if (isRunning && !isCompleted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleIntervalComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, currentIndex, isCompleted]);

  function handleIntervalComplete() {
    playSound("ding", soundActive);

    if (currentIndex + 1 < intervals.length) {
      // Trigger visual banner flash for interval shift
      setShowShiftBanner(true);
      setTimeout(() => setShowShiftBanner(false), 3000);

      setCurrentIndex((prev) => prev + 1);
      setIsRunning(true);
    } else {
      // Whole session completed!
      setIsCompleted(true);
      setIsRunning(false);
      playSound("tada", soundActive);
      fireConfetti();
    }
  }

  function handleTogglePlay() {
    if (isCompleted) {
      // Restart whole session
      setIsCompleted(false);
      setCurrentIndex(0);
      setTimeLeft(getIntervalDurationSeconds(intervals[0]));
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  }

  function handleSkip() {
    if (currentIndex + 1 < intervals.length) {
      setShowShiftBanner(true);
      setTimeout(() => setShowShiftBanner(false), 2000);
      setCurrentIndex((prev) => prev + 1);
      setIsRunning(true);
    } else {
      setIsCompleted(true);
      setIsRunning(false);
      fireConfetti();
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsCompleted(false);
      setIsRunning(false);
    } else {
      setTimeLeft(getIntervalDurationSeconds(intervals[0]));
    }
  }

  function handleReset() {
    setIsRunning(false);
    setIsCompleted(false);
    setCurrentIndex(0);
    setTimeLeft(getIntervalDurationSeconds(intervals[0]));
  }

  // Format MM:SS
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedTime = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const currentAct = getActivity(currentInterval?.activityId);
  const CurrentIcon = currentAct.icon;

  const totalSecsForCurrent = getIntervalDurationSeconds(currentInterval);
  const progressPercent =
    totalSecsForCurrent > 0
      ? Math.round(((totalSecsForCurrent - timeLeft) / totalSecsForCurrent) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl2 border border-ink/10 bg-surface p-4 sm:px-6 shadow-clay">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${currentAct.lightBg} ${currentAct.textClass}`}>
            <CurrentIcon size={22} />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">
              {title || "Aktiv økt"}
            </h2>
            <p className="font-body text-xs text-ink-muted">
              Intervall {currentIndex + 1} av {intervals.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundActive((prev) => !prev)}
            title={soundActive ? "Slå av lydeffekt" : "Slå på lydeffekt"}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-ink/10 bg-surface text-ink-muted transition-colors hover:border-ink/20 hover:text-ink"
          >
            {soundActive ? <Volume2 size={18} className="text-primary" /> : <VolumeX size={18} />}
          </button>

          <button
            type="button"
            onClick={onBackToBuilder}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink/15 bg-surface px-4 py-2 font-heading font-semibold text-ink hover:bg-ink/5 transition-colors"
          >
            <Edit3 size={16} />
            Rediger økt
          </button>
        </div>
      </div>

      {/* Interval Shift Alert Banner */}
      {showShiftBanner && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 text-white shadow-xl">
          <Sparkles className="animate-bounce" size={24} />
          <span className="font-heading text-lg font-bold">
            Skifter til: {currentInterval.customTitle || currentAct.name}!
          </span>
        </div>
      )}

      {/* Main Countdown Display */}
      {isCompleted ? (
        <div className="flex flex-col items-center justify-center rounded-xl2 border border-emerald-500/30 bg-emerald-500/10 p-12 text-center shadow-xl animate-in zoom-in-95 duration-300">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white mb-4 shadow-lg">
            <PartyPopper size={40} />
          </div>
          <h2 className="font-heading text-3xl font-bold text-ink">
            Økten er fullført! 🎉
          </h2>
          <p className="font-body text-base text-ink-muted mt-2 max-w-md">
            Fantastisk innsats! Alle {intervals.length} aktivitetsintervaller er gjennomført.
          </p>

          <div className="flex items-center gap-4 mt-8">
            <button
              type="button"
              onClick={handleReset}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-surface border border-ink/15 px-6 py-3 font-heading font-bold text-ink shadow-sm hover:bg-ink/5 transition-colors"
            >
              <RotateCcw size={18} />
              Nullstill økt
            </button>
            <button
              type="button"
              onClick={onBackToBuilder}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 py-3 font-heading font-bold text-white shadow-clay hover:bg-primary-hover transition-colors"
            >
              <Edit3 size={18} />
              Tilbake til redigering
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Active Timer Card (Left 2 Columns) */}
          <div className="lg:col-span-2 flex flex-col justify-between rounded-xl2 border border-ink/10 bg-surface p-8 shadow-clay">
            {/* Active Activity Header Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${currentAct.bgClass} text-white shadow-md`}
                >
                  <CurrentIcon size={32} />
                </div>
                <div>
                  <span className="font-heading text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Nåværende aktivitet
                  </span>
                  <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink">
                    {currentInterval.customTitle || currentAct.name}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentInterval.assignedStudent && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 font-heading text-xs font-bold text-primary">
                    <User size={13} />
                    Ansvarlig: {currentInterval.assignedStudent}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 font-heading text-xs font-bold ${currentAct.lightBg} ${currentAct.textClass}`}
                >
                  {currentAct.name}
                </span>
              </div>
            </div>

            {/* Giant Countdown Number */}
            <div className="my-8 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="h-64 w-64 -rotate-90 transform sm:h-72 sm:w-72">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    className="stroke-ink/10"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="42%"
                    className="transition-all duration-500 ease-linear"
                    stroke={currentAct.color}
                    strokeWidth="12"
                    strokeDasharray={650}
                    strokeDashoffset={650 - (650 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Digital Clock display in center */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-heading text-5xl sm:text-6xl font-black tracking-tight text-ink">
                    {formattedTime}
                  </span>
                  <span className="font-heading text-xs font-semibold text-ink-muted mt-1 uppercase tracking-widest">
                    Gjenstående tid
                  </span>
                </div>
              </div>

              {/* Linear Progress bar */}
              <div className="w-full max-w-md mt-6 bg-ink/10 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${currentAct.bgClass}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Main Controls: Start/Pause, Skip, Prev, Reset */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-ink/10">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                title="Gå til forrige"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-ink/15 bg-surface text-ink hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <SkipBack size={20} />
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Nullstill timer"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-ink/15 bg-surface text-ink hover:bg-ink/5 transition-all"
              >
                <RotateCcw size={20} />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className={`flex h-16 w-32 cursor-pointer items-center justify-center gap-2 rounded-2xl font-heading text-lg font-extrabold text-white shadow-clay transition-all transform hover:scale-105 active:scale-95 ${
                  isRunning
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-primary hover:bg-primary-hover"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause size={24} className="fill-current" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={24} className="fill-current" />
                    Start
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                title="Hopp over til neste intervall"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-ink/15 bg-surface text-ink hover:bg-ink/5 transition-all"
              >
                <SkipForward size={20} />
              </button>
            </div>
          </div>

          {/* Right Column: Next Up Preview & Full Timeline */}
          <div className="space-y-6">
            {/* Next Activity Preview Card */}
            <div className="rounded-xl2 border border-ink/10 bg-surface p-5 shadow-clay space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Neste i køen ⏭️
                </span>
                {nextInterval && (
                  <span className="text-xs font-heading font-semibold text-ink-muted">
                    {nextInterval.minutes > 0 ? `${nextInterval.minutes} min ` : ""}
                    {nextInterval.seconds > 0 ? `${nextInterval.seconds} sek` : ""}
                  </span>
                )}
              </div>

              {nextInterval ? (
                (() => {
                  const nextAct = getActivity(nextInterval.activityId);
                  const NextIcon = nextAct.icon;
                  return (
                    <div className="flex items-center gap-3.5 rounded-xl border border-ink/10 bg-ink/5 p-3.5">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${nextAct.bgClass} text-white shadow-sm`}
                      >
                        <NextIcon size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading text-base font-bold text-ink truncate">
                          {nextInterval.customTitle || nextAct.name}
                        </h3>
                        <p className="font-body text-xs text-ink-muted">
                          {nextAct.name}
                          {nextInterval.assignedStudent && (
                            <span className="ml-2 font-heading font-semibold text-primary inline-flex items-center gap-0.5">
                              • <User size={11} /> {nextInterval.assignedStudent}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="rounded-xl border border-dashed border-ink/15 p-4 text-center">
                  <p className="font-heading text-sm font-bold text-ink-muted">
                    Dette er det siste intervallet! ✨
                  </p>
                </div>
              )}
            </div>

            {/* Timeline Progress List */}
            <div className="rounded-xl2 border border-ink/10 bg-surface p-5 shadow-clay space-y-3">
              <h3 className="font-heading text-sm font-bold text-ink">
                Øktforløp ({currentIndex + 1}/{intervals.length})
              </h3>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {intervals.map((inv, idx) => {
                  const act = getActivity(inv.activityId);
                  const Icon = act.icon;
                  const isCurrent = idx === currentIndex;
                  const isDone = idx < currentIndex;

                  return (
                    <div
                      key={inv.id || idx}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsCompleted(false);
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all ${
                        isCurrent
                          ? "border-primary bg-primary/10 shadow-sm"
                          : isDone
                          ? "border-ink/5 bg-ink/5 opacity-70 hover:opacity-100"
                          : "border-ink/10 bg-surface hover:border-ink/20"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isDone ? (
                          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        ) : (
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              isCurrent ? "bg-primary text-white" : "bg-ink/5 text-ink-muted"
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                        )}
                        <span
                          className={`font-heading text-xs font-bold truncate ${
                            isCurrent ? "text-primary" : "text-ink"
                          }`}
                        >
                          {inv.customTitle || act.name}
                          {inv.assignedStudent && (
                            <span className="ml-1.5 font-semibold text-primary text-[11px] inline-flex items-center gap-0.5">
                              (<User size={10} /> {inv.assignedStudent})
                            </span>
                          )}
                        </span>
                      </div>

                      <span className="font-heading text-[11px] text-ink-muted shrink-0 ml-2">
                        {inv.minutes > 0 ? `${inv.minutes}m ` : ""}
                        {inv.seconds > 0 ? `${inv.seconds}s` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
