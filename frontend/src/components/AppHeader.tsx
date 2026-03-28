"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrainCircuit, Flame, Trophy, Play, Pause } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import { api, getToken, setToken } from "@/lib/api";

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
  const [rank, setRank] = useState<{ rank: number; total_users: number; streak: number } | null>(null);

  const syncTimer = useCallback(async () => {
    if (!getToken()) return;
    try {
      const s = await api<{ running: boolean; started_at: string | null }>("/timer/state");
      setRunning(s.running);
      setStartedAt(s.started_at);
    } catch {
      /* ignore */
    }
  }, []);

  const syncRank = useCallback(async () => {
    if (!getToken()) return;
    try {
      const r = await api<{ rank: number; total_users: number; streak: number }>("/leaderboard/me");
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
    return () => clearInterval(i);
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

  async function toggleTimer() {
    try {
      const action = running ? "pause" : "start";
      const s = await api<{ running: boolean; started_at: string | null }>("/timer/action", {
        method: "POST",
        json: { action },
      });
      setRunning(s.running);
      setStartedAt(s.started_at);
      if (action === "pause") syncRank();
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
      className="sticky top-0 z-50 mx-3 mt-3 md:mx-6 md:mt-4 rounded-full glass-panel border border-white/[0.08] px-4 py-2.5 md:px-6 flex flex-wrap items-center gap-3 md:gap-4 justify-between shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
    >
      <Link href="/home" className="flex items-center gap-2.5 shrink-0 group">
        <motion.div
          whileHover={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.5 }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-600/30 ring-1 ring-white/10"
        >
          <BrainCircuit className="w-5 h-5 text-cyan-300" />
          <span className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
        <span className="text-lg font-bold tracking-tight">
          <span className="gradient-text">Study</span>
          <span className="text-white">Pulse</span>
        </span>
      </Link>

      <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
        <motion.button
          type="button"
          onClick={toggleTimer}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={`flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-sm font-medium transition-shadow ${
            running
              ? "bg-gradient-to-r from-emerald-500/25 to-cyan-500/20 ring-2 ring-emerald-400/50 shadow-[0_0_24px_rgba(52,211,153,0.25)]"
              : "glass-pill bg-white/[0.04] hover:bg-white/[0.08]"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              running ? "bg-emerald-500 text-white" : "bg-white/10 text-cyan-300"
            }`}
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 pl-0.5" />}
          </span>
          <span className={`${mono.className} text-zinc-100 tabular-nums`}>
            {running || elapsed ? `${mm}:${ss}` : "Focus"}
          </span>
        </motion.button>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/dashboard/goals"
            className="flex items-center gap-2 rounded-full glass-pill px-3 py-2 text-sm text-amber-300 hover:text-amber-200 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-shadow"
            title="Streak"
          >
            <Flame className="w-4 h-4" />
            <span className="font-semibold tabular-nums">{rank?.streak ?? "—"}</span>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/dashboard/leaderboard"
            className="flex items-center gap-1.5 rounded-full glass-pill px-3 py-2 text-sm text-yellow-300 hover:text-yellow-200 hover:shadow-[0_0_20px_rgba(250,204,21,0.15)] transition-shadow"
            title="Leaderboard"
          >
            <Trophy className="w-4 h-4" />
            <span className="font-semibold">#{rank?.rank ?? "—"}</span>
          </Link>
        </motion.div>
      </div>

      <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
        {[
          { href: "/dashboard", label: "Paths" },
          { href: "/dashboard/goals", label: "Goals" },
          { href: "/dashboard/analytics", label: "Analysis" },
          { href: "/home", label: "Home" },
        ].map((item) => (
          <motion.div key={item.href} variants={navItem} initial="rest" whileHover="hover" whileTap="tap">
            <Link
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {item.label}
            </Link>
          </motion.div>
        ))}
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setToken(null);
            window.location.href = "/login";
          }}
          className="ml-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-500 hover:border-red-500/30 hover:text-red-300 transition-colors"
        >
          Log out
        </motion.button>
      </nav>
    </motion.header>
  );
}
