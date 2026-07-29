import confetti from "canvas-confetti";

export function fireConfetti(options = {}) {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) return;
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#4338CA", "#84CC16", "#FDBA74", "#FB7185"],
    ...options,
  });
}
