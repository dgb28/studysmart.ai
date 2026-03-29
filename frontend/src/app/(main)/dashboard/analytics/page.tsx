"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Flame, Clock, Target, BrainCircuit, Activity } from "lucide-react";
import { getToken, api, isUnauthorized } from "@/lib/api";

type Data = {
  total_minutes_studied: number;
  topics_completed: number;
  daily_focus: { date: string; minutes: number }[];
  avg_session_minutes_last_week: number;
  avg_session_minutes_this_week: number;
  week_trend: string;
  current_streak: number;
  recommendation: string;
};

const card = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.07,
      type: "spring",
      stiffness: 380,
      damping: 26,
    },
  }),
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setErr(null);
    api<Data>("/analytics/me")
      .then(setData)
      .catch((e) => {
        if (isUnauthorized(e)) router.replace("/login");
        else {
          setErr("Could not load analytics.");
          setData(null);
        }
      });
  }, [router]);

  if (err)
    return (
      <div className="glass-panel rounded-[2rem] p-8 text-center text-amber-300 border border-amber-500/20">
        {err}
      </div>
    );
  if (!data)
    return (
      <div className="flex justify-center py-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
        />
      </div>
    );

  const statCards = [
    {
      icon: Clock,
      label: "Timer + logged",
      value: `${data.total_minutes_studied}m`,
      accent: "from-cyan-500/20 to-blue-500/10",
    },
    {
      icon: Flame,
      label: "Day streak",
      value: data.current_streak,
      accent: "from-orange-500/20 to-amber-500/10",
    },
    {
      icon: Target,
      label: "Topics done",
      value: data.topics_completed,
      accent: "from-emerald-500/20 to-teal-500/10",
    },
    {
      icon: BrainCircuit,
      label: "Week trend",
      value: data.week_trend,
      accent: "from-violet-500/20 to-fuchsia-500/10",
    },
  ];

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 text-cyan-400/90 mb-2">
          <Activity className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
            Signal
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="gradient-text">Learning</span>{" "}
          <span className="text-slate-900 dark:text-white">analysis</span>
        </h1>
        <p className="text-zinc-500 mt-2 max-w-xl">
          Timer, goals, and topic progress — distilled.
        </p>
        <motion.p
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
          className="mt-6 text-sm text-cyan-100/90 glass-panel rounded-[1.5rem] p-5 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent"
        >
          {data.recommendation}
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((c, i) => (
          <motion.div
            key={c.label}
            custom={i}
            variants={card}
            initial="hidden"
            animate="show"
            whileHover={{
              y: -4,
              transition: { type: "spring", stiffness: 400, damping: 22 },
            }}
            className={`glass-panel p-6 rounded-[1.75rem] bg-gradient-to-br ${c.accent} border border-white/[0.06]`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 mb-4">
              <c.icon className="w-6 h-6 text-cyan-300" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {c.value}
            </div>
            <div className="text-sm text-zinc-500 mt-1">{c.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6 md:p-8 rounded-[2rem]"
      >
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
          Average focus block
        </h3>
        <p className="text-sm text-zinc-500">
          This week:{" "}
          <strong className="text-cyan-300">
            {data.avg_session_minutes_this_week} min
          </strong>{" "}
          per segment · Last week:{" "}
          <strong className="text-violet-300">
            {data.avg_session_minutes_last_week} min
          </strong>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="glass-panel p-6 md:p-10 rounded-[2rem] h-[420px]"
      >
        <h3 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
          Timer minutes · 7 days
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={data.daily_focus}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                backgroundColor: "rgba(12,12,16,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                backdropFilter: "blur(12px)",
              }}
            />
            <Bar
              dataKey="minutes"
              fill="url(#barGrad)"
              radius={[12, 12, 12, 12]}
              maxBarSize={44}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
