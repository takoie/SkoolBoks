let ctx = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, startTime, duration, gainValue = 0.15) {
  const audioCtx = getCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

const sounds = {
  tick: () => tone(880, getCtx().currentTime, 0.05, 0.08),
  ding: () => tone(1046.5, getCtx().currentTime, 0.35),
  tada: () => {
    const t = getCtx().currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      tone(freq, t + i * 0.09, 0.4)
    );
  },
  bombTick: () => tone(220, getCtx().currentTime, 0.06, 0.12),
  explosion: () => {
    const t = getCtx().currentTime;
    [110, 90, 70, 55].forEach((freq, i) =>
      tone(freq, t + i * 0.02, 0.6, 0.22)
    );
  },
};

export function playSound(name, enabled) {
  if (!enabled) return;
  try {
    sounds[name]?.();
  } catch {
    // Audio unavailable (e.g. no user gesture yet) — fail silently.
  }
}
