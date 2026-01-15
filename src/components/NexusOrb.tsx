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

  const coreSize = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-32 h-32",
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Outer glow rings - iOS style subtle */}
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/20"
        animate={isActive || isThinking ? {
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.05, 0.2],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border border-primary/25"
        animate={isActive || isThinking ? {
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.1, 0.25],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-primary/30"
        animate={isActive || isThinking ? {
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.15, 0.3],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />

      {/* Core orb - Glass style */}
      <motion.div
        className={`
          relative rounded-full ${coreSize[size]}
          bg-gradient-to-br from-primary/80 via-primary to-secondary/80
        `}
        animate={isThinking ? {
          scale: [1, 1.03, 1],
        } : {}}
        transition={{ duration: 1.5, repeat: isThinking ? Infinity : 0, ease: "easeInOut" }}
        style={{
          boxShadow: `
            0 0 30px hsl(var(--primary) / 0.3),
            0 0 60px hsl(var(--primary) / 0.15),
            inset 0 -10px 30px hsl(var(--secondary) / 0.3),
            inset 0 10px 30px hsl(220 100% 95% / 0.2)
          `,
        }}
      >
        {/* Glass highlight - top */}
        <div 
          className="absolute inset-x-2 top-1 h-1/3 rounded-full opacity-60"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
          }}
        />
        
        {/* Glass reflection - bottom */}
        <div 
          className="absolute inset-x-4 bottom-2 h-1/4 rounded-full opacity-20"
          style={{
            background: "linear-gradient(0deg, rgba(255,255,255,0.3) 0%, transparent 100%)",
          }}
        />
        
        {/* Center glow */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={isThinking ? { rotate: 360 } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
            }}
          />
        </motion.div>
      </motion.div>

      {/* Subtle orbiting elements */}
      {isActive && (
        <>
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{ 
              transformOrigin: "center", 
              left: "calc(50% - 3px)", 
              top: "-4px",
              boxShadow: "0 0 8px hsl(var(--primary) / 0.5)"
            }}
          />
          <motion.div
            className="absolute w-1 h-1 rounded-full bg-secondary/60"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ 
              transformOrigin: "center", 
              right: "-4px", 
              top: "50%",
              boxShadow: "0 0 6px hsl(var(--secondary) / 0.5)"
            }}
          />
        </>
      )}
    </div>
  );
}
