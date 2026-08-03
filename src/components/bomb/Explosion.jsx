import { motion } from "framer-motion";

const COLORS = ["#fde047", "#f97316", "#dc2626", "#7c2d12"];

function Explosion() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {COLORS.map((color, i) => (
        <motion.div
          key={color}
          className="absolute rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 20, height: 20, opacity: 0.9 }}
          animate={{
            width: 260 + i * 60,
            height: 260 + i * 60,
            opacity: 0,
          }}
          transition={{ duration: 0.8 + i * 0.15, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default Explosion;
