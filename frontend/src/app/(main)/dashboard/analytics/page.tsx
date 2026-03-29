"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Flame, Clock, Target, BrainCircuit, Activity, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Table2 } from "lucide-react";
import { getToken, api, isUnauthorized } from "@/lib/api";

type Data = {
  total_minutes_studied: number;
  topics_completed: number;
  daily_focus: { date: string; minutes: number; tab_switches: number; keyboard_inputs: number; mouse_movements: number; window_blurs: number }[];
  monthly_focus: { date: string; minutes: number; tab_switches: number; keyboard_inputs: number; mouse_movements: number; window_blurs: number }[];
  avg_session_minutes_last_week: number;
  avg_session_minutes_this_week: number;
  week_trend: string;
  current_streak: number;
  recommendation: string;
  total_mouse_movements: number;
  total_keyboard_inputs: number;
  total_tab_changes: number;
  total_window_blurs: number;
};

const card = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, type: "spring", stiffness: 380, damping: 26 },
  }),
};

function formatIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-4 rounded-xl border border-white/10 bg-black/95 shadow-2xl min-w-[200px] backdrop-blur-xl">
        <p className="text-white font-bold mb-3 text-base border-b border-white/10 pb-2">{label}</p>
        <div className="space-y-2 text-sm">
          <p className="flex justify-between items-center"><span className="text-zinc-400">Focus Time</span> <span className="text-cyan-400 font-bold">{data.minutes}m</span></p>
          <p className="flex justify-between items-center"><span className="text-zinc-400">Tab Switches</span> <span className="text-emerald-400 font-medium">{data.tab_switches}</span></p>
          <p className="flex justify-between items-center"><span className="text-zinc-400">Keystrokes</span> <span className="text-cyan-200 font-medium">{data.keyboard_inputs}</span></p>
          <p className="flex justify-between items-center" title="A blur occurs when you switch to another application or window">
            <span className="text-zinc-400 border-b border-dotted border-zinc-600 cursor-help">Window Blurs</span> 
            <span className="text-amber-400 font-medium">{data.window_blurs}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [graphView, setGraphView] = useState<"weekly" | "monthly">("weekly");
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayData, setDayData] = useState<any[]>([]);

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

    // Fetch active calendar days
    api<string[]>("/analytics/calendar/days")
      .then(setActiveDays)
      .catch(console.error);
  }, [router]);

  useEffect(() => {
    if (selectedDate) {
      api<any[]>(`/analytics/calendar/day?date=${selectedDate}`)
        .then(setDayData)
        .catch(console.error);
    } else {
      setDayData([]);
    }
  }, [selectedDate]);

  if (err)
    return (
      <div className="glass-panel rounded-[2rem] p-8 text-center text-amber-300 border border-amber-500/20">{err}</div>
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
    { icon: Clock, label: "Timer + logged", value: `${data.total_minutes_studied}m`, accent: "from-cyan-500/20 to-blue-500/10" },
    { icon: Flame, label: "Day streak", value: data.current_streak, accent: "from-orange-500/20 to-amber-500/10" },
    { icon: Target, label: "Topics done", value: data.topics_completed, accent: "from-emerald-500/20 to-teal-500/10" },
    { icon: BrainCircuit, label: "Week trend", value: data.week_trend, accent: "from-violet-500/20 to-fuchsia-500/10" },
  ];

  const microCards = [
    { label: "Mouse Inputs", value: data.total_mouse_movements },
    { label: "Keystrokes", value: data.total_keyboard_inputs },
    { label: "Tab Switches", value: data.total_tab_changes },
    { label: "Window Blurs", value: data.total_window_blurs },
  ];

  const chartData = graphView === "weekly" ? data.daily_focus : data.monthly_focus;

  // Calendar rendering logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);
  
  // Calculate specific metric averages for the new Vertical Bar Graph
  const activeFocusData = graphView === "monthly" ? data.monthly_focus : data.daily_focus;
  
  const computeAvg = (key: "minutes" | "tab_switches" | "keyboard_inputs" | "window_blurs") => {
    return activeFocusData.reduce((acc, d) => acc + d[key], 0) / (activeFocusData.length || 1);
  };
  
  const metricData = [
    { name: "Focus Time", value: Math.round(computeAvg("minutes") * 10) / 10, fill: "#22d3ee" },
    { name: "Tabs", value: Math.round(computeAvg("tab_switches") * 10) / 10, fill: "#34d399" },
    { name: "Keys", value: Math.round(computeAvg("keyboard_inputs") * 10) / 10, fill: "#a78bfa" },
    { name: "Blurs", value: Math.round(computeAvg("window_blurs") * 10) / 10, fill: "#fbbf24" }
  ];

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-cyan-400/90 mb-2">
          <Activity className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">Signal</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="gradient-text">Learning</span>{" "}
          <span className="text-slate-900 dark:text-white">analysis</span>
        </h1>
        <p className="text-zinc-500 mt-2 max-w-xl">Timer, goals, daily breakdowns, and topic progress — distilled.</p>
        <motion.p
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
          className="mt-6 text-sm text-cyan-100/90 glass-panel rounded-[1.5rem] p-5 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent"
        >
          {data.recommendation}
        </motion.p>
      </motion.div>

      {/* Daily Calendar & Activity Breakdown Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel p-6 md:p-8 rounded-[2rem] flex flex-col lg:flex-row gap-8 lg:gap-12"
      >
        <div className="w-full lg:w-80 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-cyan-400" /> Calendar
            </h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} 
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-sm font-medium w-24 text-center text-slate-300">
                {currentMonth.toLocaleString('default', { month: 'short' })} {year}
              </div>
              <button 
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} 
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-sm mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} className="font-semibold text-zinc-600 text-[11px] uppercase tracking-wider">{d}</div>
            ))}
            {blanksArray.map(b => (
              <div key={`b-${b}`} className="aspect-square" />
            ))}
            {daysArray.map(d => {
               const iso = formatIso(year, month, d);
               const cellDate = new Date(year, month, d);
               
               const today = new Date();
               today.setHours(0,0,0,0);
               
               if (cellDate > today) {
                 return <div key={d} className="aspect-square" />; // Hide future dates empty
               }

               const hasAct = activeDays.includes(iso);
               const isSel = selectedDate === iso;
               
               let baseClasses = "aspect-square rounded-full flex items-center justify-center font-medium transition-all text-sm cursor-pointer ";
               let stateClasses = "";
               
               if (isSel) {
                 stateClasses = "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/25";
               } else if (hasAct) {
                 stateClasses = "bg-white/5 text-cyan-300 hover:bg-white/10 hover:scale-110 border border-cyan-500/20";
               } else {
                 stateClasses = "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"; // Past date, no activity
               }
               
               return (
                 <button 
                   key={d} 
                   onClick={() => setSelectedDate(iso)}
                   className={baseClasses + stateClasses}
                 >
                   {d}
                 </button>
               )
            })}
          </div>
          
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-xs text-zinc-500 italic mt-4 text-center">
              Future dates are hidden. Select any past date to view topic granularity.
            </p>
          </div>
        </div>

        {/* Activity Table */}
        <div className="flex-1 w-full border-t lg:border-t-0 lg:border-l border-white/[0.06] pt-8 lg:pt-0 lg:pl-10">
          {!selectedDate ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
              <CalendarIcon className="w-12 h-12 opacity-20 mb-4" />
              <p>Select an active date from the calendar to view its detailed breakdowns.</p>
            </div>
          ) : (
            <div className="h-full flex flex-col relative w-full overflow-hidden">
              <h4 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
                <Table2 className="w-6 h-6 text-emerald-400"/> 
                Activity on {new Date(selectedDate + "T12:00:00").toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h4>
              
              {dayData.length === 0 ? (
                <p className="text-zinc-500 bg-white/[0.02] p-6 rounded-2xl border border-white/5">No granular payload found for this specific date.</p>
              ) : (
                <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-black/20 dark:bg-white/[0.03] text-zinc-400">
                      <tr>
                        <th className="px-4 py-3 font-medium rounded-l-xl">Topic</th>
                        <th className="px-4 py-3 font-medium">Module</th>
                        <th className="px-4 py-3 font-medium">Focus Time</th>
                        <th className="px-4 py-3 font-medium text-emerald-300">Tab Sw.</th>
                        <th className="text-left font-medium text-cyan-200">Keys</th>
                        <th className="text-left font-medium text-amber-200 rounded-r-xl">Blurs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {dayData.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] group transition-colors">
                          <td className="px-4 py-4 text-slate-200 font-medium truncate max-w-[140px]" title={row.topic_name}>{row.topic_name}</td>
                          <td className="px-4 py-4 text-zinc-500 truncate max-w-[120px]" title={row.module_name}>{row.module_name}</td>
                          <td className="px-4 py-4 text-cyan-400 font-semibold gap-1 inline-flex items-center">
                            {(row.focus_time_seconds / 60).toFixed(1)} <span className="text-[10px] uppercase text-zinc-600">min</span>
                          </td>
                          <td className="px-4 py-4 text-emerald-400/80 group-hover:text-emerald-300 font-medium">{row.tab_switches}</td>
                          <td className="py-4 text-cyan-400 font-medium">{row.keyboard_inputs}</td>
                          <td className="py-4 text-amber-400 font-medium">{row.window_blurs}</td>
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

      {/* Graph Section (Vertical generic metric averages graph) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel p-6 md:p-8 rounded-[2rem] w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" /> Interaction Metric Averages
            </h3>
            <p className="text-zinc-500 text-sm mt-1">
              Average daily metrics computed across your {graphView === "weekly" ? "past week" : "past month"} of study.
            </p>
          </div>
          <div className="flex bg-black/[0.03] dark:bg-white/[0.02] p-1.5 rounded-full border border-black/5 dark:border-white/5 text-sm font-medium shrink-0 max-w-max">
            <button
              onClick={() => setGraphView("weekly")}
              className={`px-5 py-2 rounded-full transition-all ${
                graphView === "weekly"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-md border border-cyan-500/30"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setGraphView("monthly")}
              className={`px-5 py-2 rounded-full transition-all ${
                graphView === "monthly"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-md border border-cyan-500/30"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className="h-[280px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{ backgroundColor: "#000", border: "1px solid #333", borderRadius: "8px", color: "#fff" }}
                formatter={(value: any, name: any, props: any) => [
                  <span key="val" style={{ color: props.payload.fill, fontWeight: 'bold' }}>{value}</span>, 
                  props.payload.name === "Focus Time" ? "Minutes" : "Count"
                ]}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {metricData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
