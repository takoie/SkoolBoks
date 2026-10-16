import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box } from "lucide-react";

export default function Logo() {
  const [isTool, setIsTool] = useState(false);

  useEffect(() => {
    // Alternate state: 6.5s as SkoolBoks, 3.5s as tool 📦
    const timer = setTimeout(() => {
      setIsTool((prev) => !prev);
    }, isTool ? 3500 : 6500);

    return () => clearTimeout(timer);
  }, [isTool]);

  const toggleState = () => {
    setIsTool((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleState}
      title="Klikk for å animere logo"
      aria-label={isTool ? "tool" : "SkoolBoks"}
      className="group relative flex cursor-pointer items-center justify-center font-heading text-2xl font-extrabold tracking-wide outline-none select-none"
    >
      <motion.div
        className="flex items-center"
        animate={{
          color: isTool ? "var(--color-accent-teal)" : "var(--color-ink)",
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* 'S' letter collapsing into kool */}
        <motion.span
          initial={false}
          animate={{
            width: isTool ? 0 : "auto",
            opacity: isTool ? 0 : 1,
            scale: isTool ? 0.2 : 1,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="inline-block overflow-hidden whitespace-nowrap"
        >
          S
        </motion.span>

        {/* First letter morphing: 'k' <-> 't' */}
        <span className="relative inline-block">
          <AnimatePresence mode="wait">
            {isTool ? (
              <motion.span
                key="t-letter"
                initial={{ rotateY: 90, opacity: 0, scale: 0.7 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: -90, opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="inline-block"
              >
                t
              </motion.span>
            ) : (
              <motion.span
                key="k-letter"
                initial={{ rotateY: -90, opacity: 0, scale: 0.7 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: 90, opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="inline-block"
              >
                k
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        {/* 'ool' part */}
        <span>ool</span>

        {/* 'Boks' text collapsing into 'l' */}
        <motion.span
          initial={false}
          animate={{
            width: isTool ? 0 : "auto",
            opacity: isTool ? 0 : 1,
            scale: isTool ? 0.2 : 1,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="inline-block overflow-hidden whitespace-nowrap"
        >
          Boks
        </motion.span>

        {/* Box Icon popping out when in 'tool' mode */}
        <motion.span
          initial={false}
          animate={{
            width: isTool ? "auto" : 0,
            opacity: isTool ? 1 : 0,
            scale: isTool ? 1 : 0,
            marginLeft: isTool ? 6 : 0,
          }}
          transition={{ duration: 0.45, ease: "backOut" }}
          className="inline-flex items-center justify-center overflow-hidden"
        >
          <Box size={24} className="stroke-[2.5]" aria-hidden="true" />
        </motion.span>
      </motion.div>
    </button>
  );
}
