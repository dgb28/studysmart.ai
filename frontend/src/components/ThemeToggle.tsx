"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

/** Sun/Moon toggle; renders a stable placeholder until mounted to avoid hydration mismatch. */
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="h-9 w-9 shrink-0 rounded-full border border-[var(--border)] bg-[var(--card)]"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-sm transition-colors hover:bg-[var(--card-hover)]"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-indigo-600" />}
    </motion.button>
  );
}
