"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrainCircuit, Flame, Trophy, Play, Pause } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import { api, getToken, setToken } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import { useFocusInteractionTracker } from "@/hooks/useFocusInteractionTracker";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "600"] });

const navItem = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.98 },
};

export default function AppHeader() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [rank, setRank] = useState<{
    rank: number;
    total_users: number;
    streak: number;
  } | null>(null);

  const { reset: resetInteraction, getSnapshot: getInteractionSnapshot } =
    useFocusInteractionTracker(running);

  const syncTimer = useCallback(async () => {
    if (!getToken()) return;
    try {
      const s = await api<{ running: boolean; started_at: string | null }>(
        "/timer/state",
      );
      setRunning(s.running);
      setStartedAt(s.started_at);
    } catch {
      /* ignore */
    }
  }, []);

  const syncRank = useCallback(async () => {
    if (!getToken()) return;
    try {
      const r = await api<{
        rank: number;
        total_users: number;
        streak: number;
      }>("/leaderboard/me");
      setRank(r);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    syncTimer();
    syncRank();
    const i = setInterval(() => {
      syncTimer();
      syncRank();
    }, 30000);
    const onSync = () => {
      void syncTimer();
    };
    window.addEventListener("sp-focus-timer-sync", onSync);
    return () => {
      clearInterval(i);
      window.removeEventListener("sp-focus-timer-sync", onSync);
    };
  }, [syncTimer, syncRank]);

  useEffect(() => {
    if (!running || !startedAt) {
      setElapsed(0);
      return;
    }
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, startedAt]);

  const pauseFocus = useCallback(async () => {
    if (!running) return;
    try {
      const snap = getInteractionSnapshot();
      const s = await api<{ running: boolean; started_at: string | null }>(
        "/timer/action",
        {
          method: "POST",
          json: {
            action: "pause",
            tab_changes: snap.tab_changes,
            keyboard_inputs: snap.keyboard_inputs,
            window_blurs: snap.window_blurs,
            mouse_movements: snap.mouse_movements,
          },
        },
      );
      resetInteraction();
      setRunning(s.running);
      setStartedAt(s.started_at);
      syncRank();
      window.dispatchEvent(new CustomEvent("sp-focus-timer-sync"));
    } catch (e) {
      console.error(e);
    }
  }, [running, getInteractionSnapshot, resetInteraction, syncRank]);

  useEffect(() => {
    const onPauseForAnalytics = () => {
      void pauseFocus();
    };
    window.addEventListener("sp-pause-focus-for-analytics", onPauseForAnalytics);
    return () => {
      window.removeEventListener("sp-pause-focus-for-analytics", onPauseForAnalytics);
    };
  }, [pauseFocus]);

  async function toggleTimer() {
    try {
      if (running) {
        await pauseFocus();
        return;
      }

      resetInteraction();
      let topic_id: string | undefined;
      try {
        const t = sessionStorage.getItem("sp_focus_topic_id");
        if (
          t &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            t,
          )
        ) {
          topic_id = t;
        }
      } catch {
        /* ignore */
      }
      const s = await api<{ running: boolean; started_at: string | null }>(
        "/timer/action",
        {
          method: "POST",
          json: {
            action: "start",
            ...(topic_id ? { topic_id } : {}),
          },
        },
      );
      setRunning(s.running);
      setStartedAt(s.started_at);
    } catch (e) {
      console.error(e);
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="sticky top-0 z-50 mx-3 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-full border border-[var(--border)] glass-panel px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-shadow dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] md:mx-6 md:mt-4 md:gap-4 md:px-6"
    >
      <Link href="/home" className="flex items-center gap-2.5 shrink-0 group">
        <motion.div
          whileHover={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.5 }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/25 to-violet-600/25 ring-1 ring-[var(--border)] dark:from-cyan-500/30 dark:to-violet-600/30 dark:ring-white/10"
        >
          <BrainCircuit className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
          <span className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
        <span className="text-lg font-bold tracking-tight">
          <span className="gradient-text">Study</span>
          <span className="text-slate-900 dark:text-white">Pulse</span>
        </span>
      </Link>

      <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
        <motion.button
          type="button"
          onClick={toggleTimer}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={`flex items-center gap-2 rounded-full py-2 pl-3 pr-4 text-sm font-medium transition-shadow ${
            running
              ? "bg-gradient-to-r from-emerald-500/25 to-cyan-500/20 shadow-[0_0_24px_rgba(52,211,153,0.2)] ring-2 ring-emerald-400/50 dark:shadow-[0_0_24px_rgba(52,211,153,0.25)]"
              : "glass-pill hover:bg-[var(--card-hover)]"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              running
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 text-cyan-700 dark:bg-white/10 dark:text-cyan-300"
            }`}
          >
            {running ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 pl-0.5" />
            )}
          </span>
          <span
            className={`${mono.className} tabular-nums text-slate-800 dark:text-zinc-100`}
          >
            {running || elapsed ? `${mm}:${ss}` : "Focus"}
          </span>
        </motion.button>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/dashboard/goals"
            className="flex items-center gap-2 rounded-full glass-pill px-3 py-2 text-sm text-amber-700 transition-shadow hover:text-amber-600 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] dark:text-amber-300 dark:hover:text-amber-200 dark:hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]"
            title="Streak"
          >
            <Flame className="w-4 h-4" />
            <span className="font-semibold tabular-nums">
              {rank?.streak ?? "—"}
            </span>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/dashboard/leaderboard"
            className="flex items-center gap-1.5 rounded-full glass-pill px-3 py-2 text-sm text-yellow-700 transition-shadow hover:text-yellow-600 hover:shadow-[0_0_20px_rgba(250,204,21,0.12)] dark:text-yellow-300 dark:hover:text-yellow-200 dark:hover:shadow-[0_0_20px_rgba(250,204,21,0.15)]"
            title="Leaderboard"
          >
            <Trophy className="w-4 h-4" />
            <span className="font-semibold">#{rank?.rank ?? "—"}</span>
          </Link>
        </motion.div>
      </div>

      <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
        {[
          { href: "/dashboard", label: "Paths" },
          { href: "/dashboard/goals", label: "Goals" },
          { href: "/dashboard/analytics", label: "Analysis" },
          { href: "/home", label: "Home" },
        ].map((item) => (
          <motion.div
            key={item.href}
            variants={navItem}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            <Link
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-black/[0.04] hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              {item.label}
            </Link>
          </motion.div>
        ))}
        <ThemeToggle />
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setToken(null);
            window.location.href = "/login";
          }}
          className="ml-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-red-400/40 hover:text-red-600 dark:text-zinc-500 dark:hover:border-red-500/30 dark:hover:text-red-300"
        >
          Log out
        </motion.button>
      </nav>
    </motion.header>
  );
}
