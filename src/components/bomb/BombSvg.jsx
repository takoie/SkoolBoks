import { motion } from "framer-motion";

function lerpColor(t) {
  // dark gray (75,85,99) -> red (220,38,38)
  const r = Math.round(75 + (220 - 75) * t);
  const g = Math.round(85 + (38 - 85) * t);
  const b = Math.round(99 + (38 - 99) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function BombSvg({ progress }) {
  const shake = 2 + progress * 14;
  const duration = Math.max(0.5 - progress * 0.4, 0.08);
  const color = lerpColor(progress);

  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      animate={{ rotate: [-shake, shake, -shake] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      <circle cx="100" cy="115" r="60" fill={color} />
      <rect x="95" y="40" width="10" height="35" rx="4" fill="#78350f" />
      <motion.circle
        cx="100"
        cy="35"
        r="7"
        fill="#f59e0b"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: Math.max(0.3 - progress * 0.2, 0.06), repeat: Infinity }}
      />
    </motion.svg>
  );
}

export default BombSvg;
