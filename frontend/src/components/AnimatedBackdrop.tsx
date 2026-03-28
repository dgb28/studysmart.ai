"use client";

import { motion } from "framer-motion";

export default function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-[20%] -top-[30%] h-[70vmin] w-[70vmin] rounded-full bg-cyan-500/15 blur-[100px]"
        animate={{
          scale: [1, 1.08, 1],
          x: [0, 30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[15%] top-[10%] h-[55vmin] w-[55vmin] rounded-full bg-violet-600/18 blur-[90px]"
        animate={{
          scale: [1.05, 1, 1.05],
          x: [0, -25, 0],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[25%] h-[50vmin] w-[50vmin] rounded-full bg-fuchsia-600/12 blur-[100px]"
        animate={{
          scale: [1, 1.12, 1],
          y: [0, -30, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
    </div>
  );
}
