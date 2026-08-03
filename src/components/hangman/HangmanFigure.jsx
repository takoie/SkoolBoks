import { motion } from "framer-motion";

const PART_TRANSITION = { type: "spring", stiffness: 300, damping: 18 };

function Part({ show, children }) {
  return (
    <motion.g
      initial={false}
      animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.6 }}
      transition={PART_TRANSITION}
      style={{ transformOrigin: "100px 90px" }}
    >
      {children}
    </motion.g>
  );
}

function HangmanFigure({ wrongCount, extraHandsFeet = false, extraFace = false }) {
  // Base parts always take slots 1-6. Extra body parts (hands/feet, then
  // face) are appended after, so the slot each part occupies shifts
  // depending on which settings are enabled.
  let nextSlot = 7;
  const handsFeetSlot = extraHandsFeet ? nextSlot : null;
  if (extraHandsFeet) nextSlot += 4;
  const faceSlot = extraFace ? nextSlot : null;

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-hidden="true">
      {/* Gallows */}
      <line x1="20" y1="180" x2="120" y2="180" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-ink/30" />
      <line x1="45" y1="180" x2="45" y2="20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-ink/30" />
      <line x1="45" y1="20" x2="120" y2="20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-ink/30" />
      <line x1="120" y1="20" x2="120" y2="42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-ink/30" />

      {/* Head */}
      <Part show={wrongCount >= 1}>
        <circle cx="120" cy="58" r="16" fill="none" stroke="#dc2626" strokeWidth="5" />
      </Part>

      {/* Torso */}
      <Part show={wrongCount >= 2}>
        <line x1="120" y1="74" x2="120" y2="118" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
      </Part>

      {/* Left arm */}
      <Part show={wrongCount >= 3}>
        <line x1="120" y1="86" x2="98" y2="106" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
      </Part>

      {/* Right arm */}
      <Part show={wrongCount >= 4}>
        <line x1="120" y1="86" x2="142" y2="106" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
      </Part>

      {/* Left leg */}
      <Part show={wrongCount >= 5}>
        <line x1="120" y1="118" x2="102" y2="150" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
      </Part>

      {/* Right leg */}
      <Part show={wrongCount >= 6}>
        <line x1="120" y1="118" x2="138" y2="150" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
      </Part>

      {extraHandsFeet && (
        <>
          {/* Left hand */}
          <Part show={wrongCount >= handsFeetSlot}>
            <circle cx="96" cy="109" r="4" fill="#dc2626" />
          </Part>

          {/* Right hand */}
          <Part show={wrongCount >= handsFeetSlot + 1}>
            <circle cx="144" cy="109" r="4" fill="#dc2626" />
          </Part>

          {/* Left foot */}
          <Part show={wrongCount >= handsFeetSlot + 2}>
            <line x1="102" y1="150" x2="90" y2="153" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
          </Part>

          {/* Right foot */}
          <Part show={wrongCount >= handsFeetSlot + 3}>
            <line x1="138" y1="150" x2="150" y2="153" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
          </Part>
        </>
      )}

      {extraFace && (
        <>
          {/* Eyes */}
          <Part show={wrongCount >= faceSlot}>
            <circle cx="114" cy="55" r="1.6" fill="#dc2626" />
            <circle cx="126" cy="55" r="1.6" fill="#dc2626" />
          </Part>

          {/* Nose */}
          <Part show={wrongCount >= faceSlot + 1}>
            <line x1="120" y1="58" x2="120" y2="63" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
          </Part>

          {/* Mouth */}
          <Part show={wrongCount >= faceSlot + 2}>
            <path d="M 113 67 Q 120 62 127 67" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
          </Part>
        </>
      )}
    </svg>
  );
}

export default HangmanFigure;
