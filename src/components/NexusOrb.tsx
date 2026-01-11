import { motion } from "framer-motion";

interface NexusOrbProps {
  isActive?: boolean;
  isThinking?: boolean;
  size?: "sm" | "md" | "lg";
}

export function NexusOrb({ isActive = false, isThinking = false, size = "lg" }: NexusOrbProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-48 h-48",
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/30"
        animate={isActive || isThinking ? {
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.1, 0.3],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border border-primary/40"
        animate={isActive || isThinking ? {
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.2, 0.4],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-primary/50"
        animate={isActive || isThinking ? {
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.3, 0.5],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />

      {/* Core orb */}
      <motion.div
        className={`
          relative rounded-full
          ${size === "lg" ? "w-32 h-32" : size === "md" ? "w-16 h-16" : "w-8 h-8"}
          bg-gradient-to-br from-primary via-accent to-secondary
          shadow-2xl
        `}
        animate={isThinking ? {
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 40px hsl(185 100% 50% / 0.5), 0 0 80px hsl(185 100% 50% / 0.3)",
            "0 0 60px hsl(185 100% 50% / 0.7), 0 0 120px hsl(185 100% 50% / 0.5)",
            "0 0 40px hsl(185 100% 50% / 0.5), 0 0 80px hsl(185 100% 50% / 0.3)",
          ],
        } : {
          boxShadow: "0 0 40px hsl(185 100% 50% / 0.5), 0 0 80px hsl(185 100% 50% / 0.3)",
        }}
        transition={{ duration: 1.5, repeat: isThinking ? Infinity : 0, ease: "easeInOut" }}
        style={{
          boxShadow: "0 0 40px hsl(185 100% 50% / 0.5), 0 0 80px hsl(185 100% 50% / 0.3)",
        }}
      >
        {/* Inner highlight */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
        
        {/* Center point */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={isThinking ? { rotate: 360 } : {}}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-4 h-4 rounded-full bg-white/80 blur-[2px]" />
        </motion.div>
      </motion.div>

      {/* Orbiting particles */}
      {isActive && (
        <>
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "center", left: "calc(50% - 4px)", top: "-8px" }}
          />
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-secondary"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "center", right: "-8px", top: "50%" }}
          />
        </>
      )}
    </div>
  );
}
