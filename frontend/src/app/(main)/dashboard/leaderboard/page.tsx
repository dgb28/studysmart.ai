"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Crown } from "lucide-react";
import { getToken, api, isUnauthorized } from "@/lib/api";

type Row = {
  rank: number;
  user_id: string;
  display_name: string;
  score: number;
  study_minutes_7d: number;
  streak: number;
  goals_done_7d: number;
  quiz_passes_7d: number;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setErr(null);
    api<Row[]>("/leaderboard/board")
      .then(setRows)
      .catch((e) => {
        if (isUnauthorized(e)) router.replace("/login");
        else setErr("Could not load leaderboard.");
      });
  }, [router]);

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-yellow-400/90 mb-2">
          <Trophy className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">Arena</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="gradient-text">Leader</span>
          <span className="text-slate-900 dark:text-white">board</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-3 max-w-2xl leading-relaxed">
          Score blends study time (35%), streak (25%), goals (20%), quizzes (20%) — same formula as your header rank.
        </p>
      </motion.div>

      {err && (
        <div className="glass-panel rounded-[1.5rem] p-4 text-amber-300 border border-amber-500/20 text-sm">{err}</div>
      )}

      <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-zinc-500 text-xs uppercase tracking-wider border-b border-white/[0.06]">
                <th className="p-4 pl-6">#</th>
                <th className="p-4">Name</th>
                <th className="p-4">Score</th>
                <th className="p-4">Study min</th>
                <th className="p-4">Streak</th>
                <th className="p-4">Goals</th>
                <th className="p-4 pr-6">Quizzes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <motion.tr
                  key={r.user_id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 28 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4 pl-6">
                    <span
                      className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full text-xs font-bold ${
                        r.rank === 1
                          ? "bg-gradient-to-br from-yellow-400/30 to-amber-600/20 text-yellow-200 ring-1 ring-yellow-400/40"
                          : r.rank === 2
                            ? "bg-zinc-400/15 text-zinc-300 ring-1 ring-zinc-400/25"
                            : r.rank === 3
                              ? "bg-orange-700/20 text-orange-200 ring-1 ring-orange-500/30"
                              : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {r.rank === 1 ? <Crown className="w-3.5 h-3.5 mr-0.5" /> : null}
                      {r.rank}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-900 dark:text-white">{r.display_name}</td>
                  <td className="p-4 text-cyan-300/90 font-mono tabular-nums">{r.score}</td>
                  <td className="p-4 text-zinc-400 tabular-nums">{r.study_minutes_7d}</td>
                  <td className="p-4 text-amber-300/80 tabular-nums">{r.streak}</td>
                  <td className="p-4 text-zinc-400 tabular-nums">{r.goals_done_7d}</td>
                  <td className="p-4 pr-6 text-zinc-400 tabular-nums">{r.quiz_passes_7d}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
