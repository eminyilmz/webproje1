"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

// Faint background pixel particles
const PARTICLE_COUNT = 10;
const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
  id: i,
  size: [16, 24, 32, 48, 64][i % 5],
  x: `${[5, 20, 38, 55, 72, 88, 15, 45, 65, 80][i]}%`,
  y: `${[15, 42, 10, 68, 30, 58, 85, 88, 25, 75][i]}%`,
  duration: [20, 26, 32, 38, 44][i % 5],
  delay: i * 1.5,
}));

export default function MouseGlow() {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);

  // Smooth lagging configuration for the background aura
  const auraSpringConfig = { damping: 50, stiffness: 120, mass: 1.0 };
  const auraX = useSpring(mouseX, auraSpringConfig);
  const auraY = useSpring(mouseY, auraSpringConfig);

  // Fast configuration for the neon pointer core dot
  const coreSpringConfig = { damping: 25, stiffness: 350, mass: 0.15 };
  const coreX = useSpring(mouseX, coreSpringConfig);
  const coreY = useSpring(mouseY, coreSpringConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleClick = (e: MouseEvent) => {
      const newRipple: ClickRipple = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };
      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after expansion animations finish (1200ms)
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 1200);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Floating pixel squares (theme decorative layer) */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, rotate: 0, y: 0 }}
            animate={{ 
              opacity: [0.01, 0.06, 0.01],
              rotate: [0, 180, 360],
              y: [-15, 15, -15],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
            className="absolute border border-white/5 bg-white/[0.005]"
            style={{
              width: p.size,
              height: p.size,
              left: p.x,
              top: p.y,
            }}
          />
        ))}
      </div>

      {/* Soft neon background glow (aura) */}
      <motion.div
        className="fixed pointer-events-none -z-10 w-[450px] h-[450px] rounded-full mix-blend-screen"
        style={{
          x: auraX,
          y: auraY,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0) 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Sharp neon white core dot */}
      <motion.div
        className="fixed pointer-events-none z-50 w-2 h-2 bg-white rounded-full mix-blend-screen"
        style={{
          x: coreX,
          y: coreY,
          translateX: "-50%",
          translateY: "-50%",
          boxShadow: "0 0 10px #fff, 0 0 20px #fff, 0 0 35px rgba(255, 255, 255, 0.9), 0 0 50px rgba(255, 255, 255, 0.5)",
        }}
      />

      {/* Click ripples (expanded light reservoirs) */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="fixed pointer-events-none z-50 mix-blend-screen"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Massive Outer expanding ring */}
            <motion.div
              initial={{ scale: 0.1, opacity: 0.95 }}
              animate={{ scale: 7.0, opacity: 0 }}
              transition={{ duration: 1.1, ease: [0.1, 0.8, 0.15, 1] }}
              className="absolute w-12 h-12 rounded-full border border-white/40"
              style={{
                boxShadow: "0 0 20px rgba(255, 255, 255, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.3)",
                transform: "translate(-50%, -50%)",
              }}
            />
            {/* Large Inner expanding flash */}
            <motion.div
              initial={{ scale: 0.1, opacity: 0.85 }}
              animate={{ scale: 4.5, opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute w-16 h-16 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 70%)",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        ))}
      </AnimatePresence>
    </>
  );
}
