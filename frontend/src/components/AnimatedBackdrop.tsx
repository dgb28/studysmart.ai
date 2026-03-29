"use client";

import { motion } from "framer-motion";

/** Theme-aware gradient orbs + rotating mesh for subtle motion. */
export default function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Slow rotating color mesh */}
      <div
        className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 opacity-[var(--mesh-opacity)]"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, var(--orb-a), var(--orb-b), var(--orb-c), var(--orb-a))",
          filter: "blur(80px)",
          animation: "mesh-drift 48s linear infinite",
        }}
      />
      <motion.div
        className="absolute -left-[20%] -top-[30%] h-[70vmin] w-[70vmin] rounded-full blur-[100px]"
        style={{ backgroundColor: "var(--orb-a)" }}
        animate={{
          scale: [1, 1.08, 1],
          x: [0, 30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[15%] top-[10%] h-[55vmin] w-[55vmin] rounded-full blur-[90px]"
        style={{ backgroundColor: "var(--orb-b)" }}
        animate={{
          scale: [1.05, 1, 1.05],
          x: [0, -25, 0],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[25%] h-[50vmin] w-[50vmin] rounded-full blur-[100px]"
        style={{ backgroundColor: "var(--orb-c)" }}
        animate={{
          scale: [1, 1.12, 1],
          y: [0, -30, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]"
        aria-hidden
      />
    </div>
  );
}
