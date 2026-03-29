"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Table2,
} from "lucide-react";
import { getToken, api, isUnauthorized } from "@/lib/api";

type Data = {
  total_minutes_studied: number;
  topics_completed: number;
  daily_focus: {
    date: string;
    minutes: number;
    tab_switches?: number;
    keyboard_inputs?: number;
    mouse_movements?: number;
    window_blurs?: number;
  }[];
  avg_session_minutes_last_week: number;
  avg_session_minutes_this_week: number;
  week_trend: string;
  current_streak: number;
  recommendation: string;
  total_mouse_movements: number;
  total_keyboard_inputs: number;
  total_tab_changes: number;
  total_window_blurs: number;
  interaction_week_avg: {
    focus_minutes: number;
    tab_switches: number;
    keyboard_inputs: number;
    window_blurs: number;
    mouse_movements: number;
  };
};

function formatIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type DayRow = {
  topic_name: string;
  module_name: string;
  focus_time_seconds: number;
  tab_switches: number;
  keyboard_inputs: number;
  mouse_movements: number;
  window_blurs: number;
};

type InteractionWeek = Data["interaction_week_avg"];

function InteractionWeekTooltip({
  active,
  iw,
}: {
  active?: boolean;
  iw: InteractionWeek;
}) {
  if (!active) return null;
  return (
    <div className="min-w-[200px] rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-left text-xs text-zinc-100 shadow-xl">
      <p className="mb-2 font-semibold text-zinc-400">Last 7 days combined</p>
      <ul className="space-y-1.5 tabular-nums">
        <li className="flex justify-between gap-4">
          <span className="text-zinc-500">Focus time</span>
          <span>{iw.focus_minutes.toFixed(2)} min total</span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-zinc-500">Tab switches</span>
          <span>{iw.tab_switches.toFixed(0)}</span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-zinc-500">Keys</span>
          <span>{iw.keyboard_inputs.toFixed(0)}</span>
        </li>
        <li className="flex justify-between gap-4">
          <span className="text-zinc-500">Window blurs</span>
          <span>{iw.window_blurs.toFixed(0)}</span>
        </li>
      </ul>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayData, setDayData] = useState<DayRow[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    /** Pause Focus so reviewing analytics does not count as study time; snapshot is saved in AppHeader. */
    window.dispatchEvent(new CustomEvent("sp-pause-focus-for-analytics"));

    const loadMe = () => {
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
    };

    loadMe();
    api<string[]>("/analytics/calendar/days")
      .then(setActiveDays)
      .catch(console.error);

    const t = window.setTimeout(loadMe, 500);
    return () => clearTimeout(t);
  }, [router]);

  useEffect(() => {
    if (!selectedDate) {
      setDayData([]);
      return;
    }
    api<DayRow[]>(`/analytics/calendar/day?date=${selectedDate}`)
      .then(setDayData)
      .catch(console.error);
  }, [selectedDate]);

  const todayIso = useMemo(
    () => formatIso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
    [],
  );

  /** Open Focus segments have live duration; refresh today’s rows while the page is open. */
  useEffect(() => {
    if (!selectedDate || selectedDate !== todayIso) return;
    const id = setInterval(() => {
      api<DayRow[]>(`/analytics/calendar/day?date=${selectedDate}`)
        .then(setDayData)
        .catch(console.error);
    }, 15000);
    return () => clearInterval(id);
  }, [selectedDate, todayIso]);

  if (err)
    return (
      <div className="glass-panel rounded-[2rem] border border-amber-500/20 p-8 text-center text-amber-300">
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

  const iw = data.interaction_week_avg;
  const metricData = [
    { name: "Focus Time", value: iw.focus_minutes, fill: "#22d3ee" },
    { name: "Tabs", value: iw.tab_switches, fill: "#34d399" },
    { name: "Keys", value: iw.keyboard_inputs, fill: "#a78bfa" },
    { name: "Blurs", value: iw.window_blurs, fill: "#fbbf24" },
  ];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-2 flex items-center gap-2 text-cyan-400/90">
          <Activity className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">Signal</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          <span className="gradient-text">Learning</span>{" "}
          <span className="text-slate-900 dark:text-white">analysis</span>
        </h1>
        <p className="mt-2 max-w-xl text-slate-600 dark:text-zinc-500">
          Timer, goals, daily breakdowns, and topic progress — distilled.
        </p>
        <motion.p
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
          className="mt-6 rounded-[1.5rem] border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 to-transparent p-5 text-sm text-slate-800 glass-panel dark:border-cyan-500/20 dark:from-cyan-500/5 dark:text-cyan-100/90"
        >
          {data.recommendation}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel flex flex-col gap-8 rounded-[2rem] p-6 md:p-8 lg:flex-row lg:gap-12"
      >
        <div className="w-full shrink-0 lg:w-80">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
              <CalendarIcon className="h-5 w-5 text-cyan-400" /> Calendar
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="w-28 text-center text-sm font-medium text-slate-800 dark:text-slate-300">
                {currentMonth.toLocaleString("default", { month: "short" })} {year}
              </div>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-x-1 gap-y-3 text-center text-sm">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div
                key={d}
                className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600"
              >
                {d}
              </div>
            ))}
            {blanksArray.map((b) => (
              <div key={`b-${b}`} className="aspect-square" />
            ))}
            {daysArray.map((d) => {
              const iso = formatIso(year, month, d);
              const cellDate = new Date(year, month, d);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (cellDate > today) return <div key={d} className="aspect-square" />;
              const hasAct = activeDays.includes(iso);
              const isSel = selectedDate === iso;
              let cls =
                "aspect-square rounded-full flex items-center justify-center font-medium transition-all text-sm cursor-pointer ";
              if (isSel)
                cls +=
                  "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/25";
              else if (hasAct)
                cls +=
                  "border border-cyan-600/25 bg-cyan-50 text-cyan-800 hover:scale-110 dark:border-cyan-500/20 dark:bg-white/5 dark:text-cyan-300";
              else
                cls +=
                  "text-slate-500 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-white/5";
              return (
                <button key={d} type="button" onClick={() => setSelectedDate(iso)} className={cls}>
                  {d}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-center text-xs italic text-zinc-500">
            Future dates are hidden. Select a past date to see per-topic focus sessions (with topic linked).
          </p>
        </div>

        <div className="flex-1 border-t border-white/[0.06] pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          {!selectedDate ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-slate-600 dark:text-zinc-500">
              <CalendarIcon className="mb-4 h-12 w-12 opacity-30" />
              <p className="max-w-sm text-center">Select a date to see topic-level activity.</p>
            </div>
          ) : (
            <div className="flex w-full flex-col overflow-hidden">
              <h4 className="mb-6 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                <Table2 className="h-6 w-6 text-emerald-400" />
                Activity on{" "}
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("default", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h4>
              {dayData.length === 0 ? (
                <p className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-zinc-500">
                  No topic-linked sessions for this day. Start Focus on a study topic so segments attach to
                  it.
                </p>
              ) : (
                <div className="w-full overflow-x-auto pb-4">
                  <table className="w-full whitespace-nowrap text-left text-sm">
                    <thead className="bg-slate-100/90 text-slate-700 dark:bg-black/20 dark:text-zinc-400">
                      <tr>
                        <th className="rounded-l-xl px-4 py-3 font-medium">Topic</th>
                        <th className="px-4 py-3 font-medium">Module</th>
                        <th
                          className="cursor-help px-4 py-3 font-medium underline decoration-dotted decoration-zinc-600 underline-offset-4"
                          title={`Last 7 days total: ${iw.focus_minutes.toFixed(2)} min focus (table is one day)`}
                        >
                          Focus Time
                        </th>
                        <th
                          className="cursor-help px-4 py-3 font-medium text-emerald-800 underline decoration-dotted decoration-emerald-800/50 underline-offset-4 dark:text-emerald-300 dark:decoration-emerald-300/50"
                          title={`Last 7 days total: ${iw.tab_switches.toFixed(0)} tab switches`}
                        >
                          Tab Sw.
                        </th>
                        <th
                          className="cursor-help text-left font-medium text-cyan-800 underline decoration-dotted decoration-cyan-800/50 underline-offset-4 dark:text-cyan-200 dark:decoration-cyan-200/50"
                          title={`Last 7 days total: ${iw.keyboard_inputs.toFixed(0)} keys`}
                        >
                          Keys
                        </th>
                        <th
                          className="rounded-r-xl cursor-help text-left font-medium text-amber-900 underline decoration-dotted decoration-amber-900/50 underline-offset-4 dark:text-amber-200 dark:decoration-amber-200/50"
                          title={`Last 7 days total: ${iw.window_blurs.toFixed(0)} window blurs`}
                        >
                          Blurs
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {dayData.map((row, i) => (
                        <tr key={i} className="group hover:bg-white/[0.02]">
                          <td className="max-w-[140px] truncate px-4 py-4 font-medium text-slate-900 dark:text-slate-200">
                            {row.topic_name}
                          </td>
                          <td className="max-w-[120px] truncate px-4 py-4 text-zinc-500">
                            {row.module_name}
                          </td>
                          <td className="px-4 py-4 font-semibold text-cyan-400">
                            {(row.focus_time_seconds / 60).toFixed(1)}{" "}
                            <span className="text-[10px] uppercase text-zinc-600">min</span>
                          </td>
                          <td className="px-4 py-4 text-emerald-400">{row.tab_switches}</td>
                          <td className="py-4 text-cyan-400">{row.keyboard_inputs}</td>
                          <td className="py-4 text-amber-400">{row.window_blurs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="glass-panel w-full rounded-[2rem] p-6 md:p-8"
      >
        <div className="mb-8">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
            <Clock className="h-5 w-5 text-cyan-400" /> Interaction metrics (last 7 days)
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Totals across the last 7 calendar days (not an average per day). The activity table above is
            for one selected day only. Focus time includes completed sessions and in-progress time until you
            pause; tabs, keys, and blurs count when a session ends.
          </p>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                content={({ active }) => <InteractionWeekTooltip active={active} iw={iw} />}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {metricData.map((entry, index) => (
                  <Cell key={`c-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
