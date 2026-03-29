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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 text-yellow-400/90 mb-2">
          <Trophy className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
            Arena
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="gradient-text">Leader</span>
          <span className="text-slate-900 dark:text-white">board</span>
        </h1>
        <p className="text-slate-600 dark:text-zinc-400 text-sm mt-3 max-w-2xl leading-relaxed">
          Score blends study time (35%), streak (25%), goals (20%), quizzes
          (20%) — same formula as your header rank.
        </p>
      </motion.div>

      {err && (
        <div className="glass-panel rounded-[1.5rem] p-4 text-amber-300 border border-amber-500/20 text-sm">
          {err}
        </div>
      )}

      <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/[0.06]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-slate-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80 dark:border-white/[0.06]">
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
                  transition={{
                    delay: i * 0.04,
                    type: "spring",
                    stiffness: 400,
                    damping: 28,
                  }}
                  className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4 pl-6">
                    <span
                      className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full text-xs font-bold ${
                        r.rank === 1
                          ? "bg-gradient-to-br from-amber-200/90 to-amber-400/50 text-amber-950 ring-1 ring-amber-400/50 dark:from-yellow-400/30 dark:to-amber-600/20 dark:text-yellow-100 dark:ring-yellow-400/40"
                          : r.rank === 2
                            ? "bg-slate-200/90 text-slate-800 ring-1 ring-slate-400/40 dark:bg-zinc-400/15 dark:text-zinc-200 dark:ring-zinc-400/25"
                            : r.rank === 3
                              ? "bg-orange-200/80 text-orange-950 ring-1 ring-orange-400/50 dark:bg-orange-700/20 dark:text-orange-100 dark:ring-orange-500/30"
                              : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-zinc-400"
                      }`}
                    >
                      {r.rank === 1 ? (
                        <Crown className="w-3.5 h-3.5 mr-0.5" />
                      ) : null}
                      {r.rank}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-900 dark:text-white">
                    {r.display_name}
                  </td>
                  <td className="p-4 font-mono font-semibold tabular-nums text-cyan-800 dark:text-cyan-300">
                    {r.score}
                  </td>
                  <td className="p-4 text-slate-700 dark:text-zinc-300 tabular-nums">
                    {r.study_minutes_7d}
                  </td>
                  <td className="p-4 font-medium tabular-nums text-amber-900 dark:text-amber-300">
                    {r.streak}
                  </td>
                  <td className="p-4 text-slate-700 dark:text-zinc-300 tabular-nums">
                    {r.goals_done_7d}
                  </td>
                  <td className="p-4 pr-6 text-slate-700 dark:text-zinc-300 tabular-nums">
                    {r.quiz_passes_7d}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
