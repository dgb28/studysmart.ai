"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, Trash2, Check, RotateCcw, Target } from "lucide-react";
import { getToken, api, isUnauthorized } from "@/lib/api";

type Goal = {
  id: string;
  title: string;
  target_date: string;
  completed: boolean;
  completed_at: string | null;
};

type DaySum = { day: string; total: number; completed: number; percent: number };

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 28 } },
};

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cal, setCal] = useState<DaySum[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pick, setPick] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<string | null>(null);

  async function load() {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    const g = await api<Goal[]>("/goals/?include_past_incomplete=true");
    setGoals(g);
    const from = new Date();
    from.setDate(1);
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 0);
    const c = await api<DaySum[]>(
      `/goals/calendar?from_date=${from.toISOString().slice(0, 10)}&to_date=${to.toISOString().slice(0, 10)}`
    );
    setCal(c);
  }

  useEffect(() => {
    load().catch((e) => {
      if (isUnauthorized(e)) router.replace("/login");
    });
  }, [router]);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api("/goals/", { method: "POST", json: { title: title.trim(), target_date: date } });
    setTitle("");
    load();
  }

  async function toggle(g: Goal) {
    await api(`/goals/${g.id}`, { method: "PATCH", json: { completed: !g.completed } });
    load();
  }

  async function remove(id: string) {
    await api(`/goals/${id}`, { method: "DELETE" });
    load();
  }

  const today = new Date().toISOString().slice(0, 10);
  const pastIncomplete = goals.filter((g) => g.target_date < today && !g.completed);
  const selectedGoals = pick ? goals.filter((g) => g.target_date === pick) : [];

  return (
    <motion.div className="space-y-10" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400/90 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Rhythm</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="gradient-text">Daily</span>{" "}
            <span className="text-slate-900 dark:text-white">goals</span>
          </h1>
          <p className="text-zinc-500 mt-2 max-w-lg">Circular calendar · today glows green · hover for completion %</p>
        </div>
      </motion.div>

      <motion.form
        variants={item}
        onSubmit={addGoal}
        className="glass-panel rounded-[2rem] p-6 md:p-8 flex flex-col lg:flex-row flex-wrap gap-4 items-end"
      >
        <div className="flex-1 min-w-[200px] w-full">
          <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">What to achieve</label>
          <input
            className="input-orbit w-full"
            placeholder="e.g. Finish chapter 3…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Date</label>
          <input type="date" className="input-orbit w-full sm:w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-glow flex items-center gap-2 w-full lg:w-auto justify-center">
          <Plus className="w-4 h-4" />
          Add goal
        </motion.button>
      </motion.form>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
        <motion.div variants={item} className="glass-panel rounded-[2rem] p-6 md:p-8">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            This month
          </h2>
          <p className="text-sm text-zinc-500 mb-6">Today is the emerald ring · hover scales &amp; shows %</p>

          <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-4">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={`${d}-${i}`} className="text-[10px] sm:text-xs text-center text-zinc-500 font-medium uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3 justify-items-center">
            {cal.map((d) => {
              const isToday = d.day === today;
              const isSelected = pick === d.day;
              const showPct = hoverDay === d.day && d.total > 0;

              return (
                <motion.button
                  key={d.day}
                  type="button"
                  title={`${d.completed}/${d.total} done (${d.percent}%)`}
                  onMouseEnter={() => setHoverDay(d.day)}
                  onMouseLeave={() => setHoverDay(null)}
                  onClick={() => setPick(d.day)}
                  whileHover={{
                    scale: 1.14,
                    transition: { type: "spring", stiffness: 400, damping: 18 },
                  }}
                  whileTap={{ scale: 0.92 }}
                  className={[
                    "relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200",
                    "border border-black/[0.08] bg-black/[0.03] text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-inherit",
                    isToday
                      ? "calendar-day-today !bg-emerald-500/25 !border-emerald-400/70 text-emerald-800 ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-[var(--background)] dark:text-emerald-100"
                      : "",
                    isSelected && !isToday
                      ? "!bg-cyan-500/30 !border-cyan-400/50 text-slate-900 shadow-[0_0_24px_rgba(34,211,238,0.25)] dark:text-white"
                      : "",
                    hoverDay === d.day && !isToday
                      ? "!bg-violet-500/25 !border-violet-400/40 shadow-[0_0_28px_rgba(167,139,250,0.35)] z-10"
                      : "",
                  ].join(" ")}
                >
                  {showPct ? (
                    <span className="text-[10px] font-bold text-violet-700 dark:text-violet-200">{d.percent}%</span>
                  ) : (
                    <span>{d.day.slice(8, 10)}</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {pick && (
              <motion.div
                key={pick}
                initial={{ opacity: 0, y: 12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="mt-8 pt-6 border-t border-white/[0.06] overflow-hidden"
              >
                <p className="text-sm text-zinc-400 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  Goals for{" "}
                  <span className="font-medium text-slate-900 dark:text-white">{pick}</span>
                </p>
                <ul className="space-y-3">
                  {selectedGoals.map((g) => (
                    <motion.li
                      key={g.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between gap-3 rounded-full glass-pill px-4 py-3 bg-white/[0.03]"
                    >
                      <span className={g.completed ? "line-through text-zinc-500 text-sm" : "text-sm text-zinc-200"}>{g.title}</span>
                      <div className="flex gap-1 shrink-0">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggle(g)}
                          className="rounded-full p-2 hover:bg-white/10 text-cyan-400"
                          aria-label={g.completed ? "Undo" : "Done"}
                        >
                          {g.completed ? <RotateCcw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </motion.button>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.9 }}
                          onClick={() => remove(g.id)}
                          className="rounded-full p-2 hover:bg-red-500/20 text-red-400"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.li>
                  ))}
                  {selectedGoals.length === 0 && <li className="text-zinc-500 text-sm pl-2">No goals this day</li>}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Upcoming &amp; open</h2>
            <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {goals
                .filter((g) => g.target_date >= today || !g.completed)
                .slice(0, 30)
                .map((g, i) => (
                  <motion.li
                    key={g.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between gap-3 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="min-w-0">
                      <span className={g.completed ? "line-through text-zinc-500 text-sm block" : "text-sm text-zinc-200 block truncate"}>
                        {g.title}
                      </span>
                      <span className="text-[11px] text-zinc-600 font-mono">{g.target_date}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => toggle(g)} className="rounded-full p-2 hover:bg-cyan-500/15 text-cyan-400">
                        {g.completed ? <RotateCcw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => remove(g.id)} className="rounded-full p-2 hover:bg-red-500/15 text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.li>
                ))}
            </ul>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <h2 className="font-semibold text-lg text-amber-200/90 mb-4">Past incomplete</h2>
            <ul className="space-y-3">
              {pastIncomplete.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-2 rounded-full border border-amber-500/15 bg-amber-500/5 px-4 py-2.5 text-sm"
                >
                  <span className="text-zinc-300 truncate">{g.title}</span>
                  <button type="button" onClick={() => remove(g.id)} className="rounded-full p-2 text-red-400 hover:bg-red-500/10 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
              {pastIncomplete.length === 0 && <li className="text-zinc-500 text-sm">All clear ✨</li>}
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
